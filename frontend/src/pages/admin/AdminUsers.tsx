import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
import { Users, Search, Pencil, CheckCircle, XCircle, Loader2, Shield, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

export default function AdminUsers() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  const [search, setSearch] = useState("")
  const [editTarget, setEditTarget] = useState<UserProfile | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null)
  const [editForm, setEditForm] = useState<Partial<UserProfile & { is_active: boolean; role: string }>>({})

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await api.get<UserProfile[]>("/admin/users")
      return res.data
    },
  })

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

  const filtered = users?.filter((u) =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.user?.phone_number?.includes(search) ||
    u.address?.toLowerCase().includes(search.toLowerCase())
  )

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
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Members</h1>
        </div>
        <p className="text-muted-foreground">Manage all registered community members.</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, address..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : (
        <Card className="glass-card overflow-hidden">
          <CardHeader className="border-b border-white/10 py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {filtered?.length || 0} members
            </CardTitle>
          </CardHeader>
          <div className="divide-y divide-white/5">
            {filtered?.map((u) => {
              const initials = u.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"
              return (
                <div key={u.profile_id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/2 transition-colors">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={u.profile_photo_url} />
                    <AvatarFallback className="text-sm gradient-primary text-white">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="font-medium text-sm truncate">{u.full_name}</p>
                      {u.username && (
                        <span className="text-[10px] text-muted-foreground font-mono">@{u.username}</span>
                      )}
                      {u.is_memorial && <Badge variant="outline" className="text-xs">Memorial</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{u.user?.phone_number} • {u.address || "No address"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={roleBadge(u.user?.role || "")} className="hidden sm:flex capitalize text-xs">
                      {u.user?.role?.replace(/_/g, " ")}
                    </Badge>
                    {u.user?.is_active ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400 hidden md:block" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive hidden md:block" />
                    )}
                    {currentUser?.role === "community_admin" && (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {currentUser?.id !== u.user_id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
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
            {filtered?.length === 0 && (
              <div className="py-16 text-center text-muted-foreground">No members found.</div>
            )}
          </div>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Edit Member
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-2">
              <Label>Full Name</Label>
              <Input value={editForm.full_name || ""} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input type="date" value={editForm.date_of_birth || ""} onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={editForm.gender} onValueChange={(v) => setEditForm({ ...editForm, gender: v as typeof editForm.gender })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Marital Status</Label>
              <Select value={editForm.marital_status} onValueChange={(v) => setEditForm({ ...editForm, marital_status: v as typeof editForm.marital_status })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unverified">Unverified</SelectItem>
                  <SelectItem value="verified_adult">Verified Adult</SelectItem>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="local_admin">Local Admin</SelectItem>
                  <SelectItem value="community_admin">Community Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Address</Label>
              <Input value={editForm.address || ""} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Occupation</Label>
              <Input value={editForm.occupation || ""} onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Profile Photo URL</Label>
              <Input value={editForm.profile_photo_url || ""} onChange={(e) => setEditForm({ ...editForm, profile_photo_url: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Account Status</Label>
              <Select value={editForm.is_active ? "true" : "false"} onValueChange={(v) => setEditForm({ ...editForm, is_active: v === "true" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button variant="gradient" onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete User Account
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 text-sm space-y-2">
            <p>
              Are you absolutely sure you want to delete <strong className="text-foreground">{deleteTarget?.full_name}</strong>'s account?
            </p>
            <p className="text-muted-foreground">
              This action is permanent and will delete their profile, matrimony settings, and connection requests. It cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget?.user_id && deleteMutation.mutate(deleteTarget.user_id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
