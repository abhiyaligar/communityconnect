import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProtectedImage } from "@/components/ProtectedImage"
import { getImageUrl } from "@/lib/utils"
import { Edit, Check, Heart, ImageIcon, Shield } from "lucide-react"

export default function Profile() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()

  // Force-refresh on mount so email & latest data are always current
  useEffect(() => {
    refreshUser()
  }, [])

  const fullName = user?.full_name || "Anonymous User"
  const username = user?.username ? `@${user.username}` : ""
  const bio      = user?.occupation ? `${user.occupation} within the community.` : "Community member."
  const photoUrl = user?.profile_photo_url || ""
  const galleryPhotos: string[] = user?.matrimony?.additional_photos ?? []

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?"

  return (
    <div className="max-w-md mx-auto pt-8 pb-16 px-4 flex flex-col items-center text-center space-y-6 animate-fade-in text-[#0f172a]">

      {/* Avatar */}
      {photoUrl ? (
        <ProtectedImage
          src={getImageUrl(photoUrl)}
          alt={fullName}
          className="h-28 w-28 rounded-full border-4 border-white shadow-lg object-cover"
          wrapperClassName="h-28 w-28 rounded-full border-4 border-white shadow-lg"
        />
      ) : (
        <Avatar className="h-28 w-28 border-4 border-white shadow-lg">
          <AvatarImage src="" />
          <AvatarFallback className="text-3xl bg-[#f1f5f9] text-[#0f172a] font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Name + @username + Verified badge */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold text-[#0f172a]">{fullName}</h1>

        {username && (
          <p className="text-sm text-[#64748b] font-medium">{username}</p>
        )}

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[#10b981]/10 text-[#10b981]">
          <Check className="h-3 w-3" />
          {user?.role === "unverified" ? "Pending Review" : "Identity Verified"}
        </span>
      </div>

      {/* Bio */}
      <p className="text-sm text-[#64748b] leading-relaxed max-w-xs">{bio}</p>

      {/* Icon + Label action buttons */}
      <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
        <Button
          variant="outline"
          className="border-[#e2e8f0] text-foreground hover:bg-muted h-9 px-4 rounded-full text-xs font-semibold gap-2"
          onClick={() => navigate("/profile/edit")}
        >
          <Edit className="h-3.5 w-3.5" />
          Edit Profile
        </Button>

        <Button
          variant="outline"
          className={`h-9 px-4 rounded-full border-[#e2e8f0] text-xs font-semibold gap-2 ${
            user?.matrimony?.opted_in
              ? "text-rose-500 hover:bg-rose-50"
              : "text-foreground hover:bg-muted"
          }`}
          onClick={() => navigate("/matrimony/edit")}
        >
          <Heart
            className={`h-3.5 w-3.5 ${user?.matrimony?.opted_in ? "fill-rose-500 text-rose-500" : ""}`}
          />
          {user?.matrimony?.opted_in ? "Edit Matrimony" : "Join Matrimony"}
        </Button>
      </div>

      {/* Membership Status */}
      <div className="w-full pt-2">
        <div className="flex items-center gap-2 justify-center text-[#64748b] mb-2">
          <Shield className="h-3.5 w-3.5" />
          <p className="text-[10px] uppercase font-bold tracking-wider">Membership</p>
        </div>
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-[#64748b]">Status</span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            user?.membership?.has_membership && user?.membership?.status === "active"
              ? "bg-[#10b981]/10 text-[#10b981]"
              : "bg-[#ef4444]/10 text-[#ef4444]"
          }`}>
            {user?.membership?.has_membership
              ? user?.membership?.status === "active"
                ? "Active"
                : "Inactive"
              : "No Membership"}
          </span>
        </div>
        {user?.membership?.has_membership && (
          <div className="flex items-center justify-between gap-4 mt-1.5 text-[10px] text-[#64748b] font-medium px-4">
            <span>Valid: {user.membership.start_date} — {user.membership.end_date}</span>
          </div>
        )}
      </div>

      {/* Gallery Photos */}
      {galleryPhotos.length > 0 && (
        <div className="w-full pt-6 space-y-3">
          <div className="flex items-center gap-1.5 justify-center text-[#64748b]">
            <ImageIcon className="h-3.5 w-3.5" />
            <p className="text-[10px] uppercase font-bold tracking-wider">Gallery</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {galleryPhotos.map((url, i) => (
              <div
                key={i}
                className="aspect-square rounded-xl overflow-hidden bg-[#f1f5f9]"
              >
                <ProtectedImage
                  src={getImageUrl(url)}
                  alt={`Gallery photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
