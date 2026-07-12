import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Camera, Loader2 } from "lucide-react"
import { getImageUrl, handleApiError } from "@/lib/utils"
import { ProtectedImage } from "@/components/ProtectedImage"
import api from "@/lib/api"
import { toast } from "sonner"

export default function UploadPhoto() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(user?.profile_photo_url || "")

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image file is too large. Maximum size is 20MB.")
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    setUploading(true)
    try {
      // 1. Upload to backend
      const res = await api.post("/uploads/image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      const uploadedUrl = res.data.url
      setPhotoUrl(uploadedUrl)

      // 2. Immediately save to profile
      const payload = {
        contact_number: user?.contact_number || "",
        address: user?.address || "",
        occupation: user?.occupation || "",
        profile_photo_url: uploadedUrl,
        gender: user?.gender || "male",
        marital_status: user?.marital_status || "single",
        social_links: user?.social_links || {}
      }
      await api.put("/profiles/me", payload)
      toast.success("Profile photo uploaded and saved successfully!")
      refreshUser()
      navigate("/profile")
    } catch (err: any) {
      toast.error(handleApiError(err, "Failed to upload photo."))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-6 animate-fade-in text-[#0f172a]">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/profile")}
          className="border-[#e2e8f0] text-foreground hover:bg-muted h-8 w-8 p-0 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Back to Profile</span>
      </div>

      <Card className="border border-[#e2e8f0] rounded-2xl shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-[#e2e8f0] p-6 pb-4">
          <CardTitle className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
            <Camera className="h-5 w-5 text-rose-500" />
            Upload Profile Picture
          </CardTitle>
          <CardDescription className="text-xs text-[#64748b] mt-1">
            Upload a clear headshot. Image files are limited to 15MB size.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#e2e8f0] rounded-2xl bg-[#f8fafc] text-center space-y-6">
            {photoUrl ? (
              <ProtectedImage
                src={getImageUrl(photoUrl)}
                alt="Profile Preview"
                className="w-36 h-36 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-36 h-36 rounded-full bg-secondary border border-[#e2e8f0] flex items-center justify-center text-xs text-muted-foreground font-semibold">
                No Profile Photo
              </div>
            )}

            <div className="space-y-1.5">
              <p className="text-xs font-bold text-[#0f172a]">
                {photoUrl ? "Change profile photo" : "Select profile photo"}
              </p>
              <p className="text-[10px] text-[#64748b]">
                Accepts JPG, JPEG, PNG or WEBP formats up to 15MB.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="relative border-[#e2e8f0] text-foreground hover:bg-muted text-xs font-semibold h-10 px-6 rounded-xl cursor-pointer w-full"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin animate-spin" />
                  Uploading...
                </>
              ) : (
                "Choose Image file"
              )}
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handlePhotoUpload}
                disabled={uploading}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
