import { useState, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { handleApiError } from "@/lib/utils"
import { UserPlus, Loader2, CheckCircle, AlertCircle, Shield } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface AdminForm {
  phone_number: string
  email: string
  password: string
  full_name: string
  address: string
  role: string
  region_id: string
}

export default function CreateAdmin() {
  const { user: currentUser } = useAuth()
  const [form, setForm] = useState<AdminForm>({
    phone_number: "",
    email: "",
    password: "",
    full_name: "",
    address: "",
    role: "local_admin",
    region_id: "",
  })

  // Enforce local_admin role if creator is a local_admin
  useEffect(() => {
    if (currentUser?.role === "local_admin") {
      setForm((f) => ({ ...f, role: "local_admin" }))
    }
  }, [currentUser])
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const set = (field: keyof AdminForm) => (val: string) =>
    setForm((f) => ({ ...f, [field]: val }))

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        phone_number: form.phone_number,
        email: form.email || undefined,
        password: form.password,
        full_name: form.full_name,
        address: form.address || undefined,
        role: form.role,
      }
      if (form.role === "local_admin" && form.region_id) {
        payload.region_id = form.region_id
      }
      const res = await api.post("/admin/create-admin", payload)
      return res.data
    },
    onSuccess: (data) => {
      setSuccess(`Admin created successfully. User ID: ${data.user_id}`)
      setError(null)
      setForm({ phone_number: "", email: "", password: "", full_name: "", address: "", role: "local_admin", region_id: "" })
    },
    onError: (err: unknown) => {
      setError(handleApiError(err, "Failed to create admin."))
      setSuccess(null)
    },
  })

  return (
    <div className="space-y-8 animate-fade-in text-[#0f172a]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">
              Create Administrator
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[#0f172a]/10 text-[#0f172a]">
              <Shield className="h-3.5 w-3.5" /> Core Ops
            </span>
          </div>
          <p className="text-sm text-[#64748b] mt-1">
            Add a new local or community administrator account to the platform.
          </p>
        </div>
      </div>

      <div className="max-w-xl">
        <Card className="border border-[#e2e8f0] rounded-2xl shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-[#e2e8f0] py-5 bg-[#f8fafc]">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-[#0f172a]" /> New Admin Account
            </CardTitle>
            <CardDescription className="text-xs text-[#64748b]">
              All fields marked * are required. Admin profiles are automatically active and verified.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label htmlFor="admin-name" className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Full Name *</Label>
                <Input
                  id="admin-name"
                  placeholder="Admin Full Name"
                  value={form.full_name}
                  onChange={(e) => set("full_name")(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg focus:outline-none focus:border-[#0f172a]"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="admin-phone" className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Phone Number *</Label>
                <Input
                  id="admin-phone"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={form.phone_number}
                  onChange={(e) => set("phone_number")(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg focus:outline-none focus:border-[#0f172a]"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="admin-email" className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Email Address</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@email.com"
                  value={form.email}
                  onChange={(e) => set("email")(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg focus:outline-none focus:border-[#0f172a]"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="admin-password" className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Password *</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Secure password"
                  value={form.password}
                  onChange={(e) => set("password")(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg focus:outline-none focus:border-[#0f172a]"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="admin-address" className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Address</Label>
                <Input
                  id="admin-address"
                  placeholder="City, State, India"
                  value={form.address}
                  onChange={(e) => set("address")(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg focus:outline-none focus:border-[#0f172a]"
                />
              </div>
              <div className="space-y-1">
                <Label className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Admin Role *</Label>
                <Select value={form.role} onValueChange={set("role")} disabled={currentUser?.role === "local_admin"}>
                  <SelectTrigger id="admin-role" className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[#e2e8f0]">
                    <SelectItem value="local_admin">Local Admin</SelectItem>
                    {currentUser?.role === "community_admin" && (
                      <SelectItem value="community_admin">Community Admin</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {form.role === "local_admin" && (
                <div className="space-y-1">
                  <Label htmlFor="region-id" className="block text-[9px] uppercase font-bold text-[#64748b] tracking-wider mb-1">Region ID</Label>
                  <Input
                    id="region-id"
                    placeholder="UUID of region"
                    value={form.region_id}
                    onChange={(e) => set("region_id")(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg focus:outline-none focus:border-[#0f172a]"
                  />
                </div>
              )}
            </div>

            {success && (
              <div className="flex items-start gap-2.5 p-4 rounded-xl bg-[#10b981]/10 border border-[#10b981]/25 text-[#10b981] text-xs">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}
            {error && (
              <div className="flex items-start gap-2.5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              disabled={mutation.isPending || !form.phone_number || !form.password || !form.full_name}
              onClick={() => mutation.mutate()}
              className="w-full bg-[#0f172a] text-white hover:bg-[#1e293b] text-xs font-semibold px-4 h-10 rounded-lg flex items-center justify-center gap-1.5"
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              <span>{mutation.isPending ? "Creating..." : "Create Administrator"}</span>
            </Button>
          </CardContent>
        </Card>

        {/* Info box */}
        <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 leading-relaxed">
          <p className="font-bold text-amber-800 mb-1 flex items-center gap-1.5">
            ⚠️ Operational Notice
          </p>
          <p>
            Administrator accounts are immediately active and verified. Please share credentials securely with the new operator.
            Community Admins have platform-wide access, while Local Admins are scoped to their assigned regional divisions.
          </p>
        </div>
      </div>
    </div>
  )
}
