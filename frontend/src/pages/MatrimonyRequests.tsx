import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Loader2, Check, X, Shield, Inbox, Send, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"

interface ConnectionRequest {
  id: string
  sender_profile_id: string
  receiver_profile_id: string
  status: string
  self_approved_at: string | null
  family_approved_at: string | null
  family_co_approver_profile_id: string | null
  created_at: string
  updated_at: string
  sender?: {
    id: string
    full_name: string
    profile_photo_url: string
    gender: string
    username: string
  }
  receiver?: {
    id: string
    full_name: string
    profile_photo_url: string
    gender: string
    username: string
  }
  family_co_approver?: {
    id: string
    full_name: string
    profile_photo_url: string
    gender: string
    username: string
  }
}

export default function MatrimonyRequests() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing" | "guardian_invitations" >("incoming")
  const [actioningId, setActioningId] = useState<string | null>(null)

  const { data, isLoading, refetch } = useQuery<{ incoming: ConnectionRequest[]; outgoing: ConnectionRequest[] }>({
    queryKey: ["connection-requests"],
    queryFn: async () => {
      const res = await api.get("/matrimony/requests")
      return res.data
    },
  })

  const { data: invitations, isLoading: loadingInvitations, refetch: refetchInvitations } = useQuery<any[]>({
    queryKey: ["guardian-invitations"],
    queryFn: async () => {
      const res = await api.get("/matrimony/co-approver-invitations")
      return res.data
    },
  })

  const handleAction = async (requestId: string, action: "approve" | "reject") => {
    setActioningId(requestId)
    try {
      await api.post(`/matrimony/requests/${requestId}/action`, { action })
      toast.success(`Request ${action}d successfully.`)
      refetch()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || `Failed to ${action} request.`)
    } finally {
      setActioningId(null)
    }
  }

  const handleInvitationAction = async (profileId: string, action: "accept" | "decline") => {
    setActioningId(profileId)
    try {
      await api.post(`/matrimony/co-approver-invitations/${profileId}/action`, { action })
      toast.success(`Invitation ${action}ed successfully.`)
      refetchInvitations()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || `Failed to ${action} invitation.`)
    } finally {
      setActioningId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20">Approved / Connected</Badge>
      case "pending_self_approval":
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border-blue-500/20">Pending Your Approval</Badge>
      case "pending_family_approval":
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border-amber-500/20">Awaiting Family Approval</Badge>
      case "declined_by_self":
      case "declined_by_family":
        return <Badge variant="destructive">Declined</Badge>
      default:
        return <Badge variant="secondary">{status.replace(/_/g, " ")}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2 text-xs">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Matches
        </Button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Matrimony Requests</h1>
          <p className="text-sm text-muted-foreground">
            Manage your incoming requests, view outgoing status, or manage family co-approval invitations.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="w-full">
            {/* Tabs Header */}
            <div className="flex w-full border-b border-border mb-6 flex-wrap gap-1">
              <button
                onClick={() => setActiveTab("incoming")}
                className={cn(
                  "px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5",
                  activeTab === "incoming" 
                    ? "border-foreground text-foreground" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Inbox className="h-3.5 w-3.5" /> Incoming ({data?.incoming?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("outgoing")}
                className={cn(
                  "px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5",
                  activeTab === "outgoing" 
                    ? "border-foreground text-foreground" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Send className="h-3.5 w-3.5" /> Outgoing ({data?.outgoing?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("guardian_invitations")}
                className={cn(
                  "px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5",
                  activeTab === "guardian_invitations" 
                    ? "border-foreground text-foreground" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Shield className="h-3.5 w-3.5" /> Guardian Invitations ({invitations?.length || 0})
              </button>
            </div>

            {/* Incoming Tab Content */}
            {activeTab === "incoming" && (
              <div className="space-y-4">
                {data?.incoming && data.incoming.length > 0 ? (
                  data.incoming.map((req) => {
                    const isUserCoApprover = req.family_co_approver_profile_id && user && req.family_co_approver?.username === user.username
                    const showActionButtons = 
                      (req.status === "pending_self_approval" && !isUserCoApprover) ||
                      (req.status === "pending_family_approval" && isUserCoApprover)

                    const initials = req.sender?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"

                    return (
                      <Card key={req.id} className="border border-border shadow-none bg-card">
                        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border border-border">
                              <AvatarImage src={req.sender?.profile_photo_url} />
                              <AvatarFallback className="bg-muted text-foreground text-sm font-semibold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-sm text-foreground">{req.sender?.full_name}</h3>
                              {req.sender?.username && (
                                <p className="text-[10px] text-muted-foreground font-mono">@{req.sender.username}</p>
                              )}
                              <div className="flex items-center gap-1.5 mt-1.5">
                                {getStatusBadge(req.status)}
                                {isUserCoApprover && (
                                  <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-500/20 bg-purple-500/5 font-normal flex items-center gap-0.5">
                                    <Shield className="h-2.5 w-2.5" /> Family Guardian Role
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {showActionButtons ? (
                            <div className="flex gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction(req.id, "reject")}
                                disabled={actioningId === req.id}
                                className="text-xs h-8 border-destructive/20 text-destructive hover:bg-destructive/10 flex-1 sm:flex-none"
                              >
                                <X className="h-3 w-3 mr-1" /> Decline
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleAction(req.id, "approve")}
                                disabled={actioningId === req.id}
                                className="text-xs h-8 flex-1 sm:flex-none"
                              >
                                <Check className="h-3 w-3 mr-1" /> 
                                {isUserCoApprover ? "Approve as Family" : "Approve"}
                              </Button>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground mt-1">
                              {req.status === "pending_family_approval" && !isUserCoApprover && (
                                <p className="flex items-center gap-1 italic">
                                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                                  Awaiting approval from your designated guardian (@{req.family_co_approver?.username})
                                </p>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })
                ) : (
                  <div className="text-center py-16 bg-card border border-border rounded-xl">
                    <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <p className="text-muted-foreground text-sm">No incoming requests.</p>
                  </div>
                )}
              </div>
            )}

            {/* Outgoing Tab Content */}
            {activeTab === "outgoing" && (
              <div className="space-y-4">
                {data?.outgoing && data.outgoing.length > 0 ? (
                  data.outgoing.map((req) => {
                    const initials = req.receiver?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"

                    return (
                      <Card key={req.id} className="border border-border shadow-none bg-card">
                        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border border-border">
                              <AvatarImage src={req.receiver?.profile_photo_url} />
                              <AvatarFallback className="bg-muted text-foreground text-sm font-semibold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-sm text-foreground">{req.receiver?.full_name}</h3>
                              {req.receiver?.username && (
                                <p className="text-[10px] text-muted-foreground font-mono">@{req.receiver.username}</p>
                              )}
                              <div className="mt-1">
                                {getStatusBadge(req.status)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-xs text-muted-foreground italic mt-1 font-medium">
                            {req.status === "pending_family_approval" && (
                              <p className="flex items-center gap-1">
                                Awaiting family approval from @{req.family_co_approver?.username}
                              </p>
                            )}
                            {req.status === "approved" && (
                              <p className="text-emerald-600 font-medium">
                                Connected! Contact details unlocked.
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                ) : (
                  <div className="text-center py-16 bg-card border border-border rounded-xl">
                    <Send className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <p className="text-muted-foreground text-sm">No outgoing requests sent yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Guardian Invitations Tab Content */}
            {activeTab === "guardian_invitations" && (
              <div className="space-y-4">
                {loadingInvitations ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  </div>
                ) : invitations && invitations.length > 0 ? (
                  invitations.map((inv) => {
                    const initials = inv.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?"
                    return (
                      <Card key={inv.profile_id} className="border border-border shadow-none bg-card">
                        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border border-border">
                              <AvatarImage src={inv.profile_photo_url} />
                              <AvatarFallback className="bg-muted text-foreground text-sm font-semibold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-sm text-foreground">{inv.full_name}</h3>
                              {inv.username && (
                                <p className="text-[10px] text-muted-foreground font-mono">@{inv.username}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 italic">
                                Requested you as their Matrimony Family Co-approver
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleInvitationAction(inv.profile_id, "decline")}
                              disabled={actioningId === inv.profile_id}
                              className="text-xs h-8 border-destructive/20 text-destructive hover:bg-destructive/10 flex-1 sm:flex-none"
                            >
                              <X className="h-3 w-3 mr-1" /> Decline
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleInvitationAction(inv.profile_id, "accept")}
                              disabled={actioningId === inv.profile_id}
                              className="text-xs h-8 flex-1 sm:flex-none"
                            >
                              <Check className="h-3 w-3 mr-1" /> Accept
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                ) : (
                  <div className="text-center py-16 bg-card border border-border rounded-xl">
                    <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <p className="text-muted-foreground text-sm">No pending guardian co-approver invitations.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
