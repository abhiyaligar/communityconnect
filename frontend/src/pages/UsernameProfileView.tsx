import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  Users,
  Shield,
  Loader2,
  Lock,
  CheckCircle,
  ArrowLeft,
  Camera,
  Heart,
  Share2,
  Globe,
  MapPin,
  MessageSquare
} from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"
import { getImageUrl } from "@/lib/utils"
import { ProtectedImage } from "@/components/ProtectedImage"

export default function UsernameProfileView() {
  const { username } = useParams()
  const navigate = useNavigate()
  const [connecting, setConnecting] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

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


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
        <p className="text-sm text-slate-500 font-medium">Fetching profile details...</p>
      </div>
    )
  }

  if (error || !profile) {
    const is403 = (error as any)?.response?.status === 403
    if (is403) {
      return (
        <div className="max-w-md mx-auto w-full text-center py-20 space-y-4 text-slate-900">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold">Membership Required</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            An active membership is required to view profile details. Please purchase a membership plan to connect with other verified members.
          </p>
          <Button onClick={() => navigate("/dashboard")} className="bg-slate-900 text-white text-xs font-bold mt-2">
            Return to Dashboard
          </Button>
        </div>
      )
    }

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
    <div className="max-w-2xl mx-auto w-full pb-12 animate-fade-in text-[#0f172a] text-left min-h-screen bg-slate-50/20">
      {/* 1. Hero Section */}
      <div className="relative w-full h-[60vh] md:h-[65vh] bg-slate-100 overflow-hidden">
        {/* Back Arrow */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white backdrop-blur-md flex items-center justify-center text-[#0f172a] shadow-md transition-all cursor-pointer border border-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Top Right Likes & Share */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <button className="w-10 h-10 rounded-full bg-white/90 hover:bg-white backdrop-blur-md flex items-center justify-center text-[#0f172a] shadow-md transition-all cursor-pointer border border-slate-100">
            <Heart className="h-5 w-5 hover:text-red-500 hover:fill-red-500 transition-colors" />
          </button>
          <button 
            onClick={() => {
              const url = window.location.href
              navigator.clipboard.writeText(url)
              toast.success("Profile link copied!")
            }}
            className="w-10 h-10 rounded-full bg-white/90 hover:bg-white backdrop-blur-md flex items-center justify-center text-[#0f172a] shadow-md transition-all cursor-pointer border border-slate-100"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>

        {/* Hero Cover Image */}
        <div className="absolute inset-0" onContextMenu={(e) => e.preventDefault()}>
          <img
            src={getImageUrl(profile.profile_photo_url)}
            alt={profile.full_name}
            draggable={false}
            className="w-full h-full object-cover pointer-events-none select-none"
          />
        </div>

        {/* Dark overlay with info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent z-10" />

        <div className="absolute bottom-6 left-6 z-20 space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight drop-shadow-sm flex items-center gap-1.5">
              {profile.full_name}
              <span className="text-white">
                <CheckCircle className="h-5 w-5 fill-white/10" />
              </span>
            </h1>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {age && (
              <span className="text-[10px] font-bold px-3 py-1 bg-black/45 text-slate-200 backdrop-blur-md rounded-md select-none">
                {age} Yrs
              </span>
            )}
            {profile.gender && (
              <span className="text-[10px] font-bold px-3 py-1 bg-black/45 text-slate-200 backdrop-blur-md rounded-md capitalize select-none">
                {profile.gender}
              </span>
            )}
            {profile.marital_status && (
              <span className="text-[10px] font-bold px-3 py-1 bg-black/45 text-slate-200 backdrop-blur-md rounded-md capitalize select-none">
                {profile.marital_status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Details Content Wrapper */}
      <div className="p-4 sm:p-6 space-y-6 bg-transparent sm:bg-slate-50/50">
        {/* Action Buttons Row */}
        <div className="flex gap-3">
          {profile.connection_status === "none" || !profile.connection_status ? (
            <Button
              className="flex-1 bg-black text-white hover:bg-slate-900 font-extrabold h-12 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider text-xs shadow-sm"
              onClick={() => handleConnect(profile.profile_id)}
              disabled={connecting}
            >
              {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  <Users className="h-4.5 w-4.5" />
                  Connect
                </>
              )}
            </Button>
          ) : profile.connection_status === "approved" ? (
            <Button
              className="flex-1 bg-black text-white font-extrabold h-12 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider text-xs shadow-sm cursor-default"
            >
              <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
              Connected
            </Button>
          ) : (
            <Button
              className="flex-1 bg-slate-800 text-white font-extrabold h-12 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider text-xs shadow-sm cursor-default animate-pulse"
            >
              Requested
            </Button>
          )}
          
          <button
            onClick={() => navigate(`/matrimony/chat?profile_id=${profile.profile_id}`)}
            className="w-12 h-12 shrink-0 border border-[#e2e8f0] bg-white rounded-xl flex items-center justify-center text-[#0f172a] hover:bg-slate-100 shadow-sm transition-all"
            title="Chat"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
        </div>

        {/* Bio Section */}
        {profile.about_me && (
          <div className="space-y-1.5 text-left">
            <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              About Me
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed font-semibold">
              {profile.about_me}
            </p>
          </div>
        )}

        {/* Personal Details Section */}
        {profile.matrimony_details && (
          <div className="space-y-3 text-left">
            <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Personal Details
            </h4>
            <div className="divide-y divide-slate-200 border-t border-b border-slate-200 text-xs">
              <div className="flex justify-between py-3.5">
                <span className="text-slate-500 font-bold">Height</span>
                <span className="font-extrabold text-[#0f172a]">{profile.matrimony_details.height_cm ? `${profile.matrimony_details.height_cm} cm` : "—"}</span>
              </div>
              <div className="flex justify-between py-3.5">
                <span className="text-slate-500 font-bold">Body Type</span>
                <span className="font-extrabold text-[#0f172a] capitalize">{profile.matrimony_details.body_type || "—"}</span>
              </div>
              <div className="flex justify-between py-3.5">
                <span className="text-slate-500 font-bold">Education</span>
                <span className="font-extrabold text-[#0f172a] capitalize">{profile.matrimony_details.highest_qualification || "—"}</span>
              </div>
              <div className="flex justify-between py-3.5">
                <span className="text-slate-500 font-bold">Profession</span>
                <span className="font-extrabold text-[#0f172a]">{profile.occupation || "—"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Languages & Location Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#f8fafc] border border-slate-200/60 rounded-2xl p-4 space-y-2 shadow-sm text-left">
            <Globe className="h-5 w-5 text-[#0f172a] stroke-[2.2]" />
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                Languages
              </p>
              <p className="text-xs font-bold text-[#0f172a] mt-0.5 truncate">
                {profile.languages?.join(", ") || "English"}
              </p>
            </div>
          </div>

          <div className="bg-[#f8fafc] border border-slate-200/60 rounded-2xl p-4 space-y-2 shadow-sm text-left">
            <MapPin className="h-5 w-5 text-[#0f172a] stroke-[2.2]" />
            <div>
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                Location
              </p>
              <p className="text-xs font-bold text-[#0f172a] mt-0.5 truncate">
                {profile.address || "Not set"}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Contact Details Card */}
        <div className="bg-[#e0ebff] border-0 sm:border sm:border-[#bfdbfe]/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-none text-left">
          <div className="flex items-center gap-2 text-[#1e40af]">
            <Lock className="h-4.5 w-4.5 stroke-[2.2]" />
            <span className="text-[10px] uppercase font-extrabold tracking-wider">Contact Details</span>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-[9px] uppercase font-bold text-[#1e3a8a]/70 tracking-wider">
                Phone Number
              </p>
              <p className="text-xs font-bold text-[#1e3a8a] mt-0.5 font-mono">
                {profile.connection_status === "approved" && profile.contact_number
                  ? `•••• •••• ${profile.contact_number.slice(-3)}`
                  : "•••• •••• •••"
                }
              </p>
            </div>

            <div>
              <p className="text-[9px] uppercase font-bold text-[#1e3a8a]/70 tracking-wider">
                Home Address
              </p>
              <p className="text-xs font-bold text-[#1e3a8a] mt-0.5">
                {profile.connection_status === "approved" && profile.address
                  ? `•••••••••, ${profile.address.split(",").pop()?.trim()}`
                  : "•••••••••, Restricted"
                }
              </p>
            </div>
          </div>

          {(profile.connection_status === "none" || !profile.connection_status) && (
            <button
              onClick={() => handleConnect(profile.profile_id)}
              disabled={connecting}
              className="w-full bg-black hover:bg-slate-900 text-white font-extrabold py-3.5 rounded-xl uppercase tracking-wider text-xs transition-colors shadow-sm cursor-pointer mt-2"
            >
              {connecting ? "Requesting..." : "Request Access"}
            </button>
          )}
        </div>

        {/* 4. Instagram-style Photo Gallery (Connected users only) */}
        {profile.connection_status === "approved" && profile.matrimony_details?.additional_photos && profile.matrimony_details.additional_photos.length > 0 && (
          <div className="bg-transparent border-0 rounded-none p-0 shadow-none sm:bg-white sm:border sm:border-[#e2e8f0] sm:rounded-3xl sm:p-6 sm:shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#0f172a] uppercase tracking-wider flex items-center gap-2">
              <Camera className="h-4.5 w-4.5 text-[#0f172a]" /> Photo Gallery
            </h3>
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {profile.matrimony_details.additional_photos.map((photo: string, index: number) => (
                <div 
                  key={index} 
                  className="aspect-square rounded-2xl overflow-hidden border border-[#e2e8f0] bg-slate-50 cursor-pointer relative group shadow-sm hover:shadow-md transition-all duration-350"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <ProtectedImage
                    src={getImageUrl(photo)}
                    alt={`Gallery ${index}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-3xl p-2 border-none bg-black/90 text-white flex items-center justify-center rounded-2xl shadow-2xl overflow-hidden focus:outline-none">
          {selectedPhoto && (
            <div className="relative max-h-[85vh] w-full flex items-center justify-center">
              <ProtectedImage
                src={getImageUrl(selectedPhoto)}
                alt="Enlarged gallery view"
                className="max-h-[80vh] max-w-full object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
