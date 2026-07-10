import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useTranslation } from "@/contexts/LanguageContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Check,
  X,
  Plus,
  Loader2,
  Inbox,
  Clock,
  Shield,
  Send,
  Trash2
} from "lucide-react"
import { toast } from "sonner"

export default function MatrimonyRequests() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<"inbox" | "outgoing" | "pending_approvals" | "guardian_view">("inbox")
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const { data, isLoading } = useQuery<any>({
    queryKey: ["connection-requests-center"],
    queryFn: async () => {
      const res = await api.get("/matrimony/requests")
      return res.data
    },
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
    } finally {
      setActioningId(null)
    }
  }

  const handleCancel = async (id: string) => {
    setCancellingId(id)
    try {
      await cancelMutation.mutateAsync(id)
    } finally {
      setCancellingId(null)
    }
  }

  const incomingList = data?.incoming || []
  const outgoingList = data?.outgoing || []
  const allRequestsList = [...incomingList, ...outgoingList]

  const totalRequests = allRequestsList.length
  const newInterestsCount = incomingList.filter((r: any) => r.status === "pending_self_approval" || r.status === "pending_family_approval").length
  const connectedCount = allRequestsList.filter((r: any) => r.status === "approved").length
  const declinedCount = allRequestsList.filter((r: any) => r.status.startsWith("declined")).length
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
      <div className="flex border-b border-[#e2e8f0] gap-1 flex-wrap">
        <button
          onClick={() => setActiveTab("inbox")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "inbox" ? "border-[#0f172a] text-[#0f172a]" : "border-transparent text-[#64748b] hover:text-[#0f172a]"
          }`}
        >
          <Inbox className="h-4 w-4" />
          <span>{t("inbox")} ({incomingList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("outgoing")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "outgoing" ? "border-[#0f172a] text-[#0f172a]" : "border-transparent text-[#64748b] hover:text-[#0f172a]"
          }`}
        >
          <Send className="h-4 w-4" />
          <span>{t("sent")} ({outgoingList.length})</span>
          {outgoingPending > 0 && (
            <span className="ml-0.5 bg-amber-400 text-white text-[8px] font-extrabold rounded-full px-1.5 py-0.5 leading-none">
              {outgoingPending}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("pending_approvals")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "pending_approvals" ? "border-[#0f172a] text-[#0f172a]" : "border-transparent text-[#64748b] hover:text-[#0f172a]"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>{t("awaiting")} ({newInterestsCount})</span>
        </button>
        <button
          onClick={() => setActiveTab("guardian_view")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "guardian_view" ? "border-[#0f172a] text-[#0f172a]" : "border-transparent text-[#64748b] hover:text-[#0f172a]"
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>{t("guardian_view")}</span>
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
                      <div className="flex gap-4 items-start">
                        <Avatar className="h-12 w-12 border border-[#e2e8f0] shadow-sm shrink-0">
                          <AvatarImage src={req.sender?.profile_photo_url} />
                          <AvatarFallback className="text-xs bg-[#f1f5f9] font-bold">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-sm text-[#0f172a]">{req.sender?.full_name}</h4>
                          <p className="text-xs text-[#64748b] leading-tight font-medium">Connection proposal received.</p>
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
                      <div className="flex gap-4 items-start">
                        <Avatar className="h-12 w-12 border border-[#e2e8f0] shadow-sm shrink-0">
                          <AvatarImage src={req.receiver?.profile_photo_url} />
                          <AvatarFallback className="text-xs bg-[#f1f5f9] font-bold">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-sm text-[#0f172a]">{req.receiver?.full_name}</h4>
                          <p className="text-xs text-[#64748b] leading-tight font-medium">Interest expressed — awaiting their response.</p>
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
                        <div className="flex gap-4 items-start">
                          <Avatar className="h-12 w-12 border border-[#e2e8f0] shadow-sm shrink-0">
                            <AvatarImage src={req.sender?.profile_photo_url} />
                            <AvatarFallback className="text-xs bg-[#f1f5f9] font-bold">{initials}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-sm text-[#0f172a]">{req.sender?.full_name}</h4>
                            <p className="text-xs text-[#64748b] leading-tight font-medium">Waiting for your action.</p>
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
            <div className="text-center py-20 bg-white border border-[#e2e8f0] rounded-2xl shadow-sm text-[#64748b] text-xs font-medium">
              Guardian approval workflow is managed through your profile settings.
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
                onClick={() => navigate("/matrimony/edit")}
                className="w-full py-2.5 rounded-xl border border-dashed border-[#c6c6cd] hover:bg-[#f8fafc] text-xs font-bold text-[#64748b] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /><span>Add Guardian</span>
              </button>
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <Card className="border border-[#e2e8f0] rounded-2xl shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-[#e2e8f0] pb-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
                <Inbox className="h-4 w-4 text-[#0f172a]" /> Activity Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 text-center space-y-1">
                  <p className="text-2xl font-extrabold text-[#0f172a]">{totalRequests}</p>
                  <p className="text-[9px] uppercase font-bold text-[#64748b] tracking-wider">Proposals</p>
                </div>
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 text-center space-y-1">
                  <p className="text-2xl font-extrabold text-amber-500">{outgoingPending}</p>
                  <p className="text-[9px] uppercase font-bold text-[#64748b] tracking-wider">Sent / Pending</p>
                </div>
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 text-center space-y-1">
                  <p className="text-2xl font-extrabold text-[#10b981]">{connectedCount}</p>
                  <p className="text-[9px] uppercase font-bold text-[#64748b] tracking-wider">Connected</p>
                </div>
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 text-center space-y-1">
                  <p className="text-2xl font-extrabold text-[#ba1a1a]">{declinedCount}</p>
                  <p className="text-[9px] uppercase font-bold text-[#64748b] tracking-wider">Declined</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
