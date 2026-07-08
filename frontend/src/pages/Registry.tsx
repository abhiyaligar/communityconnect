import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useNavigate } from "react-router-dom"
import {
  Search,
  Filter,
  Download,
  Plus,
  CheckCircle,
  Clock,
  BookOpen,
  Lock,
  ArrowRight,
  Loader2,
  HeartHandshake
} from "lucide-react"

interface RegistryProfile {
  profile_id: string
  full_name: string
  username?: string
  role: string
  status: string
  id_label: string
  photo_url: string
  location?: string
  contact?: string
  contact_locked?: boolean
  dependents?: Array<{ name: string; photo: string }>
  dependents_overflow?: number
  profession?: string
  address?: string
  address_locked?: boolean
  region?: string
  show_connect?: boolean
  quote?: string
  is_deceased?: boolean
}

export default function Registry() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [regionFilter, setRegionFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  // Fetch actual database users
  const { data: dbData, isLoading, error } = useQuery<any[]>({
    queryKey: ["registry-db-users"],
    queryFn: async () => {
      // Admins get list of all users, normal users get Matrimony Matches (their only listing endpoint)
      const url = isAdmin ? "/admin/users" : "/matrimony/matches"
      const res = await api.get(url)
      return res.data
    },
    retry: false
  })

  // Format database records into registry cards
  const allProfiles: RegistryProfile[] = (dbData || []).map((item) => {
    // If standard user: item represents a MatrimonyProfile
    if (item.profile) {
      const u = item.profile
      return {
        profile_id: item.profile_id,
        full_name: u.full_name,
        username: u.username,
        role: "verified_adult",
        status: "verified",
        id_label: `Member • ID: #${item.profile_id.slice(0, 4).toUpperCase()}`,
        photo_url: u.profile_photo_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde",
        location: u.address || "Not set",
        contact: u.contact_number || "Masked",
        contact_locked: !u.contact_number,
        dependents: [],
        dependents_overflow: 0,
        profession: u.occupation,
        region: u.address?.includes("North") ? "North District" : "South District",
        is_deceased: false,
        show_connect: item.connection_status === "none"
      }
    }

    // If admin: item represents a UserProfile
    const roleStr = item.user?.role || "unverified"
    const status = item.is_memorial
      ? "memorial"
      : roleStr === "unverified"
      ? "pending"
      : "verified"

    return {
      profile_id: item.profile_id,
      full_name: item.full_name,
      username: item.username,
      role: roleStr,
      status,
      id_label: item.is_memorial
        ? "Deceased Member"
        : `${roleStr.replace(/_/g, " ")} • ID: #${item.profile_id.slice(0, 4).toUpperCase()}`,
      photo_url: item.profile_photo_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde",
      location: item.address || "Not set",
      contact: item.contact_number || "Masked",
      contact_locked: !isAdmin,
      dependents: [],
      dependents_overflow: 0,
      profession: item.occupation,
      region: item.address?.includes("North") ? "North District" : "South District",
      is_deceased: item.is_memorial
    }
  })

  // Apply filters
  const filteredProfiles = allProfiles.filter((p) => {
    const matchesSearch =
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id_label.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === "all" || p.status === statusFilter

    const matchesRegion =
      regionFilter === "all" || p.region === regionFilter

    return matchesSearch && matchesStatus && matchesRegion
  })

  const isForbiddenError = error && (error as any).response?.status === 403

  return (
    <div className="space-y-8 animate-fade-in text-[#0f172a]">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">
            Community Registry
          </h1>
          <p className="text-sm text-[#64748b] mt-1 max-w-2xl">
            Browse verified family units and individual members. Sensitive contact information is securely masked based on your access tier.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-[#e2e8f0] text-foreground hover:bg-muted gap-2 text-xs font-semibold px-4 py-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button className="bg-[#0f172a] text-white hover:bg-[#1e293b] gap-2 text-xs font-semibold px-4 py-2">
            <Plus className="h-4 w-4" />
            <span>Add Record</span>
          </Button>
        </div>
      </div>

      {isForbiddenError ? (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-8 max-w-xl mx-auto text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#10b981]/10 text-[#10b981] flex items-center justify-center mx-auto">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-lg text-[#0f172a]">Matrimony Access Required</h3>
          <p className="text-xs text-[#64748b] leading-relaxed">
            To view and search verified community registry listings, you must either opt-in to Matrimony or be registered as a family guardian.
          </p>
          <div className="pt-2">
            <Button
              className="bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-bold px-5 py-2.5 rounded-lg"
              onClick={() => navigate("/profile")}
            >
              Configure Access in Profile
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Filter and Search Bar */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by name or family ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:border-[#0f172a]"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
              </div>

              {/* Quick Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-[#64748b]">Status:</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-xs font-semibold p-2 text-[#0f172a] focus:outline-none"
                  >
                    <option value="all">All</option>
                    <option value="verified">Verified</option>
                    {isAdmin && <option value="pending">Pending Review</option>}
                    {isAdmin && <option value="memorial">Memorial Record</option>}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-[#64748b]">Region:</label>
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-xs font-semibold p-2 text-[#0f172a] focus:outline-none"
                  >
                    <option value="all">All</option>
                    <option value="North District">North District</option>
                    <option value="South District">South District</option>
                  </select>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="border-[#e2e8f0] text-xs font-semibold text-foreground hover:bg-muted gap-1.5"
                >
                  <Filter className="h-3.5 w-3.5" />
                  <span>More Filters</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Grid List */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 text-[#0f172a] animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProfiles.map((profile) => (
                <div
                  key={profile.profile_id}
                  className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  {/* Badge Area */}
                  <div className="absolute top-6 right-6">
                    {profile.status === "verified" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[#10b981]/10 text-[#10b981]">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    )}
                    {profile.status === "pending" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[#f59e0b]/10 text-[#f59e0b]">
                        <Clock className="h-3.5 w-3.5" />
                        Pending Review
                      </span>
                    )}
                    {profile.status === "memorial" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[#64748b]/10 text-[#64748b]">
                        <BookOpen className="h-3.5 w-3.5" />
                        Memorial Record
                      </span>
                    )}
                  </div>

                  {/* Profile Main Info */}
                  <div className="flex gap-4 items-start mb-6">
                    <Avatar className="h-14 w-14 border-2 border-white shadow-md shrink-0">
                      <AvatarImage src={profile.photo_url} />
                      <AvatarFallback className="bg-[#f1f5f9] text-[#0f172a] font-bold">
                        {profile.full_name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="font-bold text-[#0f172a] text-lg leading-tight">
                        {profile.full_name}
                      </h3>
                      <p className="text-xs text-[#64748b] font-medium">
                        {profile.id_label}
                      </p>
                    </div>
                  </div>

                  {/* Specific Content Blocks */}
                  <div className="flex-1">
                    {profile.status === "verified" && (
                      <div className="space-y-4">
                        {/* Location and Contact */}
                        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3.5 grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider mb-1">
                              Location
                            </p>
                            <p className="font-semibold text-[#0f172a] leading-tight">
                              {profile.location}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider mb-1 flex items-center gap-1">
                              <span>Contact</span>
                              {profile.contact_locked && <Lock className="h-3 w-3 text-[#64748b]" />}
                            </p>
                            <p className="font-semibold text-[#64748b]/80">
                              {profile.contact}
                            </p>
                          </div>
                        </div>

                        {/* Linked Dependents */}
                        {profile.dependents && profile.dependents.length > 0 && (
                          <div className="pt-2 border-t border-[#e2e8f0]">
                            <p className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider mb-2">
                              Linked Dependents ({(profile.dependents?.length || 0) + (profile.dependents_overflow || 0)})
                            </p>
                            <div className="flex items-center -space-x-2">
                              {profile.dependents.map((dep, index) => (
                                <Avatar key={index} className="h-7 w-7 border-2 border-white shadow-sm">
                                  <AvatarImage src={dep.photo} />
                                  <AvatarFallback className="text-[9px] bg-muted font-bold">DEP</AvatarFallback>
                                </Avatar>
                              ))}
                              {profile.dependents_overflow && profile.dependents_overflow > 0 ? (
                                <div className="h-7 w-7 rounded-full bg-[#f1f5f9] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#64748b] shadow-sm">
                                  +{profile.dependents_overflow}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {profile.status === "pending" && (
                      <div className="space-y-4">
                        {/* Profession & Address */}
                        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3.5 grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider mb-1">
                              Profession
                            </p>
                            <p className="font-semibold text-[#0f172a] leading-tight">
                              {profile.profession || "Not specified"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider mb-1 flex items-center gap-1">
                              <span>Address</span>
                              {profile.address_locked && <Lock className="h-3 w-3 text-[#64748b]" />}
                            </p>
                            <p className="font-semibold text-[#64748b]/80">
                              {profile.address}
                            </p>
                          </div>
                        </div>

                        {profile.show_connect && (
                          <Button
                            variant="outline"
                            className="w-full border-[#e2e8f0] text-foreground hover:bg-muted text-xs font-semibold py-2.5 rounded-lg"
                          >
                            Request Connection
                          </Button>
                        )}
                      </div>
                    )}

                    {profile.status === "memorial" && (
                      <div className="space-y-4">
                        {/* Tribute Quote Block */}
                        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 text-xs italic text-[#64748b] leading-relaxed relative">
                          "{profile.quote || "A respected member of our community, deeply missed by family and friends."}"
                        </div>

                        <div className="flex justify-start">
                          <Button
                            variant="link"
                            className="text-foreground hover:text-rose-500 font-bold text-xs p-0 flex items-center gap-1.5"
                          >
                            <span>View Full Tribute</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {filteredProfiles.length === 0 && (
                <div className="col-span-full py-16 text-center text-[#64748b]">
                  No community members found matching your search.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
