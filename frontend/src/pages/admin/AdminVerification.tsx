import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { VerificationRequest } from "@/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import { CheckSquare, CheckCircle, XCircle, AlertTriangle, Loader2, Calendar, Phone, MapPin, Briefcase, Heart } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

type Action = "approve" | "reject" | "escalate" | null

export default function AdminVerification() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [activeRequest, setActiveRequest] = useState<VerificationRequest | null>(null)
  const [action, setAction] = useState<Action>(null)
  const [comments, setComments] = useState("")

  const { data: requests, isLoading } = useQuery({
    queryKey: ["verification-pending"],
    queryFn: async () => {
      const res = await api.get<VerificationRequest[]>("/verification/pending")
      return res.data
    },
    refetchInterval: 20000,
  })

  const actionMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: Action }) => {
      if (type === "approve") await api.post(`/verification/${id}/approve`, { decision: "approved", comments })
      if (type === "reject") await api.post(`/verification/${id}/reject`, { decision: "rejected", comments })
      else if (type === "escalate") await api.post(`/verification/${id}/escalate`, { reason: comments })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-pending"] })
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] })
      setActiveRequest(null)
      setAction(null)
      setComments("")
    },
  })

  const statusBadge = (status: string, escalated: boolean) => {
    if (escalated) return { label: "Escalated", variant: "destructive" as const }
    const map: Record<string, { label: string; variant: "warning" | "info" | "success" | "destructive" }> = {
      pending: { label: "Pending", variant: "warning" },
      local_approved: { label: "Local Approved", variant: "info" },
      escalated: { label: "Escalated", variant: "destructive" },
    }
    return map[status] || { label: status, variant: "warning" }
  }

  const openAction = (req: VerificationRequest, act: Action) => {
    setActiveRequest(req)
    setAction(act)
    setComments("")
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <CheckSquare className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Verification Queue</h1>
        </div>
        <p className="text-muted-foreground">Review and act on pending membership verification requests.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : !requests?.length ? (
        <div className="text-center py-24">
          <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">All clear!</h2>
          <p className="text-muted-foreground">No pending verification requests at this time.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => {
            const prof = req.profile
            const badge = statusBadge(req.status, req.escalated)
            const initials = prof?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"
            const age = prof?.date_of_birth
              ? Math.floor((Date.now() - new Date(prof.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
              : null

            return (
              <Card key={req.request_id} className="glass-card overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 border border-white/10">
                      <AvatarImage src={prof?.profile_photo_url} />
                      <AvatarFallback className="gradient-primary text-white font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{prof?.full_name || "Unknown"}</h3>
                            {req.matrimony?.opted_in && (
                              <Badge variant="secondary" className="bg-pink-100 text-pink-700 hover:bg-pink-200 border-pink-200">
                                <Heart className="h-3 w-3 mr-1" /> Matrimony Opt-in
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Submitted {new Date(req.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-2 mb-4">
                        {[
                          { icon: Phone, val: prof?.contact_number },
                          { icon: MapPin, val: prof?.address },
                          { icon: Briefcase, val: prof?.occupation },
                          { icon: Calendar, val: prof?.date_of_birth ? `${new Date(prof.date_of_birth).toLocaleDateString()} (${age} yrs)` : null },
                        ].filter(i => i.val).map(({ icon: Icon, val }) => (
                          <div key={val} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{val}</span>
                          </div>
                        ))}
                      </div>

                      {req.matrimony?.opted_in && (
                        <div className="mb-4 p-3 rounded-lg bg-pink-50/50 border border-pink-100 text-sm">
                          <p className="text-xs font-semibold text-pink-700 mb-2">Matrimony Details</p>
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            {req.matrimony.height_cm && <div><span className="font-medium text-foreground">Height:</span> {req.matrimony.height_cm} cm</div>}
                            {req.matrimony.gotra && <div><span className="font-medium text-foreground">Gotra:</span> {req.matrimony.gotra}</div>}
                            {req.matrimony.highest_qualification && <div><span className="font-medium text-foreground">Education:</span> {req.matrimony.highest_qualification}</div>}
                            {req.matrimony.employment_type && <div><span className="font-medium text-foreground">Employment:</span> {req.matrimony.employment_type}</div>}
                          </div>
                        </div>
                      )}

                      {req.escalation_reason && (
                        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
                          <p className="text-xs font-semibold text-destructive mb-1">Escalation Reason</p>
                          <p className="text-muted-foreground">{req.escalation_reason}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="gradient"
                          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => openAction(req, "approve")}
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                          onClick={() => openAction(req, "reject")}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </Button>
                        {user?.role === "local_admin" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                            onClick={() => openAction(req, "escalate")}
                          >
                            <AlertTriangle className="h-3.5 w-3.5" /> Escalate
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={!!activeRequest && !!action} onOpenChange={() => { setActiveRequest(null); setAction(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {action === "approve" && <CheckCircle className="h-5 w-5 text-emerald-400" />}
              {action === "reject" && <XCircle className="h-5 w-5 text-destructive" />}
              {action === "escalate" && <AlertTriangle className="h-5 w-5 text-amber-400" />}
              {action === "approve" ? "Approve" : action === "reject" ? "Reject" : "Escalate"} Verification
            </DialogTitle>
            <DialogDescription>
              {action === "approve" && `This will verify ${activeRequest?.profile?.full_name} and grant them community access.`}
              {action === "reject" && `This will reject ${activeRequest?.profile?.full_name}'s membership request.`}
              {action === "escalate" && "This will escalate the request to the Community Admin for final review."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>{action === "escalate" ? "Escalation Reason *" : "Comments (optional)"}</Label>
            <textarea
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder={action === "escalate" ? "Explain why this needs escalation..." : "Add any notes..."}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActiveRequest(null); setAction(null) }}>Cancel</Button>
            <Button
              variant={action === "approve" ? "gradient" : "outline"}
              className={action === "reject" ? "border-destructive text-destructive hover:bg-destructive hover:text-white" : action === "escalate" ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10" : ""}
              onClick={() => activeRequest && actionMutation.mutate({ id: activeRequest.request_id, type: action })}
              disabled={actionMutation.isPending || (action === "escalate" && !comments)}
            >
              {actionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm {action === "approve" ? "Approval" : action === "reject" ? "Rejection" : "Escalation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
