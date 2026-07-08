import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Globe, Lock, Loader2 } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"
import { getImageUrl, handleApiError } from "@/lib/utils"

export default function EditProfile() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, refreshUser } = useAuth()

  const [phone, setPhone]           = useState("")
  const [address, setAddress]       = useState("")
  const [occupation, setOccupation] = useState("")
  const [photoUrl, setPhotoUrl]     = useState("")
  const [gender, setGender]         = useState("male")
  const [maritalStatus, setMaritalStatus] = useState("single")
  const [linkedin, setLinkedin]     = useState("")
  const [instagram, setInstagram]   = useState("")
  const [facebook, setFacebook]     = useState("")
  const [twitter, setTwitter]       = useState("")

  const [phonePublic, setPhonePublic]     = useState(true)
  const [emailPublic, setEmailPublic]     = useState(false)
  const [addressPublic, setAddressPublic] = useState(true)

  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState("")

  // Ensure we always have the latest profile data (including email)
  useEffect(() => {
    refreshUser()
  }, [])

  useEffect(() => {
    if (user) {
      setPhone(user.contact_number || "")
      setAddress(user.address || "")
      setOccupation(user.occupation || "")
      setPhotoUrl(user.profile_photo_url || "")
      setGender(user.gender || "male")
      setMaritalStatus(user.marital_status || "single")
      const s = user.social_links || {}
      setLinkedin(s.linkedin || "")
      setInstagram(s.instagram || "")
      setFacebook(s.facebook || "")
      setTwitter(s.twitter || "")

      const pPub = localStorage.getItem("phone_public")
      const ePub = localStorage.getItem("email_public")
      const aPub = localStorage.getItem("address_public")
      if (pPub !== null) setPhonePublic(pPub === "true")
      if (ePub !== null) setEmailPublic(ePub === "true")
      if (aPub !== null) setAddressPublic(aPub === "true")
    }
  }, [user])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) { toast.error("Image too large. Max 20MB."); return }
    const fd = new FormData()
    fd.append("file", file)
    setUploading(true)
    try {
      const res = await api.post("/uploads/image", fd, { headers: { "Content-Type": "multipart/form-data" } })
      setPhotoUrl(res.data.url)
      toast.success("Photo uploaded!")
    } catch (err: any) {
      toast.error(handleApiError(err, "Upload failed."))
    } finally {
      setUploading(false)
    }
  }

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: any) => (await api.put("/profiles/me", payload)).data,
    onSuccess: () => {
      localStorage.setItem("phone_public",   phonePublic.toString())
      localStorage.setItem("email_public",   emailPublic.toString())
      localStorage.setItem("address_public", addressPublic.toString())
      toast.success("Profile updated!")
      queryClient.invalidateQueries({ queryKey: ["my-matrimony-profile"] })
      refreshUser()
      navigate("/profile")
    },
    onError: (err: any) => setError(handleApiError(err)),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    updateProfileMutation.mutate({
      contact_number: phone, address, occupation,
      profile_photo_url: photoUrl, gender, marital_status: maritalStatus,
      social_links: { linkedin, instagram, facebook, twitter },
    })
  }

  const inputCls = "w-full bg-transparent border-b border-[#e2e8f0] text-[#0f172a] py-2 focus:outline-none focus:border-[#0f172a] text-sm transition-colors"
  const selectCls = "w-full bg-transparent border-b border-[#e2e8f0] text-[#0f172a] py-2 focus:outline-none text-sm"
  const labelCls = "block text-[10px] uppercase font-bold text-[#64748b] tracking-wider mb-0.5"

  const VisToggle = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all shrink-0 ${
        active ? "bg-[#10b981]/10 border-[#10b981]/25 text-[#10b981]" : "bg-[#64748b]/10 border-[#64748b]/25 text-[#64748b]"
      }`}
    >
      {active ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
      <span>{active ? "Public" : "Restricted"}</span>
    </button>
  )

  return (
    <div className="max-w-2xl mx-auto py-4 md:py-8 px-3 md:px-0 text-[#0f172a]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit Profile</h1>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-xs font-semibold">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10">

        {/* ── Profile Photo ── */}
        <section className="space-y-4">
          <p className={labelCls}>Profile Photo</p>
          <div className="flex items-center gap-4">
            {photoUrl ? (
              <img src={getImageUrl(photoUrl)} alt="Preview" className="w-16 h-16 rounded-full object-cover border border-[#e2e8f0]" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center text-[10px] text-[#64748b]">No photo</div>
            )}
            <div className="flex-1">
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handlePhotoUpload}
                disabled={uploading}
                className="w-full text-xs text-[#64748b] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-[#e2e8f0] file:text-[10px] file:font-bold file:bg-[#f8fafc] file:text-[#0f172a] cursor-pointer"
              />
              {uploading && <p className="text-[10px] text-[#64748b] mt-1 animate-pulse">Uploading…</p>}
            </div>
          </div>
        </section>

        <div className="border-t border-[#e2e8f0]" />

        {/* ── Personal Info ── */}
        <section className="space-y-6">
          <p className={labelCls}>Personal Information</p>

          {/* Locked fields */}
          <div className="grid sm:grid-cols-2 gap-6 opacity-60">
            <div>
              <label className={labelCls}>Full Name</label>
              <input type="text" value={user?.full_name || ""} disabled className={inputCls + " cursor-not-allowed"} />
            </div>
            <div>
              <label className={labelCls}>Date of Birth</label>
              <input type="text" value={user?.date_of_birth || ""} disabled className={inputCls + " cursor-not-allowed"} />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <div>
              <label className={labelCls}>Occupation</label>
              <input type="text" value={occupation} onChange={e => setOccupation(e.target.value)} placeholder="e.g. Engineer" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value)} className={selectCls}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Marital Status</label>
              <select value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)} className={selectCls}>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>
          </div>
        </section>

        <div className="border-t border-[#e2e8f0]" />

        {/* ── Contact & Visibility ── */}
        <section className="space-y-6">
          <p className={labelCls}>Contact & Visibility</p>

          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <label className={labelCls}>Phone Number</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" className={inputCls} />
            </div>
            <VisToggle active={phonePublic} onToggle={() => setPhonePublic(p => !p)} />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <label className={labelCls}>Email Address</label>
              <input type="email" value={user?.email || ""} disabled className={inputCls + " opacity-60 cursor-not-allowed"} />
            </div>
            <VisToggle active={emailPublic} onToggle={() => setEmailPublic(p => !p)} />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1">
              <label className={labelCls}>Residential Address</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, City, State" rows={3}
                className="w-full bg-transparent border-b border-[#e2e8f0] text-[#0f172a] py-2 focus:outline-none focus:border-[#0f172a] text-sm resize-none" />
            </div>
            <div className="mt-6 sm:mt-0 pt-7">
              <VisToggle active={addressPublic} onToggle={() => setAddressPublic(p => !p)} />
            </div>
          </div>
        </section>

        <div className="border-t border-[#e2e8f0]" />

        {/* ── Social Profiles ── */}
        <section className="space-y-6">
          <p className={labelCls}>Social Profiles</p>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { label: "LinkedIn", value: linkedin, set: setLinkedin, ph: "linkedin-username" },
              { label: "Instagram", value: instagram, set: setInstagram, ph: "instagram-username" },
              { label: "Facebook", value: facebook, set: setFacebook, ph: "facebook-username" },
              { label: "Twitter / X", value: twitter, set: setTwitter, ph: "twitter-username" },
            ].map(({ label, value, set, ph }) => (
              <div key={label}>
                <label className={labelCls}>{label}</label>
                <input type="text" value={value} onChange={e => set(e.target.value)} placeholder={ph} className={inputCls} />
              </div>
            ))}
          </div>
        </section>

        <div className="border-t border-[#e2e8f0]" />

        {/* ── Footer ── */}
        <div className="flex justify-end gap-3 pb-4">
          <Button type="button" variant="outline" onClick={() => navigate("/profile")}
            className="border-[#e2e8f0] text-foreground hover:bg-muted text-xs font-semibold px-5 h-9 rounded-lg">
            Cancel
          </Button>
          <Button type="submit" disabled={updateProfileMutation.isPending}
            className="bg-[#0f172a] text-white hover:bg-[#1e293b] text-xs font-semibold px-5 h-9 rounded-lg flex items-center gap-1.5">
            {updateProfileMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
