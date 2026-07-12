import { useState, useEffect } from "react"
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { AdminDashboardStats } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import {
  Users,
  CheckCircle,
  Clock,
  Heart,
  Loader2,
  ArrowRight,
  Shield,
  MapPin,
  Plus,
  Search,
  CreditCard,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

export default function AdminDashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  
  const [activeTab, setActiveTab] = useState<"overview" | "regions">("overview")
  const [regionSearch, setRegionSearch] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newRegion, setNewRegion] = useState({ name: "", pin_code: "", description: "" })
  const [createError, setCreateError] = useState<string | null>(null)

  // 1. Fetch dashboard stats
  const { data: statsData, isLoading: isStatsLoading } = useQuery<AdminDashboardStats>({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const res = await api.get<AdminDashboardStats>("/admin/dashboard")
      return res.data
    },
    refetchInterval: 30000,
  })

  // 2. Fetch regions with infinite scroll
  const {
    data: regionsData,
    fetchNextPage: fetchNextRegions,
    hasNextPage: hasNextRegions,
    isFetchingNextPage: isFetchingNextRegions,
    isLoading: isRegionsLoading
  } = useInfiniteQuery({
    queryKey: ["admin-regions"],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await api.get<any[]>(`/admin/regions?limit=10&offset=${pageParam}`)
      return res.data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length * 10 : undefined
    },
    enabled: activeTab === "regions",
  })

  // IntersectionObserver for regions scrolling
  useEffect(() => {
    if (activeTab !== "regions") return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextRegions && !isFetchingNextRegions) {
          fetchNextRegions()
        }
      },
      { threshold: 0.1 }
    )

    const trigger = document.getElementById("regions-scroll-trigger")
    if (trigger) {
      observer.observe(trigger)
    }

    return () => {
      if (trigger) {
        observer.unobserve(trigger)
      }
    }
  }, [hasNextRegions, isFetchingNextRegions, fetchNextRegions, activeTab])

  // Create region mutation
  const createRegionMutation = useMutation({
    mutationFn: async (payload: typeof newRegion) => {
      const res = await api.post("/admin/regions", payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-regions"] })
      setIsCreateDialogOpen(false)
      setNewRegion({ name: "", pin_code: "", description: "" })
      setCreateError(null)
      toast.success("Region created successfully!")
    },
    onError: (err: any) => {
      setCreateError(err.response?.data?.detail || "Failed to create region.")
    }
  })

  const allRegions = regionsData?.pages.flatMap((page) => page) || []
  const filteredRegions = allRegions.filter((r) =>
    r.name.toLowerCase().includes(regionSearch.toLowerCase()) ||
    r.pin_code.includes(regionSearch)
  )

  const statCards = (stats: AdminDashboardStats) => [
    {
      title: "Total Members",
      value: stats.total_users,
      icon: Users,
      color: "text-[#0f172a]",
      bg: "bg-[#f1f5f9] border-[#e2e8f0]",
      desc: "All registered accounts"
    },
    {
      title: "Verified Members",
      value: stats.verified_users,
      icon: CheckCircle,
      color: "text-[#10b981]",
      bg: "bg-[#10b981]/10 border-[#10b981]/25",
      desc: `${stats.total_users > 0 ? Math.round((stats.verified_users / stats.total_users) * 100) : 0}% of registry`
    },
    {
      title: "Pending Reviews",
      value: stats.pending_verifications,
      icon: Clock,
      color: "text-[#f59e0b]",
      bg: "bg-[#f59e0b]/10 border-[#f59e0b]/25",
      desc: "Awaiting local vouch"
    },
    {
      title: "Matrimony Opt-ins",
      value: stats.matrimony_opt_ins,
      icon: Heart,
      color: "text-rose-500",
      bg: "bg-rose-500/10 border-rose-500/25",
      desc: "Active opted-in profiles"
    },
    {
      title: "Active Memberships",
      value: stats.active_memberships,
      icon: CreditCard,
      color: "text-[#6366f1]",
      bg: "bg-[#6366f1]/10 border-[#6366f1]/25",
      desc: "Members with active subscription"
    }
  ]

  return (
    <div className="space-y-8 animate-fade-in text-[#0f172a]">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">
              Operator Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[#0f172a]/10 text-[#0f172a]">
              <Shield className="h-3.5 w-3.5" /> Operators Tier
            </span>
          </div>
          <p className="text-sm text-[#64748b] mt-1">
            System overview, boundary configurations, and member verification controls.
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-[#e2e8f0] gap-4">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === "overview"
              ? "border-[#0f172a] text-[#0f172a]"
              : "border-transparent text-[#64748b] hover:text-[#0f172a]"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("regions")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === "regions"
              ? "border-[#0f172a] text-[#0f172a]"
              : "border-transparent text-[#64748b] hover:text-[#0f172a]"
          }`}
        >
          Admin Regions
        </button>
      </div>

      {/* Overview Tab Content */}
      {activeTab === "overview" && (
        <>
          {isStatsLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 text-[#0f172a] animate-spin" />
            </div>
          ) : statsData ? (
            <>
              {/* Statistics Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards(statsData).map((card) => (
                  <div
                    key={card.title}
                    className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex justify-between items-start shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider">
                        {card.title}
                      </p>
                      <p className="text-3xl font-extrabold text-[#0f172a]">
                        {card.value.toLocaleString()}
                      </p>
                      <p className="text-xs text-[#64748b]">{card.desc}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${card.bg}`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Operational Sections */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Membership Ratio */}
                <Card className="border border-[#e2e8f0] rounded-2xl shadow-sm bg-white overflow-hidden">
                  <CardHeader className="border-b border-[#e2e8f0] pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#0f172a]" /> Membership Ratio
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    {[
                      { label: "Total Registered", value: statsData.total_users, color: "bg-[#0f172a]" },
                      { label: "Verified Members", value: statsData.verified_users, color: "bg-[#10b981]" },
                      { label: "Unverified / Pending", value: statsData.total_users - statsData.verified_users, color: "bg-[#f59e0b]" }
                    ].map((item) => (
                      <div key={item.label} className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-[#64748b]">{item.label}</span>
                          <span className="text-[#0f172a]">{item.value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#f1f5f9] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.color} transition-all duration-500`}
                            style={{ width: `${statsData.total_users > 0 ? (item.value / statsData.total_users) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Quick Operator Actions */}
                <Card className="border border-[#e2e8f0] rounded-2xl shadow-sm bg-white overflow-hidden">
                  <CardHeader className="border-b border-[#e2e8f0] pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#0f172a]" /> Awaiting Operator Action
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {/* Action Row 1: Verification queue */}
                    <div className="flex items-center justify-between p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0f172a]">Member Verification Queue</p>
                          <p className="text-[10px] text-[#64748b]">{statsData.pending_verifications} profiles awaiting local approval</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="link"
                        className="text-[#0f172a] hover:text-[#64748b] text-xs font-bold p-0 flex items-center gap-1.5"
                        onClick={() => navigate("/admin/verification")}
                      >
                        <span>Manage</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Action Row 2: Matrimony Opt-ins */}
                    <div className="flex items-center justify-between p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                          <Heart className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0f172a]">Matrimonial Matches Registry</p>
                          <p className="text-[10px] text-[#64748b]">{statsData.matrimony_opt_ins} active matrimonial configurations</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="link"
                        className="text-[#0f172a] hover:text-[#64748b] text-xs font-bold p-0 flex items-center gap-1.5"
                        onClick={() => navigate("/admin/matrimony")}
                      >
                        <span>Browse</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Action Row 3: Membership Management */}
                    <div className="flex items-center justify-between p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#6366f1]/10 flex items-center justify-center text-[#6366f1]">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0f172a]">Membership Access Control</p>
                          <p className="text-[10px] text-[#64748b]">{statsData.active_memberships} active subscriptions</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="link"
                        className="text-[#0f172a] hover:text-[#64748b] text-xs font-bold p-0 flex items-center gap-1.5"
                        onClick={() => navigate("/admin/membership")}
                      >
                        <span>Manage</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </>
      )}

      {/* Regions Tab Content */}
      {activeTab === "regions" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
              <Input
                placeholder="Search regions by name or PIN..."
                className="pl-9 bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] focus:border-[#0f172a]"
                value={regionSearch}
                onChange={(e) => setRegionSearch(e.target.value)}
              />
            </div>
            {currentUser?.role === "community_admin" && (
              <Button
                onClick={() => {
                  setIsCreateDialogOpen(true)
                  setCreateError(null)
                }}
                className="bg-[#0f172a] text-white hover:bg-[#1e293b] text-xs font-semibold px-4 h-10 rounded-lg flex items-center gap-1.5 shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Create Region</span>
              </Button>
            )}
          </div>

          {isRegionsLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 text-[#0f172a] animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <Card className="border border-[#e2e8f0] rounded-2xl shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-[#e2e8f0] py-4 bg-[#f8fafc]">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                    {filteredRegions.length} Regions Loaded
                  </CardTitle>
                </CardHeader>
                <div className="divide-y divide-[#e2e8f0]">
                  {filteredRegions.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#64748b]">
                      No administrative regions defined yet.
                    </div>
                  ) : (
                    filteredRegions.map((region: any) => (
                      <div key={region.id} className="flex items-start justify-between gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-xs text-[#0f172a]">{region.name}</h3>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0f172a]/10 text-[#0f172a]">
                              <MapPin className="h-3 w-3" /> PIN: {region.pin_code}
                            </span>
                          </div>
                          {region.description && (
                            <p className="text-xs text-[#64748b] leading-relaxed max-w-xl truncate md:whitespace-normal md:line-clamp-2">
                              {region.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Infinite Scroll Trigger */}
              {hasNextRegions && (
                <div id="regions-scroll-trigger" className="flex justify-center py-4">
                  {isFetchingNextRegions ? (
                    <Loader2 className="h-5 w-5 text-[#0f172a] animate-spin" />
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Scroll to load more</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Region Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-white border border-[#e2e8f0] rounded-2xl max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-wider text-[#0f172a] flex items-center gap-2">
              <Plus className="h-4 w-4" /> Create Admin Region
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748b]">
              Define a new geographical region scoped by a unique PIN code.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            <div className="space-y-1">
              <Label htmlFor="region-name" className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Region Name *</Label>
              <Input
                id="region-name"
                placeholder="e.g. North District"
                value={newRegion.name}
                onChange={(e) => setNewRegion(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg focus:outline-none focus:border-[#0f172a]"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="region-pin" className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">PIN / Zipcode *</Label>
              <Input
                id="region-pin"
                placeholder="e.g. 560001"
                value={newRegion.pin_code}
                onChange={(e) => setNewRegion(prev => ({ ...prev, pin_code: e.target.value }))}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg focus:outline-none focus:border-[#0f172a]"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="region-desc" className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Description</Label>
              <textarea
                id="region-desc"
                placeholder="Brief description of the boundaries..."
                value={newRegion.description}
                onChange={(e) => setNewRegion(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg focus:outline-none focus:border-[#0f172a] min-h-[80px] resize-none"
              />
            </div>

            {createError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-semibold">
                {createError}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              className="border-[#e2e8f0] text-[#0f172a] hover:bg-slate-50 text-xs font-semibold px-4 h-9 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              disabled={createRegionMutation.isPending || !newRegion.name || !newRegion.pin_code}
              onClick={() => createRegionMutation.mutate(newRegion)}
              className="bg-[#0f172a] text-white hover:bg-[#1e293b] text-xs font-semibold px-4 h-9 rounded-lg flex items-center gap-1.5"
            >
              {createRegionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>{createRegionMutation.isPending ? "Creating..." : "Create Region"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
