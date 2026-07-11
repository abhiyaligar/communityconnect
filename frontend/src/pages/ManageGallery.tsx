import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Camera, Trash, Loader2, Heart, Shield, ChevronLeft } from "lucide-react"
import { getImageUrl, handleApiError } from "@/lib/utils"
import api from "@/lib/api"
import { toast } from "sonner"

export default function ManageGallery() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { refreshUser } = useAuth()
  const [uploading, setUploading] = useState(false)

  const { data: profileDetails, isLoading } = useQuery({
    queryKey: ["my-matrimony-profile"],
    queryFn: async () => {
      const res = await api.get("/profiles/me")
      return res.data
    }
  })

  const isOptedIn = profileDetails?.matrimony?.opted_in
  const additionalPhotos = profileDetails?.matrimony?.additional_photos || []

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
    <div className="space-y-0 text-[#0f172a]">
      {/* Full-width hero header */}
      <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] px-4 md:px-8 py-6 md:py-10 -mx-3 md:-mx-8 -mt-3 md:-mt-8 mb-6 md:mb-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="text-white/60 hover:text-white flex items-center gap-1 text-xs font-semibold mb-4 transition-colors cursor-pointer bg-transparent border-0"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </button>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <Camera className="h-4.5 w-4.5 text-rose-300" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-500/20 text-rose-200 border border-rose-500/20">
                  {additionalPhotos.length} / 5 Photos
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Candidate Photo Gallery</h1>
              <p className="text-xs text-white/60 mt-1 max-w-xl">
                Your gallery can contain up to 5 additional images. Only one image is visible before connection approval. All subsequent gallery photos are hidden until you establish a mutual match.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Full-width photo grid */}
      <div className="px-4 md:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {additionalPhotos.map((url: string, index: number) => (
            <div key={index} className="group relative aspect-[4/5] rounded-xl overflow-hidden bg-[#f8fafc] border border-[#e2e8f0] shadow-sm">
              <img
                src={getImageUrl(url)}
                alt={`Candidate ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />
              <button
                type="button"
                onClick={() => handleDeletePhoto(index)}
                disabled={updateGalleryMutation.isPending}
                className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-white hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 cursor-pointer border-0"
              >
                <Trash className="h-3.5 w-3.5" />
              </button>
              {index === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2.5">
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-rose-500 text-white shadow-sm">
                    Featured
                  </span>
                </div>
              )}
              <div className="absolute bottom-2 right-2">
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-white/90 text-[#0f172a] shadow-sm">
                  #{index + 1}
                </span>
              </div>
            </div>
          ))}

          {additionalPhotos.length < 5 && (
            <label className="group relative aspect-[4/5] rounded-xl border-2 border-dashed border-[#e2e8f0] hover:border-rose-300 cursor-pointer flex flex-col items-center justify-center gap-2 bg-[#fafbfc] hover:bg-rose-50/30 transition-all duration-300">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
              ) : (
                <>
                  <div className="p-2.5 rounded-full bg-rose-50 group-hover:bg-rose-100 transition-colors">
                    <Camera className="h-5 w-5 text-rose-400" />
                  </div>
                  <span className="text-[10px] font-bold text-[#64748b] group-hover:text-rose-600 uppercase tracking-wider transition-colors">
                    Upload Photo
                  </span>
                  <span className="text-[8px] text-[#94a3b8]">PNG, JPG or WEBP</span>
                </>
              )}
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

        {/* Privacy note - minimal */}
        <div className="mt-8 mb-4 flex items-start gap-2.5 bg-[#f8fafc] rounded-xl px-4 py-3 border border-[#e2e8f0]">
          <Shield className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#64748b] leading-relaxed">
            <span className="font-semibold text-[#0f172a]">Confidentiality Safeguard:</span> Only the first gallery image is visible to prospective matches before connection approval.
          </p>
        </div>
      </div>
    </div>
  )
}
