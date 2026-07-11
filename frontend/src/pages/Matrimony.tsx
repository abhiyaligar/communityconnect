import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { MatrimonyEntry, GuardianRecommendation } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Heart,
  MapPin,
  Briefcase,
  Calendar,
  Search,
  Loader2,
  User,
  Star,
  Coffee,
  Users,
  Phone,
  Shield,
  Lock,
  ArrowRight,
  BookOpen
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { getImageUrl } from "@/lib/utils"

export default function Matrimony() {
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [selectedMatch, setSelectedMatch] = useState<MatrimonyEntry | null>(null)
  const [connectingId, setConnectingId] = useState<string | null>(null)

  const { data: profiles, isLoading, refetch } = useQuery({
    queryKey: ["matrimony"],
    queryFn: async () => {
      const res = await api.get<MatrimonyEntry[]>("/matrimony/matches")
      return res.data
    },
  })

  const { data: myRecommendations, refetch: refetchRecs } = useQuery({
    queryKey: ["matrimony", "my-recommendations"],
    queryFn: async () => {
      const res = await api.get<GuardianRecommendation[]>("/matrimony/my-recommendations")
      return res.data
    },
    enabled: !!user?.matrimony?.family_co_approver_approved,
  })

  // Guardian Recommends states
  const [recommendingId, setRecommendingId] = useState<string | null>(null)
  const [wardPickerOpenFor, setWardPickerOpenFor] = useState<string | null>(null)
  const [selectedWards, setSelectedWards] = useState<string[]>([])

  const filtered = profiles?.filter((p) => {
    const fullName = p.profile?.full_name || ""
    const occupation = p.profile?.occupation || ""
    return (
      fullName.toLowerCase().includes(search.toLowerCase()) ||
      occupation.toLowerCase().includes(search.toLowerCase())
    )
  })

  const handleRecommend = async (profileId: string, wardId: string, isRemoving: boolean) => {
    setRecommendingId(profileId)
    try {
      if (isRemoving) {
        await api.delete("/matrimony/guardian-recommendations", { data: { ward_profile_id: wardId, recommended_profile_id: profileId } })
        toast.success("Recommendation removed.")
      } else {
        await api.post("/matrimony/guardian-recommendations", { ward_profile_id: wardId, recommended_profile_id: profileId })
        toast.success("Profile recommended successfully.")
      }
      refetch()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Action failed.")
    } finally {
      setRecommendingId(null)
    }
  }

  const handleRecommendAction = (entry: MatrimonyEntry) => {
    if (!approvedWards || approvedWards.length === 0) return

    if (approvedWards.length === 1) {
      const ward = approvedWards[0]
      const isRemoving = entry.recommended_for_ward_ids?.includes(ward.profile_id)
      handleRecommend(entry.profile_id, ward.profile_id, !!isRemoving)
    } else {
      // Multiple wards: open picker
      setWardPickerOpenFor(entry.profile_id)
      setSelectedWards(entry.recommended_for_ward_ids || [])
    }
  }

  const handleConnect = async (profileId: string) => {
    setConnectingId(profileId)
    try {
      await api.post("/matrimony/requests", { receiver_profile_id: profileId })
      toast.success("Connection request sent successfully!")
      refetch()
      refetchRecs()
      if (selectedMatch && selectedMatch.profile_id === profileId) {
        setSelectedMatch((prev) => prev ? { ...prev, connection_status: "pending_self_approval" } : null)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to send connection request.")
    } finally {
      setConnectingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[#10b981]/10 text-[#10b981]">
            Connected
          </span>
        )
      case "pending_self_approval":
      case "pending_family_approval":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[#f59e0b]/10 text-[#f59e0b]">
            Requested
          </span>
        )
      case "declined_by_self":
      case "declined_by_family":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-destructive/10 text-destructive">
            Declined
          </span>
        )
      default:
        return null
    }
  }

  const isOptedIn = !!user?.matrimony?.opted_in
  const approvedWards = user?.wards?.filter(w => w.approved) || []
  const hasWards = approvedWards.length > 0

  const renderCard = (entry: MatrimonyEntry, isRecSection: boolean = false, recGuardianName: string | null = null) => {
    const prof = entry.profile
    const initials = prof?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"
    const age = prof?.date_of_birth
      ? Math.floor((Date.now() - new Date(prof.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
      : null

    return (
      <div
        key={isRecSection ? `rec-${entry.profile_id}` : entry.profile_id}
        onClick={() => setSelectedMatch(entry)}
        className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-pointer relative overflow-hidden"
      >
        {isRecSection && (
          <div className="absolute top-0 left-0 w-full bg-amber-100 text-amber-800 text-[10px] font-bold py-1.5 px-4 flex items-center gap-1.5 z-10">
            <Star className="h-3 w-3 fill-current" /> Recommended by {recGuardianName || "Guardian"}
          </div>
        )}
        
        {/* Status Badge in corner */}
        {entry.connection_status && entry.connection_status !== "none" && (
          <div className={`absolute ${isRecSection ? "top-8" : "top-6"} right-6`}>
            {getStatusBadge(entry.connection_status)}
          </div>
        )}

        {/* Profile Info Row */}
        <div className={`space-y-4 ${isRecSection ? 'pt-4' : ''}`}>
          <div className="flex gap-4 items-start">
            <Avatar className="h-14 w-14 border-2 border-white shadow-md shrink-0">
              <AvatarImage src={getImageUrl(prof?.profile_photo_url)} />
              <AvatarFallback className="bg-[#f1f5f9] text-[#0f172a] font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1 min-w-0 pr-12">
              <h3 className="font-bold text-[#0f172a] text-lg leading-tight truncate">
                {prof?.full_name}
              </h3>
              {prof?.username && (
                <p className="text-[10px] text-[#64748b] font-mono leading-none">
                  @{prof.username}
                </p>
              )}
              <div className="flex gap-1.5 flex-wrap pt-1">
                {age && (
                  <Badge variant="secondary" className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#f1f5f9] text-[#0f172a]">
                    {age} Yrs
                  </Badge>
                )}
                {prof?.gender && (
                  <Badge variant="outline" className="text-[9px] font-bold px-2 py-0.5 rounded capitalize">
                    {prof.gender}
                  </Badge>
                )}
                {prof?.marital_status && (
                  <Badge variant="outline" className="text-[9px] font-bold px-2 py-0.5 rounded capitalize">
                    {prof.marital_status}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Meta Fields Table */}
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3.5 space-y-2.5 text-xs">
            <div className="flex items-center gap-2 text-[#64748b]">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#0f172a]" />
              <span className="truncate">
                {entry.connection_status === "approved" ? prof?.address : "Hidden until connected"}
              </span>
            </div>
            {prof?.occupation && (
              <div className="flex items-center gap-2 text-[#64748b]">
                <Briefcase className="h-3.5 w-3.5 shrink-0 text-[#0f172a]" />
                <span className="truncate">{prof.occupation}</span>
              </div>
            )}
            {prof?.date_of_birth && (
              <div className="flex items-center gap-2 text-[#64748b]">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-[#0f172a]" />
                <span>{new Date(prof.date_of_birth).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
            )}
          </div>

          {/* About me snippet */}
          {entry.about_me && (
            <p className="text-xs text-[#64748b] leading-relaxed line-clamp-2 italic border-t border-[#e2e8f0] pt-3">
              "{entry.about_me}"
            </p>
          )}
        </div>

        {/* Connect CTA Button */}
        <div className="pt-4 border-t border-[#e2e8f0] mt-4 flex items-center gap-2 relative z-10">
          {hasWards && !isRecSection && (
            <Button
              size="sm"
              variant={entry.is_recommended_by_guardian ? "default" : "outline"}
              className={`h-9 px-3 shrink-0 ${entry.is_recommended_by_guardian ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500' : 'border-[#e2e8f0] text-[#64748b] hover:text-rose-500 hover:border-rose-200'}`}
              onClick={(e) => {
                e.stopPropagation()
                handleRecommendAction(entry)
              }}
              disabled={recommendingId === entry.profile_id}
              title={entry.is_recommended_by_guardian ? "Recommended" : "Recommend to Ward"}
            >
              {recommendingId === entry.profile_id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className={`h-4 w-4 ${entry.is_recommended_by_guardian ? 'fill-current' : ''}`} />
              )}
            </Button>
          )}
          
          <div className="flex-1">
            {entry.connection_status && entry.connection_status !== "none" ? (
              <div className="flex justify-between items-center gap-2">
                {getStatusBadge(entry.connection_status)}
                <Button size="sm" variant="outline" className="border-[#e2e8f0] text-xs font-semibold h-8 w-full sm:w-auto px-4">
                  View
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                className="w-full bg-[#0f172a] text-white hover:bg-[#1e293b] text-xs font-semibold h-9 rounded-lg"
                onClick={(e) => {
                  e.stopPropagation()
                  handleConnect(entry.profile_id)
                }}
                disabled={connectingId === entry.profile_id}
              >
                {connectingId === entry.profile_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Request Connection"}
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (user && !isOptedIn && !hasWards) {
    return (
      <div className="space-y-8 animate-fade-in text-[#0f172a] max-w-xl mx-auto py-12">
        <div className="bg-white border border-[#e2e8f0] rounded-3xl p-8 text-center space-y-6 shadow-sm relative overflow-hidden">
          {/* Subtle Pink Backdrop Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-rose-500/5 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-[#10b981]/5 blur-3xl" />

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
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in text-[#0f172a]">
      {/* Guardian Mode Alert */}
      {!isOptedIn && hasWards && (
        <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4 flex items-center gap-3.5">
          <Shield className="h-5 w-5 text-purple-600 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-purple-900">Guardian Mode Active: </span>
            <span className="text-purple-700 font-medium">
              Browsing matches on behalf of your ward{approvedWards.length > 1 ? "s" : ""}:{" "}
              <span className="font-bold">{approvedWards.map(w => `${w.full_name} (@${w.username})`).join(", ")}</span>.
            </span>
          </div>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-sm max-w-md">
        <div className="relative">
          <input
            type="text"
            placeholder="Search matches by name or occupation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:border-[#0f172a]"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 text-[#0f172a] animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Recommended For You Section */}
          {myRecommendations && myRecommendations.length > 0 && (
            <div className="mb-10 space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#0f172a]">Recommended for You</h2>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 font-bold border-amber-200">
                  <Star className="h-3 w-3 mr-1 fill-current" /> {myRecommendations.length}
                </Badge>
              </div>
              
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {myRecommendations.map((rec) => {
                  const mappedEntry: MatrimonyEntry = {
                    profile_id: rec.profile_id,
                    connection_status: rec.connection_status,
                    connection_request_id: rec.connection_request_id,
                    profile: rec.profile,
                    matrimony_details: rec.matrimony_details,
                    about_me: (rec.matrimony_details as any)?.about_me,
                  }
                  return renderCard(mappedEntry, true, rec.recommended_by.guardian_name)
                })}
              </div>
              <div className="border-b border-[#e2e8f0] pt-4" />
            </div>
          )}

          <p className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
            {filtered?.length || 0} eligible profiles found
          </p>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered?.map((entry) => renderCard(entry))}

            {filtered?.length === 0 && (
              <div className="col-span-full py-16 text-center text-[#64748b]">
                <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                <span>No matrimonial profiles matches your search criteria.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialog popup detail details */}
      <Dialog open={!!selectedMatch} onOpenChange={(open) => !open && setSelectedMatch(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto border border-[#e2e8f0] bg-white p-8 rounded-2xl text-[#0f172a]">
          {selectedMatch && (
            <div className="space-y-6">
              <DialogHeader className="pb-4 border-b border-[#e2e8f0] text-left">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 w-full">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border border-[#e2e8f0] shadow-md">
                      <AvatarImage src={getImageUrl(selectedMatch.profile?.profile_photo_url)} />
                      <AvatarFallback className="text-xl bg-[#f1f5f9] font-bold text-[#0f172a]">
                        {selectedMatch.profile?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
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
                      </div>
                      {selectedMatch.profile?.username && (
                        <p className="text-xs text-[#64748b] font-mono leading-none">
                          @{selectedMatch.profile.username}
                        </p>
                      )}
                      <div className="flex gap-1.5 flex-wrap pt-1">
                        {selectedMatch.profile?.date_of_birth && (
                          <Badge variant="secondary" className="text-[9px] font-bold px-2 py-0.5 bg-[#f1f5f9] text-[#0f172a] rounded">
                            {Math.floor((Date.now() - new Date(selectedMatch.profile.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} Yrs
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[9px] font-bold px-2 py-0.5 capitalize rounded">
                          {selectedMatch.profile?.gender}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] font-bold px-2 py-0.5 capitalize rounded">
                          {selectedMatch.profile?.marital_status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    {selectedMatch.connection_status === "none" || !selectedMatch.connection_status ? (
                      <Button
                        size="sm"
                        className="bg-[#0f172a] text-white hover:bg-[#1e293b] text-xs font-semibold px-4 h-9"
                        onClick={() => handleConnect(selectedMatch.profile_id)}
                        disabled={connectingId === selectedMatch.profile_id}
                      >
                        {connectingId === selectedMatch.profile_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Request Connection"}
                      </Button>
                    ) : (
                      getStatusBadge(selectedMatch.connection_status)
                    )}
                  </div>
                </div>
              </DialogHeader>

              {/* Scrollable details body */}
              <div className="space-y-6 pt-2">
                {/* About me */}
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

                {/* Contact and address */}
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
                        <p className="text-[#64748b] font-medium flex items-center gap-1 italic">
                          <Lock className="h-3 w-3" /> Masked until connected
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grid stats details */}
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Physical & Astro details */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-[#0f172a]" /> Physical & Astro
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

                  {/* Professional details */}
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

                {/* Lifestyle preferences */}
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

                  {/* Astro Star Gotra Details */}
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

                {/* Additional gallery if connected */}
                {selectedMatch.connection_status === "approved" && selectedMatch.matrimony_details?.additional_photos && selectedMatch.matrimony_details.additional_photos.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider">Candidate Photo Gallery</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedMatch.matrimony_details.additional_photos.map((photo: string, i: number) => (
                        <img
                          key={i}
                          src={getImageUrl(photo)}
                          alt={`Candidate ${i}`}
                          className="w-full h-24 object-cover rounded-xl border border-[#e2e8f0] shadow-sm hover:scale-105 transition-transform cursor-pointer"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ward Picker Dialog */}
      <Dialog open={!!wardPickerOpenFor} onOpenChange={(open) => !open && setWardPickerOpenFor(null)}>
        <DialogContent className="max-w-md border border-[#e2e8f0] bg-white p-6 rounded-2xl text-[#0f172a]">
          <DialogHeader className="pb-4 border-b border-[#e2e8f0] text-left">
            <DialogTitle className="text-xl font-bold text-[#0f172a]">
              Recommend Profile
            </DialogTitle>
            <p className="text-xs text-[#64748b] pt-1">
              Select which ward(s) you would like to recommend this profile for.
            </p>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {approvedWards.map(ward => {
              const isSelected = selectedWards.includes(ward.profile_id)
              return (
                <div
                  key={ward.profile_id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedWards(selectedWards.filter(id => id !== ward.profile_id))
                      handleRecommend(wardPickerOpenFor!, ward.profile_id, true)
                    } else {
                      setSelectedWards([...selectedWards, ward.profile_id])
                      handleRecommend(wardPickerOpenFor!, ward.profile_id, false)
                    }
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-rose-500 bg-rose-50' : 'border-[#e2e8f0] hover:border-[#cbd5e1] hover:bg-[#f8fafc]'}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-[#e2e8f0] shadow-sm">
                      <AvatarFallback className="bg-white text-[#0f172a] font-bold text-xs">
                        {ward.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-bold text-[#0f172a]">{ward.full_name}</p>
                      <p className="text-[10px] text-[#64748b]">@{ward.username}</p>
                    </div>
                  </div>
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-rose-500 bg-rose-500' : 'border-[#cbd5e1]'}`}>
                    {isSelected && <Heart className="h-3 w-3 text-white fill-current" />}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="pt-4 border-t border-[#e2e8f0] flex justify-end">
            <Button
              className="bg-[#0f172a] text-white hover:bg-[#1e293b]"
              onClick={() => setWardPickerOpenFor(null)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
