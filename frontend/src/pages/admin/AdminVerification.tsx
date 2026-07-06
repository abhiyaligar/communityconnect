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
  ChevronRight,
  UserPlus
} from "lucide-react"
import { toast } from "sonner"

type Action = "approve" | "reject" | "escalate" | null

export default function AdminVerification() {
  const queryClient = useQueryClient()
  const [activeRequest, setActiveRequest] = useState<VerificationRequest | null>(null)
  const [action, setAction] = useState<Action>(null)
  const [comments, setComments] = useState("")

  // Fetch actual pending requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ["verification-pending-center"],
    queryFn: async () => {
      const res = await api.get<VerificationRequest[]>("/verification/pending")
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
      toast.error(err.response?.data?.detail || "Failed to process request.")
    }
  })



  const openAction = (req: any, act: Action) => {
    setActiveRequest(req)
    setAction(act)
    setComments("")
  }

  return (
    <div className="space-y-8 animate-fade-in text-[#0f172a]">
      {/* Header and Subtitle */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">
          Verification Center
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          Manage regional network integrity, process local approvals, and monitor peer activations.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Pending Requests Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-4 flex-wrap gap-3">
            <h2 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
              <span>Pending Requests Queue</span>
              <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#10b981]/15 text-[#006c49]">
                Region: North District
              </span>
            </h2>

            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f1f5f9] text-[#64748b]">
              {requests?.length || 0} Awaiting
            </span>
          </div>

          <div className="space-y-4">

            {/* 2. Render actual database pending requests (if any) */}
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-[#0f172a]" />
              </div>
            ) : (
              requests?.map((req) => {
                const prof = req.profile
                const initials = prof?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"

                return (
                  <div
                    key={req.request_id}
                    className="bg-white border border-[#e2e8f0] rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-11 w-11 border border-[#e2e8f0] shadow-sm shrink-0">
                        <AvatarImage src={prof?.profile_photo_url} />
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
                        className="border-[#e2e8f0] text-[#0f172a] hover:bg-[#f1f5f9] text-xs font-semibold h-8"
                        onClick={() => openAction(req, "escalate")}
                      >
                        Escalate
                      </Button>
                      <Button
                        className="bg-[#006c49] text-white hover:bg-[#005236] text-xs font-semibold h-8"
                        onClick={() => openAction(req, "approve")}
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

        {/* Right Column: Stack of Cards */}
        <div className="space-y-8">
          {/* Card 1: Local Admin Activation */}
          <Card className="border border-[#e2e8f0] rounded-2xl shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-[#e2e8f0] pb-4 space-y-1">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-[#0f172a]" /> Local Admin Activation
              </CardTitle>
              <p className="text-[11px] text-[#64748b] leading-tight font-medium">
                Requires 4 peer approvals to activate new regional admin.
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between border border-[#e2e8f0] bg-[#f8fafc] rounded-xl p-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-[#0f172a]">
                    Zaid Ali (North Region)
                  </h4>
                  {/* Peer Approvals List */}
                  <div className="flex items-center -space-x-1.5 pt-1">
                    <Avatar className="h-6 w-6 border-2 border-white shadow-sm">
                      <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde" />
                    </Avatar>
                    <Avatar className="h-6 w-6 border-2 border-white shadow-sm">
                      <AvatarImage src="https://images.unsplash.com/photo-1544005313-94ddf0286df2" />
                    </Avatar>
                    <Avatar className="h-6 w-6 border-2 border-white shadow-sm">
                      <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d" />
                    </Avatar>
                    <div className="h-6 w-6 rounded-full border-2 border-dashed border-[#c6c6cd] flex items-center justify-center bg-white text-muted-foreground">
                      <UserPlus className="h-3 w-3" />
                    </div>
                  </div>
                </div>

                <span className="inline-flex px-2.5 py-1 rounded text-xs font-bold bg-[#dae2fd] text-[#131b2e]">
                  3/4 Approvals
                </span>
              </div>

              <Button className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-semibold py-2.5 rounded-lg">
                Cast Peer Approval
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: Dispute Resolution */}
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
              <div className="border border-[#e2e8f0] rounded-xl p-4 space-y-3 bg-[#f8fafc]">
                <div className="flex justify-between items-start">
                  <h4 className="text-xs font-bold text-[#0f172a]">
                    Identity Flag: Case #4092
                  </h4>
                  <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-[#ffdad6] text-[#ba1a1a]">
                    Escalated
                  </span>
                </div>

                <p className="text-xs text-[#64748b] leading-relaxed">
                  Multiple reports regarding inaccurate family lineage claims b...
                </p>

                <div className="text-right">
                  <Button
                    variant="link"
                    className="text-[#0f172a] hover:text-[#64748b] text-[10px] font-bold p-0"
                  >
                    Review Case
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
            <Button variant="outline" className="border-[#e2e8f0] text-[#0f172a]" onClick={() => { setActiveRequest(null); setAction(null) }}>
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
    </div>
  )
}
