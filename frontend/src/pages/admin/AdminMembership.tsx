import { useState, useEffect, useCallback, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Search, Shield, Loader2, Pencil, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

interface MembershipInfo {
  has_membership: boolean
  status: string | null
  start_date: string | null
  end_date: string | null
}

interface MembershipUser {
  user_id: string
  full_name: string
  username: string | null
  profile_photo_url: string | null
  role: string
  membership: MembershipInfo | null
}

export default function AdminMembership() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [editTarget, setEditTarget] = useState<MembershipUser | null>(null)
  const [editForm, setEditForm] = useState({
    start_date: "",
    end_date: "",
    status: "active",
  })
  const [offset, setOffset] = useState(0)
  const [allUsers, setAllUsers] = useState<MembershipUser[]>([])
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setOffset(0)
    setAllUsers([])
  }, [debouncedSearch])

  const { isFetching, isFetchingNextPage, fetchNextPage, hasNextPage } = useQuery({
    queryKey: ["admin-membership", debouncedSearch, offset],
    queryFn: async () => {
      const params: Record<string, string | number> = { limit: 20, offset }
      if (debouncedSearch) params.search = debouncedSearch
      const res = await api.get<MembershipUser[]>("/membership/admin/list", { params })
      return res.data
    },
    enabled: true,
  })

  useEffect(() => {
    const qc = queryClient.getQueryCache()
    const query = qc.find({ queryKey: ["admin-membership", debouncedSearch, offset] })
    const data = query?.state?.data as MembershipUser[] | undefined
    if (data) {
      if (offset === 0) {
        setAllUsers(data)
      } else {
        setAllUsers((prev) => {
          const existing = new Set(prev.map((u) => u.user_id))
          const newOnes = data.filter((u) => !existing.has(u.user_id))
          return [...prev, ...newOnes]
        })
      }
    }
  }, [queryClient, debouncedSearch, offset])

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        setOffset((prev) => prev + 20)
      }
    },
    [hasNextPage, isFetchingNextPage]
  )

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 })
    const el = loaderRef.current
    if (el) observer.observe(el)
    return () => { if (el) observer.unobserve(el) }
  }, [handleObserver])

  const updateMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Record<string, unknown> }) => {
      await api.put(`/membership/update?user_id=${userId}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-membership"] })
      setEditTarget(null)
      toast.success("Membership updated successfully.")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to update membership.")
    }
  })

  const openEdit = (u: MembershipUser) => {
    setEditTarget(u)
    setEditForm({
      start_date: u.membership?.start_date || "",
      end_date: u.membership?.end_date || "",
      status: u.membership?.status || "active",
    })
  }

  const handleSave = () => {
    if (!editTarget) return
    const data: Record<string, unknown> = {}
    if (editForm.start_date) data.start_date = editForm.start_date
    if (editForm.end_date) data.end_date = editForm.end_date
    data.status = editForm.status
    updateMutation.mutate({ userId: editTarget.user_id, data })
  }

  const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"

  return (
    <div className="space-y-8 animate-fade-in text-[#0f172a]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">
              Membership Management
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[#0f172a]/10 text-[#0f172a]">
              <Shield className="h-3.5 w-3.5" /> Access Control
            </span>
          </div>
          <p className="text-sm text-[#64748b] mt-1">
            Manage member subscription validity and activation status.
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
        <Input
          placeholder="Search by name or username..."
          className="pl-9 bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] focus:border-[#0f172a]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="border border-[#e2e8f0] rounded-2xl shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-[#e2e8f0] py-4 bg-[#f8fafc]">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
            {allUsers.length} members
          </CardTitle>
        </CardHeader>
        <div className="divide-y divide-[#e2e8f0]">
          {allUsers.map((u) => (
            <div key={u.user_id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10 shrink-0 border border-[#e2e8f0]">
                  <AvatarImage src={u.profile_photo_url || undefined} />
                  <AvatarFallback className="text-sm bg-[#f1f5f9] text-[#0f172a] font-bold">{initials(u.full_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-bold text-xs text-[#0f172a] truncate">{u.full_name}</p>
                    {u.username && (
                      <span className="text-[10px] text-[#64748b] font-mono">@{u.username}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[#64748b]">
                    {u.membership?.has_membership ? (
                      <>
                        <span className={`font-bold ${u.membership.status === "active" ? "text-[#10b981]" : "text-rose-500"}`}>
                          {u.membership.status === "active" ? "Active" : "Inactive"}
                        </span>
                        <span>{u.membership.start_date} — {u.membership.end_date}</span>
                      </>
                    ) : (
                      <span className="text-[#94a3b8]">No membership</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {u.membership?.has_membership ? (
                  u.membership.status === "active"
                    ? <CheckCircle className="h-4 w-4 text-[#10b981]" />
                    : <XCircle className="h-4 w-4 text-rose-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-[#94a3b8]" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-[#64748b] hover:text-[#0f172a]"
                  onClick={() => openEdit(u)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {allUsers.length === 0 && !isFetching && (
            <div className="py-16 text-center text-xs text-[#64748b]">No members found.</div>
          )}

          <div
            ref={loaderRef}
            className="h-12 flex items-center justify-center text-xs text-[#64748b] bg-[#f8fafc] border-t border-[#e2e8f0] py-6"
          >
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : hasNextPage ? (
              <span>Scroll to load more</span>
            ) : (
              <span>All members loaded</span>
            )}
          </div>
        </div>
      </Card>

      {/* Edit Membership Dialog */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="max-w-lg bg-white border border-[#e2e8f0] p-8 rounded-2xl text-[#0f172a]">
          <DialogHeader className="pb-4 border-b border-[#e2e8f0]">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-[#0f172a]">
              <Shield className="h-5 w-5" /> Edit Membership
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4 text-xs">
            <p className="text-sm font-semibold text-[#0f172a]">{editTarget?.full_name}</p>
            <div className="space-y-1">
              <Label className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Start Date</Label>
              <Input
                type="date"
                value={editForm.start_date}
                onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <Label className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">End Date</Label>
              <Input
                type="date"
                value={editForm.end_date}
                onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <Label className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Status</Label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-xs font-semibold p-2.5 text-[#0f172a] focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
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
    </div>
  )
}