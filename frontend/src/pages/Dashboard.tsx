import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useTranslation } from "@/contexts/LanguageContext"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useNavigate, Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Users,
  Heart,
  Clock,
  Shield,
  Loader2,
  X,
  Share2,
  Briefcase,
  Phone,
  Lock,
  BookOpen,
  Coffee,
  Star,
  CheckCircle
} from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"
import { getImageUrl } from "@/lib/utils"
import { MatrimonyEntry } from "@/types"

export default function Dashboard() {
  const { user, refreshUser, isAdmin } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [loadingInvId, setLoadingInvId] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<MatrimonyEntry | null>(null)
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null)

  // 1. Admin Queries
  const { data: adminStats, isLoading: loadingAdminStats } = useQuery({
    queryKey: ["dashboard-admin-stats"],
    queryFn: async () => {
      const res = await api.get("/admin/dashboard")
      return res.data
    },
    enabled: isAdmin,
    retry: false
  })

  const { data: pendingVerifications, isLoading: loadingPendingVer } = useQuery({
    queryKey: ["dashboard-pending-verifications"],
    queryFn: async () => {
      const res = await api.get("/verification/pending")
      return res.data
    },
    enabled: isAdmin,
    retry: false
  })

  // 2. Member Matrimony Queries
  const isOptedIn = !!user?.matrimony?.opted_in
  const approvedWards = user?.wards?.filter(w => w.approved) || []
  const hasWards = approvedWards.length > 0
  const isEligibleForMatches = isOptedIn || hasWards

  const [matchesList, setMatchesList] = useState<MatrimonyEntry[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const { data: newMatches, isLoading: loadingMatches, isFetching: isFetchingMatches } = useQuery<MatrimonyEntry[]>({
    queryKey: ["dashboard-matches-page", page],
    queryFn: async () => {
      const res = await api.get<MatrimonyEntry[]>(`/matrimony/matches?page=${page}&limit=10`)
      return res.data
    },
    enabled: !isAdmin && isEligibleForMatches && hasMore,
    retry: false
  })

  useEffect(() => {
    if (newMatches) {
      if (newMatches.length < 10) {
        setHasMore(false)
      }
      setMatchesList((prev) => {
        const ids = new Set(prev.map((p) => p.profile_id))
        const filtered = newMatches.filter((p) => !ids.has(p.profile_id))
        return [...prev, ...filtered]
      })
    }
  }, [newMatches])

  useEffect(() => {
    if (hasMore && !isFetchingMatches && matchesList.length > 0 && activeIndex >= matchesList.length - 3) {
      setPage((prev) => prev + 1)
    }
  }, [activeIndex, matchesList.length, hasMore, isFetchingMatches])

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

  const handleConnect = async (profileId: string) => {
    setConnectingId(profileId)
    try {
      await api.post("/matrimony/requests", { receiver_profile_id: profileId })
      toast.success("Connection request sent successfully!")
      setMatchesList((prev) =>
        prev.map((m) =>
          m.profile_id === profileId
            ? { ...m, connection_status: "pending_self_approval" }
            : m
        )
      )
      setSwipeDirection("right")
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % Math.max(1, matchesList.length))
        setSwipeDirection(null)
      }, 350)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to send connection request.")
    } finally {
      setConnectingId(null)
    }
  }

  const handleDismiss = () => {
    if (matchesList && matchesList.length > 0) {
      setSwipeDirection("left")
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % matchesList.length)
        setSwipeDirection(null)
      }, 350)
    }
  }

  const handleShare = (username: string, fullName: string) => {
    const url = `${window.location.origin}/${username}`
    navigator.clipboard.writeText(url)
    toast.success(`Copied profile link for ${fullName} to clipboard!`)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            Connected
          </span>
        )
      case "pending_self_approval":
      case "pending_family_approval":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
            Requested
          </span>
        )
      case "declined_by_self":
      case "declined_by_family":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-destructive/10 text-destructive border border-destructive/20">
            Declined
          </span>
        )
      default:
        return null
    }
  }

  // ==================== 1. ADMIN DASHBOARD ====================
  if (isAdmin) {
    return (
      <div className="space-y-8 animate-fade-in text-[#0f172a]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">
              Welcome back, Admin.
            </h1>
          </div>
        </div>

        {/* Dynamic Statistics Row */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
        </div>

        {/* Pending Verifications Feed */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <h2 className="text-xs font-bold text-[#64748b] uppercase tracking-wider px-1">
              Awaiting Verification
            </h2>

            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[384px]">
              <div className="space-y-6">
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
              </div>

              <div className="pt-4 border-t border-[#e2e8f0] text-center">
                <Button
                  variant="link"
                  className="text-[#0f172a] hover:text-[#64748b] text-xs font-bold p-0"
                  onClick={() => navigate("/verification")}
                >
                  Manage Verifications
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==================== 2. STANDARD USER: ELIGIBLE MATRIMONY MATCHES ====================
  if (isEligibleForMatches) {
    const currentMatch = matchesList && matchesList.length > 0 ? matchesList[activeIndex % matchesList.length] : null
    const featuredProfile = currentMatch?.profile
    const age = featuredProfile?.date_of_birth
      ? Math.floor((Date.now() - new Date(featuredProfile.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
      : null


    return (
      <div className="max-w-xxl mx-auto w-full space-y-6 animate-fade-in pb-8 px-0 sm:px-4">
        <div className="flex-grow flex flex-col justify-start">
          {/* Welcome User Banner */}
          <div className="px-5 pt-5 pb-2 text-left">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {t("welcome")}, {user?.full_name?.split(" ")[0] || "User"}
            </h1>
          </div>

          {/* Pending Guardian Co-Approvals */}
          {pendingGuardianRequests.length > 0 && (
            <div className="px-5 py-2">
              <div className="border border-purple-500/20 bg-purple-500/5 rounded-2xl p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> Pending Guardian Approvals
                </p>
                {pendingGuardianRequests.map((req) => (
                  <div key={req.profile_id} className="flex items-center justify-between gap-3 p-2 bg-card rounded-xl border border-purple-500/10">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[9px] bg-purple-100 text-purple-700 font-bold">
                          {req.full_name?.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">{req.full_name}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDashboardInvitation(req.profile_id, "decline")}
                        disabled={loadingInvId === req.profile_id}
                        className="text-[9px] h-7 px-2.5 text-destructive font-bold"
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDashboardInvitation(req.profile_id, "accept")}
                        disabled={loadingInvId === req.profile_id}
                        className="text-[9px] h-7 px-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold"
                      >
                        Accept
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Featured swipe-style profile card */}
          {loadingMatches ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-slate-700 animate-spin mb-2" />
              <p className="text-xs text-slate-500">Loading matching profiles...</p>
            </div>
          ) : currentMatch ? (
            <div className="px-0 py-3 flex-grow flex flex-col justify-center">
              <div
                onClick={() => setSelectedMatch(currentMatch)}
                className={`w-full sm:max-w-[550px] aspect-[3/4.6] relative sm:rounded-[20px] rounded-[20px] overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.12)] hover:shadow-xl mx-auto bg-card cursor-pointer group transform transition-all duration-350 ease-out
                  ${swipeDirection === "right" ? "translate-x-[150%] rotate-[15deg] opacity-0 scale-95" : ""}
                  ${swipeDirection === "left" ? "-translate-x-[150%] -rotate-[15deg] opacity-0 scale-95" : ""}
                `}
              >
                {/* Dismiss X button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDismiss()
                  }}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/35 hover:bg-black/55 backdrop-blur-md flex items-center justify-center text-white transition-all z-20 cursor-pointer shadow-md"
                  aria-label="Dismiss profile"
                >
                  <X className="h-4.5 w-4.5 stroke-[2.5]" />
                </button>

                {/* Profile Photo */}
                <img
                  src={getImageUrl(featuredProfile?.profile_photo_url)}
                  alt={featuredProfile?.full_name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent z-10" />

                {/* Profile Brief Info Overlay */}
                <div className="absolute bottom-0 inset-x-0 p-6 z-20 space-y-4 text-left">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h2 className="text-xl font-bold text-white tracking-tight drop-shadow-sm">
                        {featuredProfile?.full_name}, {age || "—"}
                      </h2>
                      <span className="text-emerald-400 drop-shadow-sm flex items-center">
                        <CheckCircle className="h-4 w-4 fill-white/10" />
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium drop-shadow-sm truncate">
                      {featuredProfile?.occupation || "Member"} • {featuredProfile?.address || "Bangalore, IN"}
                    </p>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-3 pt-1 w-full">
                    {currentMatch.connection_status && currentMatch.connection_status !== "none" ? (
                      currentMatch.connection_status === "approved" ? (
                        <div className="flex-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 h-11 rounded-2xl flex items-center justify-center text-xs font-extrabold shadow-md tracking-wider uppercase select-none">
                          {t("connected")}
                        </div>
                      ) : currentMatch.connection_status.startsWith("pending") ? (
                        <div className="flex-1 bg-amber-500/20 border border-amber-500/30 text-amber-300 h-11 rounded-2xl flex items-center justify-center text-xs font-extrabold shadow-md tracking-wider uppercase select-none animate-pulse">
                          {t("requested")}
                        </div>
                      ) : (
                        <div className="flex-1 bg-rose-500/20 border border-rose-500/30 text-rose-300 h-11 rounded-2xl flex items-center justify-center text-xs font-extrabold shadow-md tracking-wider uppercase select-none">
                          {t("declined")}
                        </div>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (currentMatch?.profile_id) handleConnect(currentMatch.profile_id)
                        }}
                        disabled={connectingId === currentMatch.profile_id}
                        className="flex-1 bg-white hover:bg-slate-100 disabled:bg-slate-100 text-slate-900 font-extrabold h-11 rounded-2xl flex items-center justify-center text-xs shadow-md transition-all cursor-pointer"
                      >
                        {connectingId === currentMatch.profile_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          t("express_interest")
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleShare(featuredProfile?.username || "", featuredProfile?.full_name || "")
                      }}
                      className="w-11 h-11 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
                      title="Copy Profile Link"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-4">
              <Heart className="h-10 w-10 text-muted-foreground opacity-30 animate-pulse" />
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                No active matrimonial recommendations match your profile criteria. Make sure your preferences are configured.
              </p>
            </div>
          )}
        </div>

        {/* Dialog candidate detail profile popup details */}
        <Dialog open={!!selectedMatch} onOpenChange={(open) => !open && setSelectedMatch(null)}>
          <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[85vh] overflow-y-auto border border-[#e2e8f0] bg-white p-5 sm:p-7 rounded-2xl text-[#0f172a] shadow-2xl focus:outline-none">
            {selectedMatch && (
              <div className="space-y-6">
                {/* Big Profile Image */}
                <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-2xl overflow-hidden border border-[#e2e8f0] shadow-md bg-slate-50">
                  <img
                    src={getImageUrl(selectedMatch.profile?.profile_photo_url)}
                    alt={selectedMatch.profile?.full_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                </div>

                <DialogHeader className="pb-4 border-b border-[#e2e8f0] text-left">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4 w-full pt-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <DialogTitle className="text-xl font-bold text-[#0f172a]">
                          {selectedMatch.profile?.full_name}
                        </DialogTitle>
                        {selectedMatch.profile?.username && (
                          <Link
                            to={`/${selectedMatch.profile.username}`}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            (View Profile Page)
                          </Link>
                        )}
                        <span className="text-emerald-500">
                          <CheckCircle className="h-4.5 w-4.5 fill-emerald-500/10" />
                        </span>
                      </div>
                      {selectedMatch.profile?.username && (
                        <p className="text-xs text-[#64748b] font-mono leading-none">
                          @{selectedMatch.profile.username}
                        </p>
                      )}
                      <div className="flex gap-1.5 flex-wrap pt-1.5">
                        {selectedMatch.profile?.date_of_birth && (
                          <Badge className="text-[9.5px] font-extrabold px-2.5 py-0.5 bg-[#f1f5f9] hover:bg-[#f1f5f9] text-[#0f172a] rounded-md border-none select-none">
                            {Math.floor((Date.now() - new Date(selectedMatch.profile.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} Yrs
                          </Badge>
                        )}
                        <Badge className="text-[9.5px] font-extrabold px-2.5 py-0.5 bg-[#f1f5f9] hover:bg-[#f1f5f9] text-[#0f172a] rounded-md border-none capitalize select-none">
                          {selectedMatch.profile?.gender}
                        </Badge>
                        <Badge className="text-[9.5px] font-extrabold px-2.5 py-0.5 bg-[#f1f5f9] hover:bg-[#f1f5f9] text-[#0f172a] rounded-md border-none capitalize select-none">
                          {selectedMatch.profile?.marital_status}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      {selectedMatch.connection_status === "none" || !selectedMatch.connection_status ? (
                        <Button
                          size="sm"
                          className="bg-[#0f172a] text-white hover:bg-[#1e293b] text-xs font-semibold px-4 h-9 shadow-md"
                          onClick={async () => {
                            await handleConnect(selectedMatch.profile_id)
                            setSelectedMatch(prev => prev ? { ...prev, connection_status: "pending_self_approval" } : null)
                          }}
                          disabled={connectingId === selectedMatch.profile_id}
                        >
                          {connectingId === selectedMatch.profile_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("express_interest")}
                        </Button>
                      ) : (
                        getStatusBadge(selectedMatch.connection_status)
                      )}
                    </div>
                  </div>
                </DialogHeader>

                {/* Dialog details */}
                <div className="space-y-6 pt-2">
                  {selectedMatch.about_me && (
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-[#0f172a]" /> About Candidate
                      </h4>
                      <p className="text-xs text-[#0f172a] leading-relaxed bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl italic">
                        "{selectedMatch.about_me}"
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-[#0f172a]" /> Contact details
                    </h4>
                    <div className="bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl text-xs">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider mb-1">
                          Home Address
                        </p>
                        {selectedMatch.connection_status === "approved" ? (
                          <p className="font-semibold text-[#0f172a]">{selectedMatch.profile?.address || "—"}</p>
                        ) : (
                          <p className="text-[#64748b] font-medium flex items-center gap-1 italic select-none">
                            <Lock className="h-3 w-3" /> Masked until connected
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-[#0f172a]" /> Physical & Astro
                      </h4>
                      <div className="bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl space-y-2.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Height</span>
                          <span className="font-semibold text-[#0f172a]">{selectedMatch.matrimony_details?.height_cm ? `${selectedMatch.matrimony_details.height_cm} cm` : "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Body Type</span>
                          <span className="font-semibold text-[#0f172a] capitalize">{selectedMatch.matrimony_details?.body_type || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Complexion</span>
                          <span className="font-semibold text-[#0f172a] capitalize">{selectedMatch.matrimony_details?.complexion || "—"}</span>
                        </div>
                        <div className="flex justify-between border-t border-[#e2e8f0] pt-2 mt-2">
                          <span className="text-[#64748b]">Gotra</span>
                          <span className="font-semibold text-[#0f172a]">{selectedMatch.matrimony_details?.gotra || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Rashi</span>
                          <span className="font-semibold text-[#0f172a] capitalize">{selectedMatch.matrimony_details?.rashi || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Nakshatra</span>
                          <span className="font-semibold text-[#0f172a] capitalize">{selectedMatch.matrimony_details?.nakshatra || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Manglik Status</span>
                          <span className="font-semibold text-[#0f172a] capitalize">{selectedMatch.matrimony_details?.manglik_status || "—"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-[#0f172a]" /> Professional details
                      </h4>
                      <div className="bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl space-y-2.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Qualification</span>
                          <span className="font-semibold text-[#0f172a] capitalize">{selectedMatch.matrimony_details?.highest_qualification || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Field of Study</span>
                          <span className="font-semibold text-[#0f172a]">{selectedMatch.matrimony_details?.field_of_study || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Institution</span>
                          <span className="font-semibold text-[#0f172a]">{selectedMatch.matrimony_details?.institution || "—"}</span>
                        </div>
                        <div className="flex justify-between border-t border-[#e2e8f0] pt-2 mt-2">
                          <span className="text-[#64748b]">Employment Type</span>
                          <span className="font-semibold text-[#0f172a] capitalize">{selectedMatch.matrimony_details?.employment_type?.replace(/_/g, " ") || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Job Title</span>
                          <span className="font-semibold text-[#0f172a]">{selectedMatch.matrimony_details?.job_title || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Income Range</span>
                          <span className="font-semibold text-[#0f172a] uppercase">{selectedMatch.matrimony_details?.income_range?.replace(/_/g, " ") || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Work Location</span>
                          <span className="font-semibold text-[#0f172a]">{selectedMatch.matrimony_details?.work_location || "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Family background */}
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-[#0f172a]" /> Family unit details
                    </h4>
                    <div className="bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl text-xs space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-0.5">Father's Name</p>
                          <p className="font-semibold text-[#0f172a]">{selectedMatch.matrimony_details?.father_name || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-0.5">Father's Occupation</p>
                          <p className="font-semibold text-[#0f172a]">{selectedMatch.matrimony_details?.father_occupation || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-0.5">Mother's Name</p>
                          <p className="font-semibold text-[#0f172a]">{selectedMatch.matrimony_details?.mother_name || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-0.5">Mother's Occupation</p>
                          <p className="font-semibold text-[#0f172a]">{selectedMatch.matrimony_details?.mother_occupation || "—"}</p>
                        </div>
                      </div>
                      {selectedMatch.matrimony_details?.family_background && (
                        <div className="border-t border-[#e2e8f0] pt-2">
                          <p className="text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Family Background</p>
                          <p className="font-medium text-[#64748b] leading-relaxed">{selectedMatch.matrimony_details.family_background}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider flex items-center gap-1.5">
                        <Coffee className="h-3.5 w-3.5 text-[#0f172a]" /> Lifestyle details
                      </h4>
                      <div className="bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl text-xs space-y-2.5">
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Diet</span>
                          <span className="font-semibold text-[#0f172a] capitalize">{selectedMatch.matrimony_details?.diet || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Smoking</span>
                          <span className="font-semibold text-[#0f172a] capitalize">{selectedMatch.matrimony_details?.smoking || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748b]">Drinking</span>
                          <span className="font-semibold text-[#0f172a] capitalize">{selectedMatch.matrimony_details?.drinking || "—"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <h4 className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 text-[#0f172a]" /> Languages & Hobbies
                      </h4>
                      <div className="bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl text-xs space-y-3">
                        {selectedMatch.languages && selectedMatch.languages.length > 0 && (
                          <div>
                            <p className="text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Languages Spoken</p>
                            <div className="flex gap-1.5 flex-wrap">
                              {selectedMatch.languages.map((l) => (
                                <Badge key={l} variant="secondary" className="text-[9px] font-semibold bg-[#eceef0] text-[#0f172a] rounded">
                                  {l}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedMatch.hobbies && selectedMatch.hobbies.length > 0 && (
                          <div>
                            <p className="text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Hobbies</p>
                            <div className="flex gap-1.5 flex-wrap">
                              {selectedMatch.hobbies.map((h) => (
                                <Badge key={h} variant="secondary" className="text-[9px] font-semibold bg-[#eceef0] text-[#0f172a] rounded">
                                  {h}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // ==================== 3. STANDARD USER: NOT OPTED IN PROMO CARD ====================
  return (
    <div className="space-y-8 animate-fade-in text-[#0f172a] max-w-xl mx-auto py-12">
      <div className="bg-white border border-[#e2e8f0] rounded-3xl p-8 text-center space-y-6 shadow-sm relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-rose-500/5 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-emerald-500/5 blur-3xl" />

        <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
          <Heart className="h-8 w-8 text-rose-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#0f172a]">Matrimony Matches</h1>
          <p className="text-xs text-[#64748b] leading-relaxed max-w-sm mx-auto">
            You must opt-in and complete your matrimonial profile details before you can browse eligible verified members of the community.
          </p>
        </div>

        <div className="pt-4">
          <Link to="/profile">
            <Button className="w-full bg-[#0f172a] text-white hover:bg-[#1e293b] text-xs font-semibold py-5 rounded-lg flex items-center justify-center gap-2">
              <span>Configure Access in Profile</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
