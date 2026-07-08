import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getImageUrl } from "@/lib/utils"
import { Edit, Check, Heart, ImageIcon } from "lucide-react"

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
      <Avatar className="h-28 w-28 border-4 border-white shadow-lg">
        <AvatarImage src={getImageUrl(photoUrl)} />
        <AvatarFallback className="text-3xl bg-[#f1f5f9] text-[#0f172a] font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>

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
                <img
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
