import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useNavigate } from "react-router-dom"
import {
  Users,
  Heart,
  Clock,
  Landmark,
  Shield,
  Loader2,
  ArrowRight,
  Camera
} from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

export default function Dashboard() {
  const { user, refreshUser, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [loadingInvId, setLoadingInvId] = useState<string | null>(null)

  // Fetch admin stats if user is admin
  const { data: adminStats, isLoading: loadingAdminStats } = useQuery({
    queryKey: ["dashboard-admin-stats"],
    queryFn: async () => {
      const res = await api.get("/admin/dashboard")
      return res.data
    },
    enabled: isAdmin,
    retry: false
  })

  // Fetch verified pending list for admin feed
  const { data: pendingVerifications, isLoading: loadingPendingVer } = useQuery({
    queryKey: ["dashboard-pending-verifications"],
    queryFn: async () => {
      const res = await api.get("/verification/pending")
      return res.data
    },
    enabled: isAdmin,
    retry: false
  })

  // Fetch user requests if standard member
  const { data: connectionData, isLoading: loadingConn } = useQuery({
    queryKey: ["dashboard-connection-requests"],
    queryFn: async () => {
      const res = await api.get("/matrimony/requests")
      return res.data
    },
    enabled: !isAdmin,
    retry: false
  })

  const pendingGuardianRequests = user?.wards?.filter(w => !w.approved) || []

  const handleDashboardInvitation = async (profileId: string, action: "accept" | "decline") => {
    setLoadingInvId(profileId)
    try {
      await api.post(`/matrimony/co-approver-invitations/${profileId}/action`, { action })
      toast.success(`Invitation ${action}ed successfully.`)
      await refreshUser()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || `Failed to ${action} invitation.`)
    } finally {
      setLoadingInvId(null)
    }
  }


  return (
    <div className="space-y-8 animate-fade-in text-[#0f172a]">
      {/* Hero Welcome & Verification Level Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">
              {isAdmin ? "Welcome back, Admin." : `Welcome back, ${user?.full_name?.split(" ")[0] || "User"}.`}
            </h1>
          </div>
        </div>
      </div>

      {/* Pending Guardian Invitations Block */}
      {pendingGuardianRequests.length > 0 && (
        <Card className="border border-purple-500/20 bg-purple-500/5 shadow-none rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-purple-700 flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-600" /> Pending Guardian Invitations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingGuardianRequests.map((req) => (
              <div key={req.profile_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-card border border-purple-500/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarFallback className="text-xs bg-purple-100 text-purple-700 font-semibold">
                      {req.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{req.full_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">@{req.username}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDashboardInvitation(req.profile_id, "decline")}
                    disabled={loadingInvId === req.profile_id}
                    className="text-xs h-8 border-destructive/20 text-destructive hover:bg-destructive/10"
                  >
                    {loadingInvId === req.profile_id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Decline"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDashboardInvitation(req.profile_id, "accept")}
                    disabled={loadingInvId === req.profile_id}
                    className="text-xs h-8 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {loadingInvId === req.profile_id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Accept & Confirm"}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Dynamic Statistics Row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isAdmin ? (
          <>
            {/* Admin Stats */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex justify-between items-start shadow-sm">
              <div className="space-y-2">
                <p className="text-xs uppercase font-bold text-[#64748b] tracking-wider">
                  Verified Members
                </p>
                <p className="text-3xl font-extrabold text-[#0f172a]">
                  {loadingAdminStats ? "..." : adminStats?.verified_users || 0}
                </p>
                <p className="text-xs text-[#64748b]">Total active directory size</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#f1f5f9] flex items-center justify-center text-[#0f172a]">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex justify-between items-start shadow-sm">
              <div className="space-y-2">
                <p className="text-xs uppercase font-bold text-[#64748b] tracking-wider">
                  Active Matrimonial
                </p>
                <p className="text-3xl font-extrabold text-[#0f172a]">
                  {loadingAdminStats ? "..." : adminStats?.matrimony_opt_ins || 0}
                </p>
                <p className="text-xs text-[#64748b]">Opted-in matrimonial matches</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#f1f5f9] flex items-center justify-center text-[#0f172a]">
                <Heart className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-[#0f172a] text-white rounded-2xl p-6 flex justify-between items-start shadow-sm sm:col-span-2 lg:col-span-1">
              <div className="space-y-2">
                <p className="text-xs uppercase font-bold text-[#64748b] tracking-wider">
                  Pending Approvals
                </p>
                <p className="text-3xl font-extrabold">
                  {loadingAdminStats ? "..." : adminStats?.pending_verifications || 0}
                </p>
                <p className="text-xs text-[#64748b] font-medium">Action required by Admins</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Standard User Stats */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex justify-between items-start shadow-sm">
              <div className="space-y-2">
                <p className="text-xs uppercase font-bold text-[#64748b] tracking-wider">
                  Incoming Requests
                </p>
                <p className="text-3xl font-extrabold text-[#0f172a]">
                  {loadingConn ? "..." : connectionData?.incoming?.length || 0}
                </p>
                <p className="text-xs text-[#64748b]">Matrimonial connection interests</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#f1f5f9] flex items-center justify-center text-[#0f172a]">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex justify-between items-start shadow-sm">
              <div className="space-y-2">
                <p className="text-xs uppercase font-bold text-[#64748b] tracking-wider">
                  Outgoing Requests
                </p>
                <p className="text-3xl font-extrabold text-[#0f172a]">
                  {loadingConn ? "..." : connectionData?.outgoing?.length || 0}
                </p>
                <p className="text-xs text-[#64748b]">Sent matrimonial proposals</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#f1f5f9] flex items-center justify-center text-[#0f172a]">
                <Heart className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-[#0f172a] text-white rounded-2xl p-6 flex justify-between items-start shadow-sm sm:col-span-2 lg:col-span-1">
              <div className="space-y-2">
                <p className="text-xs uppercase font-bold text-[#64748b] tracking-wider">
                  Linked Dependents
                </p>
                <p className="text-3xl font-extrabold">
                  {user?.wards?.length || 0}
                </p>
                <p className="text-xs text-[#64748b] font-medium">Assigned minor profiles</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Grid Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Right Column (Awaiting Actions / Recent Requests) */}
        <div className="space-y-6">
          <h2 className="text-xs font-bold text-[#64748b] uppercase tracking-wider px-1">
            {isAdmin ? "Awaiting Verification" : "Matrimony Requests"}
          </h2>

          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[384px]">
            <div className="space-y-6">
              {isAdmin ? (
                <>
                  {loadingPendingVer ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin text-[#0f172a]" />
                    </div>
                  ) : pendingVerifications && pendingVerifications.length > 0 ? (
                    pendingVerifications.slice(0, 3).map((req: any) => (
                      <div key={req.request_id} className="flex gap-4">
                        <Avatar className="h-9 w-9 border border-[#e2e8f0] shadow-sm shrink-0">
                          <AvatarImage src={req.profile?.profile_photo_url} />
                          <AvatarFallback className="text-xs bg-[#f1f5f9] font-bold">
                            {req.profile?.full_name?.split(" ").map((n: string) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-[#0f172a]">
                            {req.profile?.full_name}
                          </p>
                          <p className="text-[11px] text-[#64748b] leading-tight">
                            Requested verification from {req.profile?.address || "North Region"}.
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-xs text-[#64748b]">
                      No verifications awaiting review.
                    </div>
                  )}
                </>
              ) : (
                <>
                  {loadingConn ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin text-[#0f172a]" />
                    </div>
                  ) : connectionData?.incoming && connectionData.incoming.length > 0 ? (
                    connectionData.incoming.slice(0, 3).map((req: any) => (
                      <div key={req.id} className="flex gap-4">
                        <Avatar className="h-9 w-9 border border-[#e2e8f0] shadow-sm shrink-0">
                          <AvatarImage src={req.sender?.profile_photo_url} />
                          <AvatarFallback className="text-xs bg-[#f1f5f9] font-bold">
                            {req.sender?.full_name?.split(" ").map((n: string) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-[#0f172a]">
                            {req.sender?.full_name}
                          </p>
                          <p className="text-[11px] text-[#64748b] leading-tight">
                            Sent you a connection request.
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-xs text-[#64748b]">
                      No pending connection requests.
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="pt-4 border-t border-[#e2e8f0] text-center">
              <Button
                variant="link"
                className="text-[#0f172a] hover:text-[#64748b] text-xs font-bold p-0"
                onClick={() => navigate(isAdmin ? "/verification" : "/matrimony/requests")}
              >
                {isAdmin ? "Manage Verifications" : "View All Requests"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
