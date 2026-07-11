import { useState, useEffect } from "react"
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { UserProfile } from "@/types"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Search, Pencil, CheckCircle, XCircle, Loader2, Shield, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

export default function AdminUsers() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [activeFilter, setActiveFilter] = useState("all")
  const [editTarget, setEditTarget] = useState<UserProfile | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null)
  const [editForm, setEditForm] = useState<Partial<UserProfile & { is_active: boolean; role: string }>>({})

  // Determine if active user is an admin
  const isUserAdmin = currentUser?.role === "community_admin" || currentUser?.role === "local_admin"

  // Paginated Infinite Scroll Query - 10 per batch
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ["admin-users"],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await api.get<UserProfile[]>(`/admin/users?limit=10&offset=${pageParam}`)
      return res.data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length * 10 : undefined
    }
  })

  // Set up IntersectionObserver for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    const trigger = document.getElementById("infinite-scroll-trigger")
    if (trigger) {
      observer.observe(trigger)
    }

    return () => {
      if (trigger) {
        observer.unobserve(trigger)
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const updateMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Record<string, unknown> }) => {
      await api.put(`/admin/users/${userId}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      setEditTarget(null)
      toast.success("User profile updated successfully.")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to update user profile.")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/admin/users/${userId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      setDeleteTarget(null)
      toast.success("User account deleted successfully.")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to delete user account.")
    }
  })

  // Flatten paginated pages into single array for filtering
  const allUsers = data?.pages.flatMap((page) => page) || []

  const filtered = allUsers.filter((u) => {
    const fullName = u.full_name || ""
    const phoneNumber = u.user?.phone_number || ""
    const address = u.address || ""
    const matchesSearch =
      fullName.toLowerCase().includes(search.toLowerCase()) ||
      phoneNumber.includes(search) ||
      address.toLowerCase().includes(search.toLowerCase())

    const matchesRole =
      roleFilter === "all" || u.user?.role === roleFilter

    const matchesActive =
      activeFilter === "all" ||
      (activeFilter === "active" && u.user?.is_active) ||
      (activeFilter === "inactive" && !u.user?.is_active)

    return matchesSearch && matchesRole && matchesActive
  })

  const openEdit = (u: UserProfile) => {
    setEditTarget(u)
    setEditForm({
      full_name: u.full_name,
      date_of_birth: u.date_of_birth,
      gender: u.gender,
      marital_status: u.marital_status,
      address: u.address || "",
      occupation: u.occupation || "",
      profile_photo_url: u.profile_photo_url || "",
      is_active: u.user?.is_active ?? true,
      role: u.user?.role || "unverified",
    })
  }

  const handleSave = () => {
    if (!editTarget?.user_id) return
    updateMutation.mutate({ userId: editTarget.user_id, data: editForm })
  }

  const roleBadge = (role: string) => {
    const map: Record<string, "default" | "success" | "info" | "warning" | "destructive"> = {
      community_admin: "default",
      local_admin: "info",
      verified_adult: "success",
      minor: "info",
      unverified: "warning",
    }
    return map[role] || "outline"
  }

  return (
    <div className="space-y-8 animate-fade-in text-[#0f172a]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">
              Registry Directory
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[#0f172a]/10 text-[#0f172a]">
              <Shield className="h-3.5 w-3.5" /> Registry Controls
            </span>
          </div>
          <p className="text-sm text-[#64748b] mt-1">
            Manage and edit all registered community members.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
          <Input
            placeholder="Search by name, phone, address..."
            className="pl-9 bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] focus:border-[#0f172a]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-xs font-semibold p-2 text-[#0f172a] focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="unverified">Unverified</option>
            <option value="verified_adult">Verified Adult</option>
            <option value="minor">Minor</option>
            <option value="local_admin">Local Admin</option>
            <option value="community_admin">Community Admin</option>
          </select>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-xs font-semibold p-2 text-[#0f172a] focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-[#0f172a] animate-spin" />
        </div>
      ) : (
        <Card className="border border-[#e2e8f0] rounded-2xl shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-[#e2e8f0] py-4 bg-[#f8fafc]">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
              {filtered.length} members loaded
            </CardTitle>
          </CardHeader>
          <div className="divide-y divide-[#e2e8f0]">
            {filtered.map((u) => {
              const initials = u.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"
              return (
                <div key={u.profile_id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 shrink-0 border border-[#e2e8f0]">
                      <AvatarImage src={u.profile_photo_url} />
                      <AvatarFallback className="text-sm bg-[#f1f5f9] text-[#0f172a] font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="font-bold text-xs text-[#0f172a] truncate">{u.full_name}</p>
                        {u.username && (
                          <span className="text-[10px] text-[#64748b] font-mono">@{u.username}</span>
                        )}
                        {u.is_memorial && (
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-rose-500/10 text-rose-500">
                            Memorial
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#64748b]">
                        {u.contact_number || u.user?.phone_number || "No contact"} • {u.address || "No address"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge variant={roleBadge(u.user?.role || "")} className="hidden sm:inline-flex capitalize text-[10px] font-bold px-2 py-0.5">
                      {u.user?.role?.replace(/_/g, " ")}
                    </Badge>
                    {u.user?.is_active ? (
                      <CheckCircle className="h-4 w-4 text-[#10b981] hidden md:block" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-500 hidden md:block" />
                    )}

                    {/* Both local_admin and community_admin can perform operational edits */}
                    {isUserAdmin && (
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#64748b] hover:text-[#0f172a]"
                          onClick={() => openEdit(u)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {currentUser?.id !== u.user_id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[#64748b] hover:text-rose-500"
                            onClick={() => setDeleteTarget(u)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            
            {filtered.length === 0 && (
              <div className="py-16 text-center text-xs text-[#64748b]">No members found.</div>
            )}

            {/* Infinite Scroll Trigger Block */}
            <div
              id="infinite-scroll-trigger"
              className="h-12 flex items-center justify-center text-xs text-[#64748b] bg-[#f8fafc] border-t border-[#e2e8f0] py-6"
            >
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#0f172a]" />
                  <span>Loading next batch...</span>
                </div>
              ) : hasNextPage ? (
                <span>Scroll to load more</span>
              ) : (
                <span>All members loaded</span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border border-[#e2e8f0] bg-white p-8 rounded-2xl text-[#0f172a]">
          <DialogHeader className="pb-4 border-b border-[#e2e8f0]">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-[#0f172a]">
              <Shield className="h-5 w-5 text-[#0f172a]" /> Edit Member Details
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4 text-xs">
            <div className="col-span-2 space-y-1">
              <Label className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Full Name</Label>
              <Input
                value={editForm.full_name || ""}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg focus:outline-none focus:border-[#0f172a]"
              />
            </div>
            <div className="space-y-1">
              <Label className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Date of Birth</Label>
              <Input
                type="date"
                value={editForm.date_of_birth || ""}
                onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg focus:outline-none focus:border-[#0f172a]"
              />
            </div>
            <div className="space-y-1">
              <Label className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Gender</Label>
              <Select value={editForm.gender} onValueChange={(v) => setEditForm({ ...editForm, gender: v as typeof editForm.gender })}>
                <SelectTrigger className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a]"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white text-[#0f172a] border border-[#e2e8f0]">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Marital Status</Label>
              <Select value={editForm.marital_status} onValueChange={(v) => setEditForm({ ...editForm, marital_status: v as typeof editForm.marital_status })}>
                <SelectTrigger className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a]"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white text-[#0f172a] border border-[#e2e8f0]">
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Role</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a]"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white text-[#0f172a] border border-[#e2e8f0]">
                  <SelectItem value="unverified">Unverified</SelectItem>
                  <SelectItem value="verified_adult">Verified Adult</SelectItem>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="local_admin">Local Admin</SelectItem>
                  <SelectItem value="community_admin">Community Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Address</Label>
              <Input
                value={editForm.address || ""}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg focus:outline-none focus:border-[#0f172a]"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Occupation</Label>
              <Input
                value={editForm.occupation || ""}
                onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg focus:outline-none focus:border-[#0f172a]"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Profile Photo URL</Label>
              <Input
                value={editForm.profile_photo_url || ""}
                onChange={(e) => setEditForm({ ...editForm, profile_photo_url: e.target.value })}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg focus:outline-none focus:border-[#0f172a]"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Account Status</Label>
              <Select value={editForm.is_active ? "true" : "false"} onValueChange={(v) => setEditForm({ ...editForm, is_active: v === "true" })}>
                <SelectTrigger className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a]"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white text-[#0f172a] border border-[#e2e8f0]">
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t border-[#e2e8f0]">
            <Button
              variant="outline"
              onClick={() => setEditTarget(null)}
              className="border-[#e2e8f0] text-[#0f172a] hover:bg-[#f1f5f9] text-xs font-semibold px-4 h-9 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="bg-[#0f172a] text-white hover:bg-[#1e293b] text-xs font-semibold px-4 h-9 rounded-lg flex items-center gap-1.5"
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>Save Changes</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md bg-white border border-[#e2e8f0] p-8 rounded-2xl text-[#0f172a]">
          <DialogHeader className="pb-4 border-b border-[#e2e8f0]">
            <DialogTitle className="text-rose-500 flex items-center gap-2 font-bold text-lg">
              <Trash2 className="h-5 w-5" /> Delete User Account
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-xs space-y-2">
            <p className="text-sm">
              Are you absolutely sure you want to delete <strong className="text-[#0f172a]">{deleteTarget?.full_name}</strong>'s account?
            </p>
            <p className="text-[#64748b] leading-relaxed">
              This action is permanent and will delete their profile, matrimony settings, and connection requests. It cannot be undone.
            </p>
          </div>
          <DialogFooter className="pt-4 border-t border-[#e2e8f0]">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="border-[#e2e8f0] text-[#0f172a] hover:bg-[#f1f5f9] text-xs font-semibold px-4 h-9 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteTarget?.user_id && deleteMutation.mutate(deleteTarget.user_id)}
              disabled={deleteMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 h-9 rounded-lg flex items-center gap-1.5"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>Delete Account</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
