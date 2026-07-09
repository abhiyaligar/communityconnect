import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Shield,
  Loader2,
  Phone,
  Lock,
  BookOpen,
  Coffee,
  Star,
  CheckCircle,
  ArrowLeft,
  Briefcase
} from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"
import { getImageUrl } from "@/lib/utils"

export default function UsernameProfileView() {
  const { username } = useParams()
  const navigate = useNavigate()
  const [connecting, setConnecting] = useState(false)

  const { data: profile, isLoading, error, refetch } = useQuery<any>({
    queryKey: ["username-profile", username],
    queryFn: async () => {
      const res = await api.get(`/profiles/by-username/${username}`)
      return res.data
    },
    enabled: !!username,
    retry: false
  })

  const handleConnect = async (profileId: string) => {
    setConnecting(true)
    try {
      await api.post("/matrimony/requests", { receiver_profile_id: profileId })
      toast.success("Connection request sent successfully!")
      refetch()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to send connection request.")
    } finally {
      setConnecting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-extrabold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-sm select-none">
            Connected
          </span>
        )
      case "pending_self_approval":
      case "pending_family_approval":
        return (
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-extrabold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm select-none animate-pulse">
            Requested
          </span>
        )
      case "declined_by_self":
      case "declined_by_family":
        return (
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-extrabold uppercase bg-destructive/10 text-destructive border border-destructive/20 shadow-sm select-none">
            Declined
          </span>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
        <p className="text-sm text-slate-500 font-medium">Fetching profile details...</p>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto w-full text-center py-20 space-y-4 text-slate-900">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <Shield className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold">Profile Not Found</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          The requested profile @{username} does not exist or you do not have permission to view it.
        </p>
        <Button onClick={() => navigate("/dashboard")} className="bg-slate-900 text-white text-xs font-bold mt-2">
          Return to Dashboard
        </Button>
      </div>
    )
  }

  const age = profile.date_of_birth
    ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6 pb-12 animate-fade-in text-[#0f172a] text-left">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-xs font-bold focus:outline-none mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Go Back</span>
      </button>

      <div className="bg-white border border-[#e2e8f0] rounded-3xl p-5 sm:p-8 shadow-sm space-y-6">
        {/* Profile Card Header */}
        <div className="pb-4 border-b border-[#e2e8f0] flex flex-col sm:flex-row items-start justify-between gap-4 w-full">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border border-[#e2e8f0] shadow-md">
              <AvatarImage src={getImageUrl(profile.profile_photo_url)} className="object-cover" />
              <AvatarFallback className="text-xl bg-[#f1f5f9] font-bold text-[#0f172a]">
                {profile.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-xl font-bold text-[#0f172a]">
                  {profile.full_name}
                </h1>
                <span className="text-emerald-500">
                  <CheckCircle className="h-4.5 w-4.5 fill-emerald-500/10" />
                </span>
              </div>
              {profile.username && (
                <p className="text-xs text-[#64748b] font-mono leading-none">
                  @{profile.username}
                </p>
              )}
              <div className="flex gap-1.5 flex-wrap pt-1.5">
                {age && (
                  <Badge className="text-[9.5px] font-extrabold px-2.5 py-0.5 bg-[#f1f5f9] hover:bg-[#f1f5f9] text-[#0f172a] rounded-md border-none select-none">
                    {age} Yrs
                  </Badge>
                )}
                {profile.gender && (
                  <Badge className="text-[9.5px] font-extrabold px-2.5 py-0.5 bg-[#f1f5f9] hover:bg-[#f1f5f9] text-[#0f172a] rounded-md border-none capitalize select-none">
                    {profile.gender}
                  </Badge>
                )}
                {profile.marital_status && (
                  <Badge className="text-[9.5px] font-extrabold px-2.5 py-0.5 bg-[#f1f5f9] hover:bg-[#f1f5f9] text-[#0f172a] rounded-md border-none capitalize select-none">
                    {profile.marital_status}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div>
            {profile.connection_status === "none" || !profile.connection_status ? (
              <Button
                size="sm"
                className="bg-[#0f172a] text-white hover:bg-[#1e293b] text-xs font-semibold px-4 h-9 shadow-md"
                onClick={() => handleConnect(profile.profile_id)}
                disabled={connecting}
              >
                {connecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Request Connection"}
              </Button>
            ) : (
              getStatusBadge(profile.connection_status)
            )}
          </div>
        </div>

        {/* Profile Card Body Details */}
        <div className="space-y-6 pt-2">
          {profile.about_me && (
            <div className="space-y-1.5">
              <h4 className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-[#0f172a]" /> About Candidate
              </h4>
              <p className="text-xs text-[#0f172a] leading-relaxed bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl italic">
                "{profile.about_me}"
              </p>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-[#0f172a]" /> Contact details
            </h4>
            <div className="grid sm:grid-cols-2 gap-4 bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl text-xs">
              <div>
                <p className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider mb-1">
                  Contact Number
                </p>
                {profile.connection_status === "approved" ? (
                  <p className="font-semibold text-[#0f172a]">{profile.contact_number || "—"}</p>
                ) : (
                  <p className="text-[#64748b] font-medium flex items-center gap-1 italic select-none">
                    <Lock className="h-3 w-3" /> Masked until connected
                  </p>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider mb-1">
                  Home Address
                </p>
                {profile.connection_status === "approved" ? (
                  <p className="font-semibold text-[#0f172a]">{profile.address || "—"}</p>
                ) : (
                  <p className="text-[#64748b] font-medium flex items-center gap-1 italic select-none">
                    <Lock className="h-3 w-3" /> Masked until connected
                  </p>
                )}
              </div>
            </div>
          </div>

          {profile.matrimony_details && (
            <>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-[#0f172a]" /> Physical & Astro
                  </h4>
                  <div className="bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Height</span>
                      <span className="font-semibold text-[#0f172a]">{profile.matrimony_details.height_cm ? `${profile.matrimony_details.height_cm} cm` : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Body Type</span>
                      <span className="font-semibold text-[#0f172a] capitalize">{profile.matrimony_details.body_type || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Complexion</span>
                      <span className="font-semibold text-[#0f172a] capitalize">{profile.matrimony_details.complexion || "—"}</span>
                    </div>
                    <div className="flex justify-between border-t border-[#e2e8f0] pt-2 mt-2">
                      <span className="text-[#64748b]">Gotra</span>
                      <span className="font-semibold text-[#0f172a]">{profile.matrimony_details.gotra || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Rashi</span>
                      <span className="font-semibold text-[#0f172a] capitalize">{profile.matrimony_details.rashi || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Nakshatra</span>
                      <span className="font-semibold text-[#0f172a] capitalize">{profile.matrimony_details.nakshatra || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Manglik Status</span>
                      <span className="font-semibold text-[#0f172a] capitalize">{profile.matrimony_details.manglik_status || "—"}</span>
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
                      <span className="font-semibold text-[#0f172a] capitalize">{profile.matrimony_details.highest_qualification || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Field of Study</span>
                      <span className="font-semibold text-[#0f172a]">{profile.matrimony_details.field_of_study || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Institution</span>
                      <span className="font-semibold text-[#0f172a]">{profile.matrimony_details.institution || "—"}</span>
                    </div>
                    <div className="flex justify-between border-t border-[#e2e8f0] pt-2 mt-2">
                      <span className="text-[#64748b]">Employment Type</span>
                      <span className="font-semibold text-[#0f172a] capitalize">{profile.matrimony_details.employment_type?.replace(/_/g, " ") || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Job Title</span>
                      <span className="font-semibold text-[#0f172a]">{profile.matrimony_details.job_title || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Income Range</span>
                      <span className="font-semibold text-[#0f172a] uppercase">{profile.matrimony_details.income_range?.replace(/_/g, " ") || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Work Location</span>
                      <span className="font-semibold text-[#0f172a]">{profile.matrimony_details.work_location || "—"}</span>
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
                      <p className="font-semibold text-[#0f172a]">{profile.matrimony_details.father_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-0.5">Father's Occupation</p>
                      <p className="font-semibold text-[#0f172a]">{profile.matrimony_details.father_occupation || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-0.5">Mother's Name</p>
                      <p className="font-semibold text-[#0f172a]">{profile.matrimony_details.mother_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-0.5">Mother's Occupation</p>
                      <p className="font-semibold text-[#0f172a]">{profile.matrimony_details.mother_occupation || "—"}</p>
                    </div>
                  </div>
                  {profile.matrimony_details.family_background && (
                    <div className="border-t border-[#e2e8f0] pt-2">
                      <p className="text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Family Background</p>
                      <p className="font-medium text-[#64748b] leading-relaxed">{profile.matrimony_details.family_background}</p>
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
                      <span className="font-semibold text-[#0f172a] capitalize">{profile.matrimony_details.diet || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Smoking</span>
                      <span className="font-semibold text-[#0f172a] capitalize">{profile.matrimony_details.smoking || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Drinking</span>
                      <span className="font-semibold text-[#0f172a] capitalize">{profile.matrimony_details.drinking || "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-[#0f172a]" /> Languages & Hobbies
                  </h4>
                  <div className="bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl text-xs space-y-3">
                    {profile.languages && profile.languages.length > 0 && (
                      <div>
                        <p className="text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Languages Spoken</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {profile.languages.map((l: string) => (
                            <Badge key={l} variant="secondary" className="text-[9px] font-semibold bg-[#eceef0] text-[#0f172a] rounded">
                              {l}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {profile.hobbies && profile.hobbies.length > 0 && (
                      <div>
                        <p className="text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Hobbies</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {profile.hobbies.map((h: string) => (
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
