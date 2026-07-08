import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { VerificationRequest } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import {
  CheckSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronRight
} from "lucide-react"
import { toast } from "sonner"
import { getImageUrl } from "@/lib/utils"

type Action = "approve" | "reject" | "escalate" | null

type ExtendedRequest = VerificationRequest & {
  target_role?: string | null
  approval_count?: number
  region_name?: string | null
  escalated?: boolean
  escalation_reason?: string | null
}

export default function AdminVerification() {
  const queryClient = useQueryClient()
  const [activeRequest, setActiveRequest] = useState<ExtendedRequest | null>(null)
  const [action, setAction] = useState<Action>(null)
  const [comments, setComments] = useState("")
  const [selectedProfileRequest, setSelectedProfileRequest] = useState<ExtendedRequest | null>(null)

  // Fetch actual pending requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ["verification-pending-center"],
    queryFn: async () => {
      const res = await api.get<ExtendedRequest[]>("/verification/pending")
      return res.data
    },
    retry: false
  })

  const actionMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: Action }) => {
      if (type === "approve") await api.post(`/verification/${id}/approve`, { decision: "approved", comments })
      if (type === "reject") await api.post(`/verification/${id}/reject`, { decision: "rejected", comments })
      else if (type === "escalate") await api.post(`/verification/${id}/escalate`, { reason: comments })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-pending-center"] })
      setActiveRequest(null)
      setAction(null)
      setComments("")
      toast.success("Verification request processed successfully.")
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || "Action failed."
      toast.error(msg)
    }
  })

  const openAction = (req: ExtendedRequest, act: Action) => {
    setActiveRequest(req)
    setAction(act)
    setComments("")
  }

  // Filter requests dynamically
  const localAdminRequests = requests?.filter(r => r.target_role === "local_admin") || []
  const disputeRequests = requests?.filter(r => r.escalated || r.status === "escalated") || []
  const regularRequests = requests?.filter(r => r.target_role !== "local_admin" && !r.escalated && r.status !== "escalated") || []

  return (
    <div className="space-y-8 animate-fade-in text-[#0f172a]">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">
          Member Verification
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          Review, approve, reject, or escalate pending membership applications.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Pending Requests Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-[#e2e8f0] rounded-2xl p-6 bg-white shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-[#64748b]">
                Pending Approvals Queue
              </h3>
              <span className="px-2.5 py-1 rounded bg-[#f1f5f9] text-[#0f172a] text-xs font-bold">
                {regularRequests.length} Pending
              </span>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-[#0f172a]" />
                </div>
              ) : regularRequests.length === 0 ? (
                <div className="text-center py-10 text-[#64748b] bg-slate-50 rounded-2xl border border-dashed border-[#e2e8f0]">
                  No pending regular verification requests.
                </div>
              ) : (
                regularRequests.map((req) => {
                  const prof = req.profile
                  const initials = prof?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"

                  return (
                    <div
                      key={req.request_id}
                      className="bg-white border border-[#e2e8f0] rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm hover:border-[#a0aec0] transition-colors cursor-pointer"
                      onClick={() => setSelectedProfileRequest(req)}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-11 w-11 border border-[#e2e8f0] shadow-sm shrink-0">
                          <AvatarImage src={getImageUrl(prof?.profile_photo_url)} />
                          <AvatarFallback className="text-xs bg-[#f1f5f9] font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-[#0f172a] leading-none flex items-center gap-2">
                            <span>{prof?.full_name || "Unknown"}</span>
                            {req.matrimony?.opted_in && (
                              <Badge variant="secondary" className="bg-pink-100 text-pink-700 hover:bg-pink-200 border-pink-200 text-[8px] px-1 py-0 h-4 uppercase">
                                Matrimony
                              </Badge>
                            )}
                          </h4>
                          <p className="text-xs text-[#64748b]">
                            {prof?.address || "No region"} • <span className="font-semibold text-[#0f172a]">Step 1/3: Local Verification</span>
                          </p>
                          <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-[#10b981]/10 text-[#10b981]">
                            Family Vouch: Validated
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          className="border-[#e2e8f0] text-foreground hover:bg-muted text-xs font-semibold h-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            openAction(req, "escalate")
                          }}
                        >
                          Escalate
                        </Button>
                        <Button
                          className="bg-[#006c49] text-white hover:bg-[#005236] text-xs font-semibold h-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            openAction(req, "approve")
                          }}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}

              <div className="pt-4 text-center">
                <Button
                  variant="link"
                  className="text-[#0f172a] hover:text-[#64748b] text-xs font-bold p-0 flex items-center justify-center gap-1 mx-auto"
                >
                  <span>View All Requests</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stack of Cards */}
        <div className="space-y-8">
          {/* Card 1: Local Admin Activation */}
          {localAdminRequests.length > 0 && (
            <Card className="border border-[#e2e8f0] rounded-2xl shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-[#e2e8f0] pb-4 space-y-1">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-[#0f172a]" /> Local Admin Activation
                </CardTitle>
                <p className="text-[11px] text-[#64748b] leading-tight font-medium">
                  Requires 4 peer approvals to activate new regional admin.
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {localAdminRequests.map((req) => {
                  const prof = req.profile
                  const initials = prof?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"
                  return (
                    <div key={req.request_id} className="space-y-3 pb-3 border-b border-[#e2e8f0] last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between border border-[#e2e8f0] bg-[#f8fafc] rounded-xl p-4">
                        <div className="space-y-1 flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-[#e2e8f0] shadow-sm shrink-0">
                            <AvatarImage src={getImageUrl(prof?.profile_photo_url)} />
                            <AvatarFallback className="text-[10px] bg-[#f1f5f9] font-bold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="text-xs font-bold text-[#0f172a]">
                              {prof?.full_name || "Unknown"}
                            </h4>
                            <p className="text-[10px] text-[#64748b]">
                              {req.region_name || "No Region"}
                            </p>
                          </div>
                        </div>

                        <span className="inline-flex px-2.5 py-1 rounded text-xs font-bold bg-[#dae2fd] text-[#131b2e]">
                          {req.approval_count || 0}/4 Approvals
                        </span>
                      </div>

                      <Button
                        onClick={() => openAction(req, "approve")}
                        className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-semibold py-2.5 rounded-lg"
                      >
                        Cast Peer Approval
                      </Button>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Card 2: Dispute Resolution */}
          {disputeRequests.length > 0 && (
            <Card className="border border-[#e2e8f0] rounded-2xl shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-[#e2e8f0] pb-4 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-[#ba1a1a]" />
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#64748b]">
                    Dispute Resolution
                  </CardTitle>
                </div>
                <span className="text-[10px] font-bold text-[#64748b]">
                  My Region's Disputes
                </span>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {disputeRequests.map((req) => {
                  const prof = req.profile
                  return (
                    <div
                      key={req.request_id}
                      className="border border-[#e2e8f0] rounded-xl p-4 space-y-3 bg-[#f8fafc] hover:border-[#a0aec0] transition-colors cursor-pointer"
                      onClick={() => setSelectedProfileRequest(req)}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold text-[#0f172a]">
                          Identity Flag: Case #{req.request_id.slice(0, 4)}
                        </h4>
                        <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-[#ffdad6] text-[#ba1a1a]">
                          Escalated
                        </span>
                      </div>

                      <p className="text-xs text-[#0f172a] font-semibold">
                        Target: {prof?.full_name || "Unknown"}
                      </p>

                      {req.escalation_reason && (
                        <p className="text-xs text-[#64748b] leading-relaxed">
                          Reason: {req.escalation_reason}
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="outline"
                          className="flex-1 border-[#e2e8f0] text-rose-600 hover:bg-rose-50 text-[10px] font-bold h-7"
                          onClick={(e) => {
                            e.stopPropagation()
                            openAction(req, "reject")
                          }}
                        >
                          Reject
                        </Button>
                        <Button
                          className="flex-1 bg-[#006c49] text-white hover:bg-[#005236] text-[10px] font-bold h-7"
                          onClick={(e) => {
                            e.stopPropagation()
                            openAction(req, "approve")
                          }}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog open={!!activeRequest && !!action} onOpenChange={() => { setActiveRequest(null); setAction(null) }}>
        <DialogContent className="bg-white border border-[#e2e8f0]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0f172a]">
              {action === "approve" && <CheckCircle className="h-5 w-5 text-[#10b981]" />}
              {action === "reject" && <XCircle className="h-5 w-5 text-[#ba1a1a]" />}
              {action === "escalate" && <AlertTriangle className="h-5 w-5 text-[#f59e0b]" />}
              {action === "approve" ? "Approve" : action === "reject" ? "Reject" : "Escalate"} Verification
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748b]">
              {action === "approve" && `This will verify ${activeRequest?.profile?.full_name} and grant them community registry access.`}
              {action === "reject" && `This will decline ${activeRequest?.profile?.full_name}'s membership verification request.`}
              {action === "escalate" && "This will escalate the request to the Community Admin for final review."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-xs text-[#0f172a]">
              {action === "escalate" ? "Escalation Reason *" : "Comments (optional)"}
            </Label>
            <textarea
              className="w-full min-h-[100px] rounded-md border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] focus:outline-none focus:border-[#0f172a] resize-none"
              placeholder={action === "escalate" ? "Explain why this needs escalation..." : "Add any notes..."}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-[#e2e8f0] text-foreground hover:bg-muted" onClick={() => { setActiveRequest(null); setAction(null) }}>
              Cancel
            </Button>
            <Button
              className={action === "reject" ? "bg-[#ba1a1a] text-white hover:bg-[#93000a]" : "bg-[#0f172a] text-white hover:bg-[#1e293b]"}
              onClick={() => activeRequest && actionMutation.mutate({ id: activeRequest.request_id, type: action })}
              disabled={actionMutation.isPending || (action === "escalate" && !comments)}
            >
              {actionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm {action === "approve" ? "Approval" : action === "reject" ? "Rejection" : "Escalation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Details Dialog */}
      <Dialog open={!!selectedProfileRequest} onOpenChange={(open) => !open && setSelectedProfileRequest(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto border border-[#e2e8f0] bg-white p-6 rounded-2xl text-[#0f172a]">
          {selectedProfileRequest && (
            <div className="space-y-6">
              <DialogHeader className="pb-4 border-b border-[#e2e8f0] text-left">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border border-[#e2e8f0] shadow-sm">
                    <AvatarImage src={getImageUrl(selectedProfileRequest.profile?.profile_photo_url)} />
                    <AvatarFallback className="text-xl bg-[#f1f5f9] font-bold">
                      {selectedProfileRequest.profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-lg font-bold text-[#0f172a]">
                      {selectedProfileRequest.profile?.full_name || "Unknown Member"}
                    </DialogTitle>
                    <p className="text-xs text-[#64748b] mt-0.5">
                      Pending Identity Verification
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                {/* Core Details */}
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider">Personal Information</h4>
                  <div className="bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Phone Number</span>
                      <span className="font-semibold text-[#0f172a]">{selectedProfileRequest.profile?.contact_number || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Date of Birth</span>
                      <span className="font-semibold text-[#0f172a]">
                        {selectedProfileRequest.profile?.date_of_birth
                          ? new Date(selectedProfileRequest.profile.date_of_birth).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Gender</span>
                      <span className="font-semibold text-[#0f172a] capitalize">{selectedProfileRequest.profile?.gender || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Occupation</span>
                      <span className="font-semibold text-[#0f172a]">{selectedProfileRequest.profile?.occupation || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Residential Address</span>
                      <span className="font-semibold text-[#0f172a] text-right max-w-[200px] truncate" title={selectedProfileRequest.profile?.address}>
                        {selectedProfileRequest.profile?.address || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Matrimony Details */}
                {selectedProfileRequest.matrimony?.opted_in && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider">Matrimony Opt-In Details</h4>
                    <div className="bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#64748b]">Height</span>
                        <span className="font-semibold text-[#0f172a]">{selectedProfileRequest.matrimony.height_cm ? `${selectedProfileRequest.matrimony.height_cm} cm` : "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748b]">Gotra</span>
                        <span className="font-semibold text-[#0f172a]">{selectedProfileRequest.matrimony.gotra || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748b]">Qualification</span>
                        <span className="font-semibold text-[#0f172a] capitalize">{selectedProfileRequest.matrimony.highest_qualification || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748b]">Employment</span>
                        <span className="font-semibold text-[#0f172a] capitalize">{selectedProfileRequest.matrimony.employment_type || "—"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons inside Details Modal */}
              <div className="flex justify-end gap-2 pt-4 border-t border-[#e2e8f0]">
                <Button
                  variant="outline"
                  className="border-[#e2e8f0] text-rose-600 hover:bg-rose-50 text-xs font-semibold h-9 px-4 rounded-lg"
                  onClick={() => {
                    setSelectedProfileRequest(null)
                    openAction(selectedProfileRequest, "reject")
                  }}
                >
                  Reject
                </Button>
                <Button
                  variant="outline"
                  className="border-[#e2e8f0] text-[#f59e0b] hover:bg-amber-50 text-xs font-semibold h-9 px-4 rounded-lg"
                  onClick={() => {
                    setSelectedProfileRequest(null)
                    openAction(selectedProfileRequest, "escalate")
                  }}
                >
                  Escalate
                </Button>
                <Button
                  className="bg-[#006c49] text-white hover:bg-[#005236] text-xs font-semibold h-9 px-4 rounded-lg"
                  onClick={() => {
                    setSelectedProfileRequest(null)
                    openAction(selectedProfileRequest, "approve")
                  }}
                >
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
