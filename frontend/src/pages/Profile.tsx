import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  Download,
  Edit,
  Globe,
  Lock,
  Plus,
  MoreVertical,
  Check,
  Loader2
} from "lucide-react"
import { toast } from "sonner"

export default function Profile() {
  const queryClient = useQueryClient()
  const { user, refreshUser } = useAuth()

  // Toggle state switches for contact details
  const [phonePublic, setPhonePublic] = useState(true)
  const [emailPublic, setEmailPublic] = useState(false)
  const [addressPublic, setAddressPublic] = useState(true)

  // Dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Profile Edit fields state
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [occupation, setOccupation] = useState("")
  const [photoUrl, setPhotoUrl] = useState("")
  const [gender, setGender] = useState("male")
  const [maritalStatus, setMaritalStatus] = useState("single")
  const [linkedin, setLinkedin] = useState("")
  const [instagram, setInstagram] = useState("")
  const [facebook, setFacebook] = useState("")
  const [twitter, setTwitter] = useState("")

  useEffect(() => {
    if (user) {
      setPhone(user.contact_number || "")
      setAddress(user.address || "")
      setOccupation(user.occupation || "")
      setPhotoUrl(user.profile_photo_url || "")
      setGender(user.gender || "male")
      setMaritalStatus(user.marital_status || "single")
      setLinkedin(user.social_links?.linkedin || "")
      setInstagram(user.social_links?.instagram || "")
      setFacebook(user.social_links?.facebook || "")
      setTwitter(user.social_links?.twitter || "")
    }
  }, [user, isEditDialogOpen])

  // Update Core Profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        contact_number: phone,
        address,
        occupation,
        profile_photo_url: photoUrl,
        gender,
        marital_status: maritalStatus,
        social_links: {
          linkedin,
          instagram,
          facebook,
          twitter
        }
      }
      await api.put("/profiles/me", payload)
    },
    onSuccess: () => {
      toast.success("Profile details updated successfully!")
      setIsEditDialogOpen(false)
      refreshUser()
      queryClient.invalidateQueries({ queryKey: ["profiles", "me"] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to update profile.")
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfileMutation.mutate()
  }

  // Use logged in user profile details from database
  const profileData = {
    full_name: user?.full_name || "Anonymous User",
    profile_photo_url: user?.profile_photo_url || "",
    role: user?.role === "verified_adult" ? "Family Head" : (user?.role?.replace(/_/g, " ") || "Member"),
    date_of_birth: user?.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—",
    blood_group: "—",
    marital_status: user?.marital_status ? user.marital_status.charAt(0).toUpperCase() + user.marital_status.slice(1) : "—",
    phone: user?.contact_number || "—",
    email: (user as any)?.email || "—",
    address: user?.address || "—",
    bio: user?.occupation ? `${user.occupation} within the community.` : "Community member."
  }

  const initials = profileData.full_name
    ? profileData.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?"

  const CustomSwitch = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
        checked ? "bg-[#10b981]" : "bg-[#eceef0]"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  )

  return (
    <div className="space-y-8 animate-fade-in text-[#0f172a]">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">
            Member Profile
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            Comprehensive view and family linkage details.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-[#e2e8f0] text-[#0f172a] gap-2 text-xs font-semibold px-4 py-2">
            <Download className="h-4 w-4" />
            <span>Export Data</span>
          </Button>
          <Button
            className="bg-[#0f172a] text-white hover:bg-[#1e293b] gap-2 text-xs font-semibold px-4 py-2"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit className="h-4 w-4" />
            <span>Edit Profile</span>
          </Button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Profile Summary Card */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm flex flex-col items-center text-center space-y-6">
          <Avatar className="h-28 w-28 border-4 border-white shadow-lg">
            <AvatarImage src={profileData.profile_photo_url} />
            <AvatarFallback className="text-3xl bg-[#f1f5f9] text-[#0f172a] font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#0f172a]">
              {profileData.full_name}
            </h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[#10b981]/10 text-[#10b981]">
              <Check className="h-3 w-3" />
              {user?.role === "unverified" ? "Pending Review" : "Identity Verified"}
            </span>
          </div>

          <p className="text-xs text-[#64748b] leading-relaxed max-w-xs">
            {profileData.bio}
          </p>

          {/* Metadata Table */}
          <div className="w-full pt-6 border-t border-[#e2e8f0] space-y-3.5 text-xs text-left">
            <div className="flex justify-between items-center">
              <span className="text-[#64748b]">Role</span>
              <span className="bg-[#f1f5f9] px-2.5 py-1 rounded-md text-[#0f172a] font-bold capitalize">
                {profileData.role}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#64748b]">Date of Birth</span>
              <span className="font-semibold text-[#0f172a]">{profileData.date_of_birth}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#64748b]">Blood Group</span>
              <span className="font-semibold text-[#0f172a]">{profileData.blood_group}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#64748b]">Marital Status</span>
              <span className="font-semibold text-[#0f172a]">{profileData.marital_status}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Stack of Cards */}
        <div className="lg:col-span-2 space-y-8">
          {/* Card 1: Contact Information */}
          <Card className="border border-[#e2e8f0] rounded-2xl shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-[#e2e8f0] pb-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#64748b]">
                Contact Information
              </CardTitle>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[#eceef0] text-[#0f172a]">
                Visibility Controls Active
              </span>
            </CardHeader>
            <CardContent className="divide-y divide-[#e2e8f0] p-0">
              {/* Phone Row */}
              <div className="p-6 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider">
                    Phone Number
                  </p>
                  <p className="text-sm font-semibold text-[#0f172a]">
                    {profileData.phone}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {phonePublic ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-[#10b981]/10 text-[#10b981]">
                      <Globe className="h-3 w-3" />
                      Public
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-[#64748b]/10 text-[#64748b]">
                      <Lock className="h-3 w-3" />
                      Restricted
                    </span>
                  )}

                  <CustomSwitch checked={phonePublic} onChange={setPhonePublic} />
                </div>
              </div>

              {/* Email Row */}
              <div className="p-6 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider">
                    Email Address
                  </p>
                  <p className="text-sm font-semibold text-[#0f172a]">
                    {profileData.email}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {emailPublic ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-[#10b981]/10 text-[#10b981]">
                      <Globe className="h-3 w-3" />
                      Public
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-[#64748b]/10 text-[#64748b]">
                      <Lock className="h-3 w-3" />
                      Restricted
                    </span>
                  )}

                  <CustomSwitch checked={emailPublic} onChange={setEmailPublic} />
                </div>
              </div>

              {/* Address Row */}
              <div className="p-6 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider">
                    Residential Address
                  </p>
                  <p className="text-sm font-semibold text-[#0f172a] leading-snug max-w-sm">
                    {profileData.address}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {addressPublic ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-[#10b981]/10 text-[#10b981]">
                      <Globe className="h-3 w-3" />
                      Public
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-[#64748b]/10 text-[#64748b]">
                      <Lock className="h-3 w-3" />
                      Restricted
                    </span>
                  )}

                  <CustomSwitch checked={addressPublic} onChange={setAddressPublic} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Family Unit */}
          <Card className="border border-[#e2e8f0] rounded-2xl shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-[#e2e8f0] pb-4 flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#64748b]">
                  Family Unit
                </CardTitle>
                <p className="text-[11px] text-[#64748b] font-medium leading-none">
                  Manage your dependents and view linked accounts.
                </p>
              </div>

              <Button
                variant="outline"
                className="border-[#e2e8f0] text-xs font-semibold gap-1.5 h-8"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Member</span>
              </Button>
            </CardHeader>
            <CardContent className="divide-y divide-[#e2e8f0] p-0">
              {/* Row 1: Self */}
              <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border border-[#e2e8f0] shadow-sm shrink-0">
                    <AvatarImage src={profileData.profile_photo_url} />
                    <AvatarFallback className="text-xs bg-[#f1f5f9] text-[#0f172a] font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-xs text-[#0f172a] flex items-center gap-1.5">
                      <span>{profileData.full_name}</span>
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-[#dae2fd] text-[#131b2e]">
                        Self
                      </span>
                    </h4>
                    <p className="text-[10px] text-[#64748b] font-medium">
                      {profileData.role} • {user?.role === "unverified" ? "Pending" : "Verified"}
                    </p>
                  </div>
                </div>

                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#64748b]">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>

              {/* Dynamic Wards list */}
              {user?.wards && user.wards.length > 0 ? (
                user.wards.map((ward) => {
                  const wardInitials = ward.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"
                  return (
                    <div key={ward.profile_id} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-[#e2e8f0] shadow-sm shrink-0">
                          <AvatarImage src={ward.profile_photo_url} />
                          <AvatarFallback className="text-xs bg-[#f1f5f9] text-[#0f172a] font-bold">
                            {wardInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-bold text-xs text-[#0f172a] flex items-center gap-1.5">
                            <span>{ward.full_name}</span>
                            {ward.approved && <Check className="h-3.5 w-3.5 text-[#10b981] font-extrabold" />}
                          </h4>
                          <p className="text-[10px] text-[#64748b] font-medium">
                            Dependent • {ward.approved ? "Verified" : "Pending Approval"}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="border-[#e2e8f0] text-[10px] font-bold h-8 px-3"
                      >
                        {ward.approved ? "View Profile" : "Edit Details"}
                      </Button>
                    </div>
                  )
                })
              ) : (
                <div className="p-6 text-center text-xs text-[#64748b]">
                  No dependents linked to this profile.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto border border-[#e2e8f0] bg-white p-8 rounded-2xl text-[#0f172a]">
          <DialogHeader className="pb-4 border-b border-[#e2e8f0] text-left">
            <DialogTitle className="text-xl font-bold text-[#0f172a]">Edit Profile details</DialogTitle>
            <p className="text-xs text-[#64748b]">Update your personal attributes. Core items like name and date of birth cannot be modified.</p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 pt-4 text-xs">
            {/* Locked Readonly Fields */}
            <div className="grid sm:grid-cols-3 gap-4 bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-xl">
              <div>
                <label className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  value={user?.full_name || ""}
                  disabled
                  className="w-full bg-[#f1f5f9] border border-[#e2e8f0] text-[#64748b] cursor-not-allowed p-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Date of Birth</label>
                <input
                  type="text"
                  value={profileData.date_of_birth}
                  disabled
                  className="w-full bg-[#f1f5f9] border border-[#e2e8f0] text-[#64748b] cursor-not-allowed p-2 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Role</label>
                <input
                  type="text"
                  value={profileData.role}
                  disabled
                  className="w-full bg-[#f1f5f9] border border-[#e2e8f0] text-[#64748b] cursor-not-allowed p-2 rounded-lg"
                />
              </div>
            </div>

            {/* Editable Fields */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Contact Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 99999 99999"
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg focus:outline-none focus:border-[#0f172a]"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Occupation</label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="Software Architect"
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg focus:outline-none focus:border-[#0f172a]"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg focus:outline-none"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Marital Status</label>
                <select
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg focus:outline-none"
                >
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Residential Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Residential Address"
                rows={3}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg focus:outline-none focus:border-[#0f172a] resize-none"
              />
            </div>

            <div>
              <label className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Profile Photo URL</label>
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg focus:outline-none focus:border-[#0f172a]"
              />
            </div>

            {/* Social Links Sub-block */}
            <div className="space-y-3 pt-3 border-t border-[#e2e8f0]">
              <h4 className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider">Social Links</h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">LinkedIn Username</label>
                  <input
                    type="text"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="linkedin-username"
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg focus:outline-none focus:border-[#0f172a]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Instagram Username</label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="instagram-username"
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg focus:outline-none focus:border-[#0f172a]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Facebook Username</label>
                  <input
                    type="text"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="facebook-username"
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg focus:outline-none focus:border-[#0f172a]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Twitter Username</label>
                  <input
                    type="text"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="twitter-username"
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg focus:outline-none focus:border-[#0f172a]"
                  />
                </div>
              </div>
            </div>

            {/* Dialog Footer Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[#e2e8f0]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="border-[#e2e8f0] text-[#0f172a] hover:bg-[#f1f5f9] text-xs font-semibold px-4 h-9 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="bg-[#0f172a] text-white hover:bg-[#1e293b] text-xs font-semibold px-4 h-9 rounded-lg flex items-center gap-1.5"
              >
                {updateProfileMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Save Changes</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
