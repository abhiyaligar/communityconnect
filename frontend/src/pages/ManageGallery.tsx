import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Camera, Trash, Loader2, Heart, Shield } from "lucide-react"
import { getImageUrl, handleApiError } from "@/lib/utils"
import api from "@/lib/api"
import { toast } from "sonner"

export default function ManageGallery() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { refreshUser } = useAuth()
  const [uploading, setUploading] = useState(false)

  // Fetch matrimonial profile details
  const { data: profileDetails, isLoading } = useQuery({
    queryKey: ["my-matrimony-profile"],
    queryFn: async () => {
      const res = await api.get("/profiles/me")
      return res.data
    }
  })

  const isOptedIn = profileDetails?.matrimony?.opted_in
  const additionalPhotos = profileDetails?.matrimony?.additional_photos || []

  // Mutation to update additional photos list
  const updateGalleryMutation = useMutation({
    mutationFn: async (photos: string[]) => {
      await api.put("/profiles/me/matrimony", { additional_photos: photos })
    },
    onSuccess: () => {
      toast.success("Gallery updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["my-matrimony-profile"] })
      refreshUser()
    },
    onError: (err: any) => {
      toast.error(handleApiError(err, "Failed to update gallery."))
    }
  })

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (additionalPhotos.length >= 5) {
      toast.error("You can upload at most 5 gallery photos.")
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image file is too large. Maximum size is 20MB.")
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    setUploading(true)
    try {
      const res = await api.post("/uploads/image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      const newUrl = res.data.url
      updateGalleryMutation.mutate([...additionalPhotos, newUrl])
    } catch (err: any) {
      toast.error(handleApiError(err, "Failed to upload image."))
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = (indexToDelete: number) => {
    const updated = additionalPhotos.filter((_: string, idx: number) => idx !== indexToDelete)
    updateGalleryMutation.mutate(updated)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 text-[#0f172a] animate-spin" />
      </div>
    )
  }

  if (!isOptedIn) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <Heart className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-[#0f172a]">Matrimonial Profile Required</h3>
        <p className="text-xs text-[#64748b]">
          To manage your photo gallery, you must first opt-in to the Matrimonial Portal and set up your candidate profile details.
        </p>
        <Button
          onClick={() => navigate("/matrimony/edit")}
          className="bg-[#0f172a] text-white hover:bg-[#1e293b] text-xs font-semibold px-5 h-9 rounded-lg"
        >
          Opt-in & Setup
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-4 md:py-8 px-3 md:px-4 space-y-4 md:space-y-6 text-[#0f172a]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <span className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-500/10 text-rose-500">
          {additionalPhotos.length} / 5 Photos
        </span>
      </div>

      <Card className="border border-[#e2e8f0] rounded-2xl shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-[#e2e8f0] p-6">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
            <Camera className="h-4.5 w-4.5 text-rose-500" />
            Candidate Photo Gallery
          </CardTitle>
          <CardDescription className="text-xs text-[#64748b]">
            Your gallery can contain up to 5 additional images. Only one image is visible before connection approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Photos Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {additionalPhotos.map((url: string, index: number) => (
              <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-border group shadow-sm bg-[#f8fafc]">
                <img
                  src={getImageUrl(url)}
                  alt={`Candidate ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(index)}
                  disabled={updateGalleryMutation.isPending}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash className="h-3.5 w-3.5" />
                </button>
                {index === 0 && (
                  <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-rose-600 text-white shadow-sm">
                    First Photo
                  </span>
                )}
              </div>
            ))}

            {/* Upload Box */}
            {additionalPhotos.length < 5 && (
              <label className="aspect-square rounded-xl border border-dashed border-[#e2e8f0] hover:border-muted-foreground cursor-pointer flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground bg-muted/20 hover:bg-muted/40 transition-colors">
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-rose-500" />
                ) : (
                  <Camera className="h-5 w-5 text-rose-500" />
                )}
                <span className="text-[10px] font-semibold uppercase tracking-wider">Upload Photo</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handlePhotoUpload}
                  disabled={uploading || updateGalleryMutation.isPending}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Privacy Note */}
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 flex gap-3 text-xs text-[#64748b]">
            <Shield className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-[#0f172a]">Confidentiality Safeguard Active</p>
              <p className="leading-relaxed">
                Only the first gallery image is visible to prospective matches before you approve their connection request. All subsequent gallery photos are strictly hidden until you establish a mutual match.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
