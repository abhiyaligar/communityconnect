import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import api from "@/lib/api"
import { handleApiError, getImageUrl } from "@/lib/utils"
import { ArrowLeft, Loader2, Save, Heart, User, Briefcase, Star, Users, Coffee, Eye, Camera, Trash, Plus, Shield } from "lucide-react"

export default function EditMatrimony() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPreview, setShowPreview] = useState(false)

  // Double Approval State
  const [doubleApprovalRequired, setDoubleApprovalRequired] = useState(false)
  const [coApproverUsername, setCoApproverUsername] = useState("")
  const [coApproverProfileId, setCoApproverProfileId] = useState<string | null>(null)
  const [coApproverName, setCoApproverName] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState("")
  const [coApproverApproved, setCoApproverApproved] = useState(false)
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>([])
  const [uploadingGallery, setUploadingGallery] = useState(false)

  const handleGalleryPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (additionalPhotos.length >= 5) {
      setError("You can only upload up to 5 additional photos (6 photos total).")
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("Image file is too large. Maximum size is 20MB.")
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    setUploadingGallery(true)
    setError("")
    try {
      const res = await api.post("/uploads/image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      setAdditionalPhotos((prev) => [...prev, res.data.url])
    } catch (err: any) {
      setError(handleApiError(err, "Failed to upload gallery image."))
    } finally {
      setUploadingGallery(false)
    }
  }

  const handleDeleteGalleryPhoto = (indexToDelete: number) => {
    setAdditionalPhotos((prev) => prev.filter((_, i) => i !== indexToDelete))
  }

  // Form State
  const [formData, setFormData] = useState<any>({
    height_cm: "",
    body_type: "",
    complexion: "",
    highest_qualification: "",
    field_of_study: "",
    institution: "",
    employment_type: "",
    job_title: "",
    income_range: "",
    work_location: "",
    gotra: "",
    rashi: "",
    nakshatra: "",
    manglik_status: "",
    birth_time: "",
    birth_place: "",
    father_name: "",
    father_occupation: "",
    mother_name: "",
    mother_occupation: "",
    brothers_count: "",
    brothers_marital_status: "",
    sisters_count: "",
    sisters_marital_status: "",
    family_type: "",
    family_values: "",
    family_financial_status: "",
    diet: "",
    smoking: "",
    drinking: "",
    physical_activity: "",
    about_me: "",
    hobbies: "",
    languages: "",
  })

  useEffect(() => {
    if (user && user.matrimony) {
      setFormData({
        ...user.matrimony,
        hobbies: Array.isArray(user.matrimony.hobbies) ? user.matrimony.hobbies.join(", ") : user.matrimony.hobbies || "",
        languages: Array.isArray(user.matrimony.languages) ? user.matrimony.languages.join(", ") : user.matrimony.languages || "",
      })
      setDoubleApprovalRequired(!!user.matrimony.double_approval_required)
      setCoApproverUsername(user.matrimony.family_co_approver_username || "")
      setCoApproverProfileId(user.matrimony.family_co_approver_profile_id || null)
      setCoApproverName(user.matrimony.family_co_approver_name || null)
      setCoApproverApproved(!!user.matrimony.family_co_approver_approved)
      setAdditionalPhotos(user.matrimony.additional_photos || [])
    }
  }, [user])

  const handleVerifyUsername = async () => {
    if (!coApproverUsername.trim()) return
    setVerifying(true)
    setVerifyError("")
    setCoApproverName(null)
    setCoApproverProfileId(null)
    setCoApproverApproved(false)
    try {
      const res = await api.get(`/profiles/by-username/${coApproverUsername.trim()}`)
      // Check if trying to co-approve yourself (user's own profile ID, wait, user.id is user account ID, profile_id is returned by lookup)
      // Let's verify: AuthUser has profile_id? Wait, in types/index.ts, AuthUser does NOT have profile_id directly, wait, does it?
      // Let's check GET /me response: it returns user details but actually profile details.
      // Wait, in profiles.py GET /me returns:
      // "id": str(current_user.id) -> this is the user ID. But wait! The co-approver_profile_id is a PROFILE ID.
      // In the lookup by-username we return {"profile_id": str(profile.id), "full_name": profile.full_name}.
      // So to check if it's the current user, we can compare res.data.profile_id with user's profile ID?
      // Wait! How does frontend know current user's profile ID?
      // Let's check `types/index.ts` AuthUser:
      // `export interface AuthUser { id: string; role: UserRole; ... }`
      // Wait, is user.id the profile ID or user ID?
      // Let's check `profiles.py` GET /me:
      // `return { "id": str(current_user.id), ... }` -> user.id is the User ID.
      // Wait, how do we get current user's Profile ID in frontend?
      // Ah, in profiles.py onboarding we raise 400 if profile already exists.
      // Let's check if we return the Profile ID in GET /me.
      // We didn't, but wait, can we compare the username? If res.data.full_name is user.full_name, or if we lookup the username, if coApproverUsername.trim() === user.username, it's themselves!
      // Comparing username is MUCH easier and 100% correct!
      if (coApproverUsername.trim() === user?.username) {
        setVerifyError("You cannot select yourself as a family co-approver.")
      } else {
        setCoApproverProfileId(res.data.profile_id)
        setCoApproverName(res.data.full_name)
      }
    } catch (err: any) {
      setVerifyError(err.response?.data?.detail || "Username not found.")
    } finally {
      setVerifying(false)
    }
  }

  const handleSelect = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const getPayload = () => {
    return {
      ...formData,
      hobbies: formData.hobbies ? formData.hobbies.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      languages: formData.languages ? formData.languages.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      double_approval_required: doubleApprovalRequired,
      family_co_approver_profile_id: doubleApprovalRequired ? coApproverProfileId : null,
      additional_photos: additionalPhotos,
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (doubleApprovalRequired && !coApproverProfileId) {
      setError("Please verify a valid family co-approver username before saving.")
      return
    }
    setLoading(true)
    setError("")
    
    try {
      await api.put("/profiles/me/matrimony", getPayload())
      await refreshUser()
      navigate("/dashboard")
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  const userAge = user?.date_of_birth
    ? Math.floor((Date.now() - new Date(user.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?"

  const previewPayload = getPayload()

  return (
    <>
      <div className="space-y-8 animate-fade-in text-[#0f172a] max-w-4xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">
              Matrimonial Profile
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-500/10 text-rose-500">
              <Heart className="h-3 w-3" /> Setup
            </span>
          </div>
          <p className="text-sm text-[#64748b] mt-1">
            Complete your preferences, physical attributes, background, and gallery to get verified matches.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="border-[#e2e8f0] text-foreground hover:bg-muted text-xs font-semibold px-4 h-9 gap-1.5 shrink-0 self-start sm:self-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Matches</span>
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/5 text-destructive text-xs p-4 rounded-xl text-center border border-destructive/20 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION: ABOUT ME */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center gap-2 pb-3 border-b border-[#e2e8f0]">
            <div className="text-rose-500">
              <User className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">About Candidate</h3>
          </div>
          <div className="space-y-2 pt-1">
            <Label htmlFor="about_me" className="text-xs text-[#0f172a] font-medium">Describe yourself, your outlook, and what you are looking for in a partner</Label>
            <textarea
              id="about_me"
              name="about_me"
              rows={4}
              placeholder="E.g. I am family-oriented, working in tech..."
              value={formData.about_me || ""}
              onChange={handleChange}
              className="w-full border-b border-[#e2e8f0] bg-transparent px-0 py-2 text-xs text-[#0f172a] placeholder-[#64748b] focus:outline-none resize-none"
            />
          </div>
        </section>

        {/* SECTION: PHYSICAL */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center gap-2 pb-3 border-b border-[#e2e8f0]">
            <div className="text-rose-500">
              <User className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">Physical Attributes</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Height (cm)</Label>
              <Input name="height_cm" type="number" placeholder="e.g. 175" value={formData.height_cm || ""} onChange={handleChange} className="rounded-xl border-[#e2e8f0] text-xs h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Body Type</Label>
              <Select value={formData.body_type || ""} onValueChange={(v) => handleSelect("body_type", v)}>
                <SelectTrigger className="rounded-xl border-[#e2e8f0] text-xs h-10"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="slim">Slim</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="athletic">Athletic</SelectItem>
                  <SelectItem value="heavy">Heavy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Complexion</Label>
              <Select value={formData.complexion || ""} onValueChange={(v) => handleSelect("complexion", v)}>
                <SelectTrigger className="rounded-xl border-[#e2e8f0] text-xs h-10"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="wheatish">Wheatish</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* SECTION: PROFESSIONAL */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center gap-2 pb-3 border-b border-[#e2e8f0]">
            <div className="text-rose-500">
              <Briefcase className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">Education & Career</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Highest Qualification</Label>
              <Select value={formData.highest_qualification || ""} onValueChange={(v) => handleSelect("highest_qualification", v)}>
                <SelectTrigger className="rounded-xl border-[#e2e8f0] text-xs h-10"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10th">10th Pass</SelectItem>
                  <SelectItem value="12th">12th Pass</SelectItem>
                  <SelectItem value="diploma">Diploma</SelectItem>
                  <SelectItem value="bachelors">Bachelor's</SelectItem>
                  <SelectItem value="masters">Master's</SelectItem>
                  <SelectItem value="phd">PhD</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Field of Study</Label>
              <Input name="field_of_study" placeholder="e.g. Computer Science" value={formData.field_of_study || ""} onChange={handleChange} className="rounded-xl border-[#e2e8f0] text-xs h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Institution</Label>
              <Input name="institution" placeholder="e.g. IIT Bangalore" value={formData.institution || ""} onChange={handleChange} className="rounded-xl border-[#e2e8f0] text-xs h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Employment Type</Label>
              <Select value={formData.employment_type || ""} onValueChange={(v) => handleSelect("employment_type", v)}>
                <SelectTrigger className="rounded-xl border-[#e2e8f0] text-xs h-10"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employed">Employed</SelectItem>
                  <SelectItem value="self_employed">Self Employed</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="not_working">Not Working</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Job Title / Designation</Label>
              <Input name="job_title" placeholder="e.g. Software Engineer" value={formData.job_title || ""} onChange={handleChange} className="rounded-xl border-[#e2e8f0] text-xs h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Income Range</Label>
              <Select value={formData.income_range || ""} onValueChange={(v) => handleSelect("income_range", v)}>
                <SelectTrigger className="rounded-xl border-[#e2e8f0] text-xs h-10"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="below_2l">Below 2 Lakhs</SelectItem>
                  <SelectItem value="2_5l">2 - 5 Lakhs</SelectItem>
                  <SelectItem value="5_10l">5 - 10 Lakhs</SelectItem>
                  <SelectItem value="10_20l">10 - 20 Lakhs</SelectItem>
                  <SelectItem value="above_20l">Above 20 Lakhs</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-3">
              <Label className="text-xs font-semibold text-[#0f172a]">Work Location / City</Label>
              <Input name="work_location" placeholder="e.g. Bengaluru, Karnataka" value={formData.work_location || ""} onChange={handleChange} className="rounded-xl border-[#e2e8f0] text-xs h-10" />
            </div>
          </div>
        </section>

        {/* SECTION: HOROSCOPE */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center gap-2 pb-3 border-b border-[#e2e8f0]">
            <div className="text-rose-500">
              <Star className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">Horoscope & Astro</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Gotra</Label>
              <Input name="gotra" placeholder="Your gotra" value={formData.gotra || ""} onChange={handleChange} className="rounded-xl border-[#e2e8f0] text-xs h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Rashi / Zodiac</Label>
              <Input name="rashi" placeholder="e.g. Leo" value={formData.rashi || ""} onChange={handleChange} className="rounded-xl border-[#e2e8f0] text-xs h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Nakshatra</Label>
              <Input name="nakshatra" placeholder="e.g. Rohini" value={formData.nakshatra || ""} onChange={handleChange} className="rounded-xl border-[#e2e8f0] text-xs h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Manglik Status</Label>
              <Select value={formData.manglik_status || ""} onValueChange={(v) => handleSelect("manglik_status", v)}>
                <SelectTrigger className="rounded-xl border-[#e2e8f0] text-xs h-10"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="partial">Partial / Anshik</SelectItem>
                  <SelectItem value="dont_know">Don't Know</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Birth Time</Label>
              <Input name="birth_time" placeholder="e.g. 05:45 PM" value={formData.birth_time || ""} onChange={handleChange} className="rounded-xl border-[#e2e8f0] text-xs h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Birth Place</Label>
              <Input name="birth_place" placeholder="e.g. Mysuru, Karnataka" value={formData.birth_place || ""} onChange={handleChange} className="rounded-xl border-[#e2e8f0] text-xs h-10" />
            </div>
          </div>
        </section>

        {/* SECTION: FAMILY */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center gap-2 pb-3 border-b border-[#e2e8f0]">
            <div className="text-rose-500">
              <Users className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">Family Background</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Father's Name</Label>
              <Input name="father_name" placeholder="Father's full name" value={formData.father_name || ""} onChange={handleChange} className="rounded-xl border-[#e2e8f0] text-xs h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Father's Occupation</Label>
              <Input name="father_occupation" placeholder="e.g. Retired Engineer" value={formData.father_occupation || ""} onChange={handleChange} className="rounded-xl border-[#e2e8f0] text-xs h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Mother's Name</Label>
              <Input name="mother_name" placeholder="Mother's full name" value={formData.mother_name || ""} onChange={handleChange} className="rounded-xl border-[#e2e8f0] text-xs h-10" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Mother's Occupation</Label>
              <Input name="mother_occupation" placeholder="e.g. Teacher" value={formData.mother_occupation || ""} onChange={handleChange} className="rounded-xl border-[#e2e8f0] text-xs h-10" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Brothers (Count / Marital status)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input name="brothers_count" placeholder="Count" type="number" value={formData.brothers_count || ""} onChange={handleChange} className="rounded-xl border-[#e2e8f0] text-xs h-10" />
                <Input name="brothers_marital_status" placeholder="e.g. Married / Single" value={formData.brothers_marital_status || ""} onChange={handleChange} className="rounded-xl border-[#e2e8f0] text-xs h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Sisters (Count / Marital status)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input name="sisters_count" placeholder="Count" type="number" value={formData.sisters_count || ""} onChange={handleChange} className="rounded-xl border-[#e2e8f0] text-xs h-10" />
                <Input name="sisters_marital_status" placeholder="e.g. Married / Single" value={formData.sisters_marital_status || ""} onChange={handleChange} className="rounded-xl border-[#e2e8f0] text-xs h-10" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Family Type</Label>
              <Select value={formData.family_type || ""} onValueChange={(v) => handleSelect("family_type", v)}>
                <SelectTrigger className="rounded-xl border-[#e2e8f0] text-xs h-10"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nuclear">Nuclear</SelectItem>
                  <SelectItem value="joint">Joint</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Family Values</Label>
              <Select value={formData.family_values || ""} onValueChange={(v) => handleSelect("family_values", v)}>
                <SelectTrigger className="rounded-xl border-[#e2e8f0] text-xs h-10"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="traditional">Traditional</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="liberal">Liberal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Family Financial Status</Label>
              <Select value={formData.family_financial_status || ""} onValueChange={(v) => handleSelect("family_financial_status", v)}>
                <SelectTrigger className="rounded-xl border-[#e2e8f0] text-xs h-10"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rich">Rich</SelectItem>
                  <SelectItem value="upper_middle">Upper Middle Class</SelectItem>
                  <SelectItem value="middle">Middle Class</SelectItem>
                  <SelectItem value="lower_middle">Lower Middle Class</SelectItem>
                  <SelectItem value="poor">Lower Class</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* SECTION: LIFESTYLE */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center gap-2 pb-3 border-b border-[#e2e8f0]">
            <div className="text-rose-500">
              <Coffee className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">Lifestyle</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Diet</Label>
              <Select value={formData.diet || ""} onValueChange={(v) => handleSelect("diet", v)}>
                <SelectTrigger className="rounded-xl border-[#e2e8f0] text-xs h-10"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vegetarian">Vegetarian</SelectItem>
                  <SelectItem value="eggetarian">Eggetarian</SelectItem>
                  <SelectItem value="non_vegetarian">Non-Vegetarian</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Smoking</Label>
              <Select value={formData.smoking || ""} onValueChange={(v) => handleSelect("smoking", v)}>
                <SelectTrigger className="rounded-xl border-[#e2e8f0] text-xs h-10"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="occasionally">Occasionally</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Drinking</Label>
              <Select value={formData.drinking || ""} onValueChange={(v) => handleSelect("drinking", v)}>
                <SelectTrigger className="rounded-xl border-[#e2e8f0] text-xs h-10"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="occasionally">Occasionally</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#0f172a]">Physical Activity</Label>
              <Select value={formData.physical_activity || ""} onValueChange={(v) => handleSelect("physical_activity", v)}>
                <SelectTrigger className="rounded-xl border-[#e2e8f0] text-xs h-10"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No / Low</SelectItem>
                  <SelectItem value="occasionally">Occasionally</SelectItem>
                  <SelectItem value="yes">Regular / Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* SECTION: HOBBIES & LANGUAGES */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center gap-2 pb-3 border-b border-[#e2e8f0]">
            <div className="text-rose-500">
              <Heart className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">Hobbies & Languages</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
            <div className="space-y-2">
              <Label htmlFor="hobbies" className="text-xs font-semibold text-[#0f172a]">Hobbies (comma-separated)</Label>
              <Input id="hobbies" name="hobbies" placeholder="e.g. Reading, Hiking, Cooking" value={formData.hobbies || ""} onChange={handleChange} className="rounded-xl border-[#e2e8f0] text-xs h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="languages" className="text-xs font-semibold text-[#0f172a]">Languages spoken (comma-separated)</Label>
              <Input id="languages" name="languages" placeholder="e.g. English, Hindi, Kannada" value={formData.languages || ""} onChange={handleChange} className="rounded-xl border-[#e2e8f0] text-xs h-10" />
            </div>
          </div>
        </section>

        {/* SECTION: DOUBLE APPROVAL */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center gap-2 pb-3 border-b border-[#e2e8f0]">
            <div className="text-rose-500">
              <Shield className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">Double Approval Settings</h3>
          </div>
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 pr-4">
                <Label htmlFor="double_approval" className="text-xs font-bold text-[#0f172a] cursor-pointer">Require Family Member Approval</Label>
                <p className="text-[11px] text-[#64748b] leading-normal font-medium">
                  If enabled, requests to connect will require approval from both you and a designated family member.
                </p>
              </div>
              <input
                id="double_approval"
                type="checkbox"
                checked={doubleApprovalRequired}
                onChange={(e) => {
                  setDoubleApprovalRequired(e.target.checked)
                  if (!e.target.checked) {
                    setCoApproverUsername("")
                    setCoApproverProfileId(null)
                    setCoApproverName(null)
                    setVerifyError("")
                  }
                }}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-foreground shrink-0"
              />
            </div>

            {doubleApprovalRequired && (
              <div className="space-y-3 pt-3 border-t border-[#e2e8f0]">
                <Label htmlFor="co_approver" className="text-xs font-semibold text-[#0f172a]">Family Co-approver Username</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono">@</span>
                    <Input
                      id="co_approver"
                      value={coApproverUsername}
                      onChange={(e) => {
                        setCoApproverUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                        setCoApproverProfileId(null)
                        setCoApproverName(null)
                        setCoApproverApproved(false)
                        setVerifyError("")
                      }}
                      className="pl-7 font-mono text-xs rounded-xl border-[#e2e8f0] h-10"
                      placeholder="username"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleVerifyUsername}
                    disabled={verifying || !coApproverUsername.trim()}
                    className="text-xs rounded-xl h-10 px-4"
                  >
                    {verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Verify"}
                  </Button>
                </div>
                
                {coApproverName && (
                  <div className="space-y-1.5 mt-1">
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <span>✓ Verified:</span> <span className="font-semibold text-emerald-700">{coApproverName}</span>
                    </p>
                    {coApproverApproved ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold py-0.5 rounded px-2">
                        Verified & Confirmed ✓
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold py-0.5 rounded px-2">
                        Pending Guardian Confirmation ⏳
                      </Badge>
                    )}
                  </div>
                )}
                {verifyError && (
                  <p className="text-xs text-destructive font-medium">{verifyError}</p>
                )}
                {!coApproverProfileId && !verifyError && (
                  <p className="text-xs text-amber-500 font-medium">
                    * Please verify the co-approver username to save.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Photo Gallery has been relocated to its own dedicated page at /matrimony/gallery */}

        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto border-[#e2e8f0] text-foreground hover:bg-muted text-xs font-semibold h-10 px-4 rounded-xl"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="mr-2 h-4 w-4" /> Preview Profile
          </Button>
          <div className="flex justify-end gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              className="flex-1 sm:flex-none border-[#e2e8f0] text-foreground hover:bg-muted text-xs font-semibold h-10 px-4 rounded-xl"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-40 flex-1 sm:flex-none bg-[#0f172a] text-white hover:bg-[#1e293b] text-xs font-semibold h-10 rounded-xl"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Profile
            </Button>
          </div>
        </div>
      </form>
    </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto border border-border bg-card">
          <DialogHeader className="pb-4 border-b border-border">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <Avatar className="h-16 w-16 border border-border">
              <AvatarImage src={getImageUrl(user.profile_photo_url)} />
                <AvatarFallback className="text-xl font-bold bg-muted text-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <DialogTitle className="text-xl font-bold">{user.full_name}</DialogTitle>
                  <Badge className="text-[10px]">Preview Mode</Badge>
                </div>
                <DialogDescription className="text-xs flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                  {userAge && <Badge variant="secondary" className="text-[10px]">{userAge} yrs</Badge>}
                  <Badge variant="outline" className="text-[10px] capitalize font-normal">{user.gender}</Badge>
                  <Badge variant="outline" className="text-[10px] capitalize font-normal">{user.marital_status}</Badge>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-8 pt-4 text-sm">
            {/* About Me */}
            {previewPayload.about_me && (
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-bold text-muted-foreground tracking-wider">About Me</h4>
                <p className="text-foreground leading-relaxed bg-secondary/30 p-3.5 rounded-lg border border-border/50">{previewPayload.about_me}</p>
              </div>
            )}

            {/* Personal & Physical */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                <User className="h-4 w-4 text-foreground" /> Personal Details
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-secondary/20 rounded-lg border border-border/30">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Height</p>
                  <p className="font-semibold text-xs mt-0.5">{previewPayload.height_cm ? `${previewPayload.height_cm} cm` : "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Body Type</p>
                  <p className="font-semibold text-xs mt-0.5 capitalize">{previewPayload.body_type || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Complexion</p>
                  <p className="font-semibold text-xs mt-0.5 capitalize">{previewPayload.complexion || "—"}</p>
                </div>
              </div>
            </div>

            {/* Horoscope */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Star className="h-4 w-4 text-foreground" /> Horoscope & Astro
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-secondary/20 rounded-lg border border-border/30">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Gotra</p>
                  <p className="font-semibold text-xs mt-0.5">{previewPayload.gotra || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Rashi</p>
                  <p className="font-semibold text-xs mt-0.5 capitalize">{previewPayload.rashi || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Nakshatra</p>
                  <p className="font-semibold text-xs mt-0.5 capitalize">{previewPayload.nakshatra || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Manglik</p>
                  <p className="font-semibold text-xs mt-0.5 capitalize">{previewPayload.manglik_status || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Birth Time</p>
                  <p className="font-semibold text-xs mt-0.5">{previewPayload.birth_time || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Birth Place</p>
                  <p className="font-semibold text-xs mt-0.5">{previewPayload.birth_place || "—"}</p>
                </div>
              </div>
            </div>

            {/* Professional */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-foreground" /> Education & Career
              </h4>
              <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/20 rounded-lg border border-border/30">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Qualification</p>
                  <p className="font-semibold text-xs mt-0.5 capitalize">{previewPayload.highest_qualification || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Field of Study</p>
                  <p className="font-semibold text-xs mt-0.5">{previewPayload.field_of_study || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Institution</p>
                  <p className="font-semibold text-xs mt-0.5">{previewPayload.institution || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Employment Type</p>
                  <p className="font-semibold text-xs mt-0.5 capitalize">{previewPayload.employment_type?.replace(/_/g, " ") || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Job Title</p>
                  <p className="font-semibold text-xs mt-0.5">{previewPayload.job_title || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Income Range</p>
                  <p className="font-semibold text-xs mt-0.5 uppercase">{previewPayload.income_range?.replace(/_/g, " ") || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Work Location</p>
                  <p className="font-semibold text-xs mt-0.5">{previewPayload.work_location || "—"}</p>
                </div>
              </div>
            </div>

            {/* Family Details */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Users className="h-4 w-4 text-foreground" /> Family details
              </h4>
              <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/20 rounded-lg border border-border/30">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Father's Name</p>
                  <p className="font-semibold text-xs mt-0.5">{previewPayload.father_name || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Father's Occupation</p>
                  <p className="font-semibold text-xs mt-0.5">{previewPayload.father_occupation || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Mother's Name</p>
                  <p className="font-semibold text-xs mt-0.5">{previewPayload.mother_name || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Mother's Occupation</p>
                  <p className="font-semibold text-xs mt-0.5">{previewPayload.mother_occupation || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Siblings</p>
                  <p className="font-semibold text-xs mt-0.5">
                    Brothers: {previewPayload.brothers_count || "0"} ({previewPayload.brothers_marital_status || "—"}), 
                    Sisters: {previewPayload.sisters_count || "0"} ({previewPayload.sisters_marital_status || "—"})
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Family Details</p>
                  <p className="font-semibold text-xs mt-0.5">
                    {previewPayload.family_type || "—"} Type, {previewPayload.family_values || "—"} Values
                  </p>
                </div>
              </div>
            </div>

            {/* Lifestyle & Hobbies */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Coffee className="h-4 w-4 text-foreground" /> Lifestyle & Preferences
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-secondary/20 rounded-lg border border-border/30">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Diet</p>
                  <p className="font-semibold text-xs mt-0.5 capitalize">{previewPayload.diet || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Smoking</p>
                  <p className="font-semibold text-xs mt-0.5 capitalize">{previewPayload.smoking || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Drinking</p>
                  <p className="font-semibold text-xs mt-0.5 capitalize">{previewPayload.drinking || "—"}</p>
                </div>
              </div>
            </div>

            {/* Hobbies / Languages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {previewPayload.hobbies && previewPayload.hobbies.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Hobbies</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {previewPayload.hobbies.map((h: string) => (
                      <Badge key={h} variant="secondary" className="text-[10px] font-normal">{h}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {previewPayload.languages && previewPayload.languages.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Languages</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {previewPayload.languages.map((l: string) => (
                      <Badge key={l} variant="secondary" className="text-[10px] font-normal">{l}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Gallery Photos Preview */}
            {previewPayload.additional_photos && previewPayload.additional_photos.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-foreground" /> Gallery Preview
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {previewPayload.additional_photos.map((url: string, i: number) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                      <img src={getImageUrl(url)} alt={`Gallery Preview ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
