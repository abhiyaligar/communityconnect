import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useTranslation } from "@/contexts/LanguageContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Check,
  X,
  Plus,
  Loader2,
  Inbox,
  Clock,
  Shield,
  Send,
  Trash2,
  BookOpen,
  Phone,
  Briefcase,
  Sparkles,
  Heart,
  Search
} from "lucide-react"
import { toast } from "sonner"

export default function MatrimonyRequests() {
  const queryClient = useQueryClient()
  const { user, refreshUser } = useAuth()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<"inbox" | "outgoing" | "pending_approvals" | "guardian_view">("inbox")
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)

  // Guardian search & invitation state
  const [isGuardianModalOpen, setIsGuardianModalOpen] = useState(false)
  const [searchUsername, setSearchUsername] = useState("")
  const [searchResult, setSearchResult] = useState<any | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isSendingInvite, setIsSendingInvite] = useState(false)
  const [searchError, setSearchError] = useState("")

  const { data, isLoading } = useQuery<any>({
    queryKey: ["connection-requests-center"],
    queryFn: async () => {
      const res = await api.get("/matrimony/requests")
      return res.data
    },
    retry: false
  })

  const { data: guardianRecs, isLoading: isLoadingRecs, refetch: refetchRecs } = useQuery<any[]>({
    queryKey: ["guardian-recommendations-list"],
    queryFn: async () => {
      const res = await api.get("/matrimony/my-recommendations")
      return res.data
    },
    enabled: activeTab === "guardian_view",
    retry: false
  })

  // Get other person's details from selected request
  const otherUser = selectedRequest
    ? (selectedRequest.sender?.username === user?.username || activeTab === "outgoing"
      ? selectedRequest.receiver
      : selectedRequest.sender)
    : null

  // Fetch full details of the clicked user
  const { data: selectedProfile, isLoading: isLoadingProfile } = useQuery<any>({
    queryKey: ["request-profile-detail", otherUser?.username],
    queryFn: async () => {
      if (!otherUser?.username) return null
      const res = await api.get(`/profiles/by-username/${otherUser.username}`)
      return res.data
    },
    enabled: !!otherUser?.username,
    retry: false
  })

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approve" | "reject" }) => {
      await api.post(`/matrimony/requests/${id}/action`, { action })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connection-requests-center"] })
      toast.success("Request processed successfully.")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to process request.")
    }
  })


  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/matrimony/requests/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connection-requests-center"] })
      toast.success("Connection request cancelled successfully.")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to cancel request.")
    }
  })

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActioningId(id)
    try {
      await actionMutation.mutateAsync({ id, action })
      setSelectedRequest(null)
    } finally {
      setActioningId(null)
    }
  }

  const handleCancel = async (id: string) => {
    setCancellingId(id)
    try {
      await cancelMutation.mutateAsync(id)
      setSelectedRequest(null)
    } finally {
      setCancellingId(null)
    }
  }

  // Guardian management handlers
  const handleSearchGuardian = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchUsername.trim()) return
    setIsSearching(true)
    setSearchError("")
    setSearchResult(null)
    try {
      const res = await api.get(`/profiles/by-username/${searchUsername.trim()}`)
      setSearchResult(res.data)
    } catch (err: any) {
      setSearchError(err.response?.data?.detail || "User not found.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleSendGuardianInvite = async () => {
    if (!searchResult) return
    setIsSendingInvite(true)
    try {
      await api.put("/profiles/me", {
        family_co_approver_profile_id: searchResult.profile_id,
        double_approval_required: true
      })
      toast.success("Guardian invitation sent successfully.")
      setIsGuardianModalOpen(false)
      setSearchUsername("")
      setSearchResult(null)
      // Refresh session user structure
      if (typeof refreshUser === "function") {
        await refreshUser()
      } else {
        window.location.reload()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to send request.")
    } finally {
      setIsSendingInvite(false)
    }
  }

  const incomingList = data?.incoming || []
  const outgoingList = data?.outgoing || []

  const newInterestsCount = incomingList.filter((r: any) => r.status === "pending_self_approval" || r.status === "pending_family_approval").length
  const outgoingPending = outgoingList.filter((r: any) => !r.status.startsWith("declined") && r.status !== "approved").length

  const guardianName = user?.matrimony?.family_co_approver_name
  const guardianApproved = user?.matrimony?.family_co_approver_approved

  const getStatusBadgeClass = (status: string) => {
    if (status === "approved") return "bg-emerald-50 text-emerald-700 border border-emerald-200"
    if (status.startsWith("pending")) return "bg-amber-50 text-amber-700 border border-amber-200"
    if (status.startsWith("declined")) return "bg-rose-50 text-rose-700 border border-rose-200"
    return "bg-[#eceef0] text-[#0f172a]"
  }

  return (
    <div className="space-y-8 animate-fade-in text-[#0f172a]">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">{t("requests")}</h1>
        <p className="text-sm text-[#64748b] mt-1 max-w-3xl">
          Manage incoming interests, track outgoing requests, and monitor connection statuses.
          Guardian approvals are required for finalized steps.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e2e8f0] gap-1">
        <button
          onClick={() => { setActiveTab("inbox"); setSelectedRequest(null) }}
          title="Inbox"
          className={`relative px-4 py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${activeTab === "inbox" ? "border-[#0f172a] text-[#0f172a]" : "border-transparent text-[#64748b] hover:text-[#0f172a]"
            }`}
        >
          <Inbox className="h-5 w-5" />
          {incomingList.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-[#0f172a] text-white text-[8px] font-extrabold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
              {incomingList.length}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab("outgoing"); setSelectedRequest(null) }}
          title="Sent"
          className={`relative px-4 py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${activeTab === "outgoing" ? "border-[#0f172a] text-[#0f172a]" : "border-transparent text-[#64748b] hover:text-[#0f172a]"
            }`}
        >
          <Send className="h-5 w-5" />
          {outgoingPending > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-amber-400 text-white text-[8px] font-extrabold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
              {outgoingPending}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab("pending_approvals"); setSelectedRequest(null) }}
          title="Awaiting Approval"
          className={`relative px-4 py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${activeTab === "pending_approvals" ? "border-[#0f172a] text-[#0f172a]" : "border-transparent text-[#64748b] hover:text-[#0f172a]"
            }`}
        >
          <Clock className="h-5 w-5" />
          {newInterestsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[8px] font-extrabold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
              {newInterestsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab("guardian_view"); setSelectedRequest(null) }}
          title="Guardian View"
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center ${activeTab === "guardian_view" ? "border-[#0f172a] text-[#0f172a]" : "border-transparent text-[#64748b] hover:text-[#0f172a]"
            }`}
        >
          <Shield className="h-5 w-5" />
        </button>
      </div>


      {/* Grid */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">

          {/* ── INBOX ── */}
          {activeTab === "inbox" && (
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-[#0f172a]" /></div>
              ) : incomingList.length > 0 ? (
                incomingList.map((req: any) => {
                  const initials = req.sender?.full_name?.split(" ").map((n: string) => n[0]).join("")
                  const showActionButtons = req.status === "pending_self_approval" || req.status === "pending_family_approval"
                  return (
                    <div key={req.id} className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm relative overflow-hidden space-y-4">
                      <div className="absolute top-6 right-6">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusBadgeClass(req.status)}`}>
                          {req.status?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div
                        className="flex gap-4 items-start cursor-pointer group/item hover:opacity-95 transition-opacity"
                        onClick={() => setSelectedRequest(req)}
                      >
                        <Avatar className="h-12 w-12 border border-[#e2e8f0] shadow-sm shrink-0">
                          <AvatarImage src={req.sender?.profile_photo_url} />
                          <AvatarFallback className="text-xs bg-[#f1f5f9] font-bold">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-sm text-[#0f172a] group-hover/item:text-[#64748b] transition-colors">{req.sender?.full_name}</h4>
                          <p className="text-xs text-[#64748b] leading-tight font-medium">Connection proposal received. Click to review details.</p>
                          {req.sender?.username && <p className="text-[10px] text-[#94a3b8] font-mono">@{req.sender.username}</p>}
                        </div>
                      </div>
                      {showActionButtons && (
                        <div className="flex gap-2">
                          <Button
                            className="bg-[#0f172a] text-white hover:bg-[#1e293b] text-xs font-semibold px-4 h-9 gap-1.5 rounded-lg"
                            onClick={() => handleAction(req.id, "approve")}
                            disabled={actioningId === req.id}
                          >
                            {actioningId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            <span>{t("approve_interest")}</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="border-[#e2e8f0] text-[#0f172a] text-xs font-semibold px-4 h-9 gap-1.5 rounded-lg"
                            onClick={() => handleAction(req.id, "reject")}
                            disabled={actioningId === req.id}
                          >
                            <X className="h-4 w-4" /><span>{t("decline")}</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-20 bg-white border border-[#e2e8f0] rounded-2xl shadow-sm text-[#64748b] text-xs font-medium">
                  No connection proposals in your inbox.
                </div>
              )}
            </div>
          )}

          {/* ── OUTGOING ── */}
          {activeTab === "outgoing" && (
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-[#0f172a]" /></div>
              ) : outgoingList.length > 0 ? (
                outgoingList.map((req: any) => {
                  const initials = req.receiver?.full_name?.split(" ").map((n: string) => n[0]).join("")
                  const canCancel = req.status !== "approved"
                  return (
                    <div key={req.id} className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm relative overflow-hidden space-y-4">
                      <div className="absolute top-6 right-6">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusBadgeClass(req.status)}`}>
                          {req.status?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div
                        className="flex gap-4 items-start cursor-pointer group/item hover:opacity-95 transition-opacity"
                        onClick={() => setSelectedRequest(req)}
                      >
                        <Avatar className="h-12 w-12 border border-[#e2e8f0] shadow-sm shrink-0">
                          <AvatarImage src={req.receiver?.profile_photo_url} />
                          <AvatarFallback className="text-xs bg-[#f1f5f9] font-bold">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-sm text-[#0f172a] group-hover/item:text-[#64748b] transition-colors">{req.receiver?.full_name}</h4>
                          <p className="text-xs text-[#64748b] leading-tight font-medium">Interest expressed — Click to review details.</p>
                          {req.receiver?.username && <p className="text-[10px] text-[#94a3b8] font-mono">@{req.receiver.username}</p>}
                          <p className="text-[10px] text-[#94a3b8]">
                            Sent {new Date(req.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      {canCancel && (
                        <Button
                          variant="outline"
                          className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold px-4 h-9 gap-1.5 rounded-lg"
                          onClick={() => handleCancel(req.id)}
                          disabled={cancellingId === req.id}
                        >
                          {cancellingId === req.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          <span>{t("cancel_request")}</span>
                        </Button>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-20 bg-white border border-[#e2e8f0] rounded-2xl shadow-sm text-[#64748b] text-xs font-medium">
                  You have not sent any connection requests yet.
                </div>
              )}
            </div>
          )}

          {/* ── AWAITING APPROVALS ── */}
          {activeTab === "pending_approvals" && (
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-[#0f172a]" /></div>
              ) : incomingList.filter((r: any) => r.status === "pending_self_approval" || r.status === "pending_family_approval").length > 0 ? (
                incomingList
                  .filter((r: any) => r.status === "pending_self_approval" || r.status === "pending_family_approval")
                  .map((req: any) => {
                    const initials = req.sender?.full_name?.split(" ").map((n: string) => n[0]).join("")
                    return (
                      <div key={req.id} className="bg-white border border-amber-200 bg-amber-50/30 rounded-2xl p-6 shadow-sm relative overflow-hidden space-y-4">
                        <div className="absolute top-6 right-6">
                          <span className="inline-flex px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                            {req.status?.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div
                          className="flex gap-4 items-start cursor-pointer group/item hover:opacity-95 transition-opacity"
                          onClick={() => setSelectedRequest(req)}
                        >
                          <Avatar className="h-12 w-12 border border-[#e2e8f0] shadow-sm shrink-0">
                            <AvatarImage src={req.sender?.profile_photo_url} />
                            <AvatarFallback className="text-xs bg-[#f1f5f9] font-bold">{initials}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-sm text-[#0f172a] group-hover/item:text-[#64748b] transition-colors">{req.sender?.full_name}</h4>
                            <p className="text-xs text-[#64748b] leading-tight font-medium">Waiting for your action. Click to review details.</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            className="bg-[#0f172a] text-white hover:bg-[#1e293b] text-xs font-semibold px-4 h-9 gap-1.5 rounded-lg"
                            onClick={() => handleAction(req.id, "approve")}
                            disabled={actioningId === req.id}
                          >
                            {actioningId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            <span>{t("approve_interest")}</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="border-[#e2e8f0] text-[#0f172a] text-xs font-semibold px-4 h-9 gap-1.5 rounded-lg"
                            onClick={() => handleAction(req.id, "reject")}
                            disabled={actioningId === req.id}
                          >
                            <X className="h-4 w-4" /><span>{t("decline")}</span>
                          </Button>
                        </div>
                      </div>
                    )
                  })
              ) : (
                <div className="text-center py-20 bg-white border border-[#e2e8f0] rounded-2xl shadow-sm text-[#64748b] text-xs font-medium">
                  No requests pending your approval.
                </div>
              )}
            </div>
          )}

          {/* ── GUARDIAN VIEW ── */}
          {activeTab === "guardian_view" && (
            <div className="space-y-6">
              {isLoadingRecs ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-[#0f172a]" /></div>
              ) : guardianRecs && guardianRecs.length > 0 ? (
                guardianRecs.map((rec: any) => {
                  const initials = rec.profile?.full_name?.split(" ").map((n: string) => n[0]).join("")
                  return (
                    <div key={rec.recommendation_id} className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm relative overflow-hidden space-y-4">
                      <div className="flex gap-4 items-start cursor-pointer group/item hover:opacity-95 transition-opacity">
                        <Avatar className="h-12 w-12 border border-[#e2e8f0] shadow-sm shrink-0">
                          <AvatarImage src={rec.profile?.profile_photo_url} />
                          <AvatarFallback className="text-xs bg-[#f1f5f9] font-bold">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-sm text-[#0f172a] group-hover/item:text-[#64748b] transition-colors">
                            {rec.profile?.full_name}
                          </h4>
                          <p className="text-xs text-[#64748b] leading-tight font-medium">
                            Recommended by your guardian <span className="font-bold text-[#0f172a]">{rec.recommended_by?.guardian_name}</span>
                          </p>
                          {rec.profile?.username && <p className="text-[10px] text-[#94a3b8] font-mono">@{rec.profile.username}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        {rec.connection_status === "none" ? (
                          <Button
                            className="bg-[#0f172a] text-white hover:bg-[#1e293b] text-xs font-semibold px-4 h-9 gap-1.5 rounded-lg w-full"
                            onClick={() => {
                              api.post("/matrimony/requests", { receiver_profile_id: rec.profile_id })
                                .then(() => {
                                  toast.success("Connection request sent.")
                                  refetchRecs()
                                })
                                .catch((err) => toast.error(err.response?.data?.detail || "Action failed."))
                            }}
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>Request Connection</span>
                          </Button>
                        ) : (
                          <div className="w-full text-center p-2 rounded-lg bg-[#f8fafc] text-xs font-bold text-[#64748b] uppercase tracking-wider border border-[#e2e8f0]">
                            {rec.connection_status.replace(/_/g, " ")}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-20 bg-white border border-[#e2e8f0] rounded-2xl shadow-sm text-[#64748b] text-xs font-medium">
                  You have no recommendations by guardian
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-8">
          {/* My Guardians */}
          <Card className="border border-[#e2e8f0] rounded-2xl shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-[#e2e8f0] pb-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#0f172a]" /> My Guardians
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="divide-y divide-[#e2e8f0]">
                {guardianName ? (
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-[#e2e8f0] bg-[#eceef0] shrink-0">
                        <AvatarFallback className="text-xs font-bold text-[#0f172a]">
                          {guardianName.split(" ").map((n: string) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-xs font-bold text-[#0f172a]">{guardianName}</h4>
                        <p className="text-[10px] text-[#64748b] font-medium">
                          {guardianApproved ? "Active Guardian" : "Awaiting Acceptance"}
                        </p>
                      </div>
                    </div>
                    {guardianApproved && <Check className="h-4 w-4 text-[#10b981] shrink-0" />}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-[#64748b]">No family guardian designated yet.</div>
                )}
              </div>
              <button
                onClick={() => setIsGuardianModalOpen(true)}
                className="w-full py-2.5 rounded-xl border border-dashed border-[#c6c6cd] hover:bg-[#f8fafc] text-xs font-bold text-[#64748b] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /><span>Add Guardian</span>
              </button>
            </CardContent>
          </Card>

        </div>
      </div>



      {/* ── PROFILE DETAIL POPUP MODAL ── */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="w-[calc(100%-1rem)] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[#e2e8f0] bg-white px-2 py-4 sm:px-8 sm:py-8 rounded-2xl text-[#0f172a] shadow-2xl">

          {isLoadingProfile ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#0f172a]" />
              <p className="text-xs text-[#64748b] font-medium">Loading profile details...</p>
            </div>
          ) : selectedProfile ? (
            <div className="space-y-6">
              <DialogHeader className="pb-4 border-b border-[#e2e8f0] text-left">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 w-full">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border border-[#e2e8f0] shadow-md">
                      <AvatarImage src={selectedProfile.profile_photo_url} />
                      <AvatarFallback className="text-xl bg-[#f1f5f9] font-bold text-[#0f172a]">
                        {selectedProfile.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <DialogTitle className="text-xl font-bold text-[#0f172a]">
                        {selectedProfile.full_name}
                      </DialogTitle>
                      {selectedProfile.username && (
                        <p className="text-xs text-[#64748b] font-mono leading-none">
                          @{selectedProfile.username}
                        </p>
                      )}
                      <div className="flex gap-1.5 flex-wrap pt-1">
                        {selectedProfile.date_of_birth && (
                          <span className="text-[9px] font-bold px-2 py-0.5 bg-[#f1f5f9] text-[#0f172a] rounded">
                            {Math.floor((Date.now() - new Date(selectedProfile.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} Yrs
                          </span>
                        )}
                        <span className="text-[9px] font-bold px-2 py-0.5 border border-[#e2e8f0] capitalize rounded text-[#0f172a]">
                          {selectedProfile.gender}
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 border border-[#e2e8f0] capitalize rounded text-[#0f172a]">
                          {selectedProfile.marital_status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Header action badge */}
                  <div>
                    <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusBadgeClass(selectedRequest.status)}`}>
                      {selectedRequest.status?.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </DialogHeader>

              {/* Scrollable details body */}
              <div className="space-y-6 pt-2">
                {/* About me */}
                {selectedProfile.about_me && (
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-[#0f172a]" /> About Candidate
                    </h4>
                    <p className="text-xs text-[#0f172a] leading-relaxed bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl italic">
                      "{selectedProfile.about_me}"
                    </p>
                  </div>
                )}

                {/* Contact details (Only displayed if already connected/approved) */}
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-[#0f172a]" /> Contact details
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-4 bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl text-xs">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider mb-1">
                        Contact Number
                      </p>
                      <p className="font-semibold text-[#0f172a]">
                        {selectedProfile.contact_number || "Hidden until connected"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider mb-1">
                        Home Address
                      </p>
                      <p className="font-semibold text-[#0f172a]">
                        {selectedProfile.address || "Hidden until connected"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Personal & Physical stats */}
                {selectedProfile.matrimony_details && (
                  <>
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider flex items-center gap-1.5">
                        <Heart className="h-3.5 w-3.5 text-[#0f172a]" /> Personal Attributes
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl text-xs">
                        <div>
                          <p className="text-[10px] uppercase text-[#64748b] font-bold tracking-wider mb-0.5">Height</p>
                          <p className="font-semibold">{selectedProfile.matrimony_details.height_cm ? `${selectedProfile.matrimony_details.height_cm} cm` : "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-[#64748b] font-bold tracking-wider mb-0.5">Body Type</p>
                          <p className="font-semibold capitalize">{selectedProfile.matrimony_details.body_type || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-[#64748b] font-bold tracking-wider mb-0.5">Complexion</p>
                          <p className="font-semibold capitalize">{selectedProfile.matrimony_details.complexion || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-[#64748b] font-bold tracking-wider mb-0.5">Diet</p>
                          <p className="font-semibold capitalize">{selectedProfile.matrimony_details.diet || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-[#64748b] font-bold tracking-wider mb-0.5">Smoking</p>
                          <p className="font-semibold capitalize">{selectedProfile.matrimony_details.smoking || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-[#64748b] font-bold tracking-wider mb-0.5">Drinking</p>
                          <p className="font-semibold capitalize">{selectedProfile.matrimony_details.drinking || "—"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Education & Career */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-[#0f172a]" /> Education & Profession
                      </h4>
                      <div className="grid grid-cols-2 gap-4 bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl text-xs">
                        <div>
                          <p className="text-[10px] uppercase text-[#64748b] font-bold tracking-wider mb-0.5">Qualification</p>
                          <p className="font-semibold">{selectedProfile.matrimony_details.highest_qualification || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-[#64748b] font-bold tracking-wider mb-0.5">Field of Study</p>
                          <p className="font-semibold">{selectedProfile.matrimony_details.field_of_study || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-[#64748b] font-bold tracking-wider mb-0.5">Occupation</p>
                          <p className="font-semibold">{selectedProfile.occupation || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-[#64748b] font-bold tracking-wider mb-0.5">Annual Income</p>
                          <p className="font-semibold">{selectedProfile.matrimony_details.income_range || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-[#64748b] font-bold tracking-wider mb-0.5">Employment Type</p>
                          <p className="font-semibold capitalize">{selectedProfile.matrimony_details.employment_type || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-[#64748b] font-bold tracking-wider mb-0.5">Work Location</p>
                          <p className="font-semibold">{selectedProfile.matrimony_details.work_location || "—"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Horoscope details */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-[#0f172a]" /> Horoscope details
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl text-xs">
                        <div>
                          <p className="text-[10px] uppercase text-[#64748b] font-bold tracking-wider mb-0.5">Gotra</p>
                          <p className="font-semibold capitalize">{selectedProfile.matrimony_details.gotra || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-[#64748b] font-bold tracking-wider mb-0.5">Rashi</p>
                          <p className="font-semibold capitalize">{selectedProfile.matrimony_details.rashi || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-[#64748b] font-bold tracking-wider mb-0.5">Nakshatra</p>
                          <p className="font-semibold capitalize">{selectedProfile.matrimony_details.nakshatra || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-[#64748b] font-bold tracking-wider mb-0.5">Manglik Status</p>
                          <p className="font-semibold capitalize">{selectedProfile.matrimony_details.manglik_status || "—"}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Action buttons inside the modal */}
              <div className="pt-4 border-t border-[#e2e8f0] flex justify-end gap-3">
                {/* For incoming requests pending action */}
                {(activeTab === "inbox" || activeTab === "pending_approvals") &&
                  (selectedRequest.status === "pending_self_approval" || selectedRequest.status === "pending_family_approval") && (
                    <>
                      <Button
                        variant="outline"
                        className="border-[#e2e8f0] text-[#0f172a] text-xs font-semibold px-5 h-10 gap-1.5 rounded-xl"
                        onClick={() => handleAction(selectedRequest.id, "reject")}
                        disabled={actioningId === selectedRequest.id}
                      >
                        <X className="h-4 w-4" /><span>{t("decline")}</span>
                      </Button>
                      <Button
                        className="bg-[#0f172a] text-white hover:bg-[#1e293b] text-xs font-semibold px-5 h-10 gap-1.5 rounded-xl"
                        onClick={() => handleAction(selectedRequest.id, "approve")}
                        disabled={actioningId === selectedRequest.id}
                      >
                        {actioningId === selectedRequest.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        <span>{t("approve_interest")}</span>
                      </Button>
                    </>
                  )}

                {/* For outgoing requests that can be cancelled */}
                {activeTab === "outgoing" && selectedRequest.status !== "approved" && (
                  <Button
                    variant="outline"
                    className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold px-5 h-10 gap-1.5 rounded-xl"
                    onClick={() => handleCancel(selectedRequest.id)}
                    disabled={cancellingId === selectedRequest.id}
                  >
                    {cancellingId === selectedRequest.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    <span>{t("cancel_request")}</span>
                  </Button>
                )}

                <Button
                  variant="ghost"
                  className="text-xs font-semibold px-5 h-10 rounded-xl"
                  onClick={() => setSelectedRequest(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-[#64748b]">
              Failed to load profile.
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── ADD GUARDIAN DIALOG MODAL ── */}
      <Dialog open={isGuardianModalOpen} onOpenChange={(open) => !open && setIsGuardianModalOpen(false)}>
        <DialogContent className="max-w-md bg-white p-6 border border-[#e2e8f0] rounded-2xl text-[#0f172a] shadow-2xl">
          <DialogHeader className="pb-4 border-b border-[#e2e8f0]">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#0f172a]" /> Designate Family Guardian
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSearchGuardian} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                Search Member by Username
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
                  <Input
                    type="text"
                    placeholder="e.g., kiran_kumar"
                    value={searchUsername}
                    onChange={(e) => setSearchUsername(e.target.value)}
                    className="pl-9 h-10 bg-[#f8fafc] border-[#e2e8f0] rounded-xl text-xs placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary/30"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="bg-[#0f172a] hover:bg-[#1e293b] text-white h-10 text-xs font-semibold px-4 rounded-xl"
                  disabled={isSearching}
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </div>
            </div>
          </form>

          {/* Search Results */}
          <div className="py-4 space-y-4">
            {searchError && (
              <div className="p-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl font-medium">
                {searchError}
              </div>
            )}

            {searchResult && (
              <div className="p-4 border border-[#e2e8f0] bg-[#f8fafc] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-[#e2e8f0] shadow-sm">
                    <AvatarImage src={searchResult.profile_photo_url} />
                    <AvatarFallback className="text-xs bg-[#eceef0] font-bold">
                      {searchResult.full_name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-xs font-bold text-[#0f172a]">{searchResult.full_name}</h4>
                    <p className="text-[10px] text-[#64748b] font-mono">@{searchResult.username}</p>
                  </div>
                </div>

                <Button
                  className="bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-bold px-3 h-8 rounded-lg"
                  onClick={handleSendGuardianInvite}
                  disabled={isSendingInvite}
                >
                  {isSendingInvite ? <Loader2 className="h-3 animate-spin" /> : "Invite"}
                </Button>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-[#e2e8f0] flex justify-end">
            <Button
              variant="ghost"
              className="text-xs font-semibold px-4 h-9 rounded-xl"
              onClick={() => {
                setIsGuardianModalOpen(false)
                setSearchUsername("")
                setSearchResult(null)
                setSearchError("")
              }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
