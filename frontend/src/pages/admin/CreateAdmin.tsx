import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { handleApiError } from "@/lib/utils"
import { UserPlus, Loader2, CheckCircle, AlertCircle } from "lucide-react"

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
  const [form, setForm] = useState<AdminForm>({
    phone_number: "",
    email: "",
    password: "",
    full_name: "",
    address: "",
    role: "local_admin",
    region_id: "",
  })
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
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <UserPlus className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Create Administrator</h1>
        </div>
        <p className="text-muted-foreground">
          Add a new local or community administrator to the platform.
        </p>
      </div>

      <div className="max-w-xl">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" /> New Admin Account
            </CardTitle>
            <CardDescription>
              All fields marked * are required. Admins are automatically verified.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="admin-name">Full Name *</Label>
                <Input
                  id="admin-name"
                  placeholder="Admin Full Name"
                  value={form.full_name}
                  onChange={(e) => set("full_name")(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-phone">Phone Number *</Label>
                <Input
                  id="admin-phone"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={form.phone_number}
                  onChange={(e) => set("phone_number")(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@email.com"
                  value={form.email}
                  onChange={(e) => set("email")(e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="admin-password">Password *</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Secure password"
                  value={form.password}
                  onChange={(e) => set("password")(e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="admin-address">Address</Label>
                <Input
                  id="admin-address"
                  placeholder="City, State"
                  value={form.address}
                  onChange={(e) => set("address")(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Admin Role *</Label>
                <Select value={form.role} onValueChange={set("role")}>
                  <SelectTrigger id="admin-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local_admin">Local Admin</SelectItem>
                    <SelectItem value="community_admin">Community Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.role === "local_admin" && (
                <div className="space-y-2">
                  <Label htmlFor="region-id">Region ID</Label>
                  <Input
                    id="region-id"
                    placeholder="UUID of region"
                    value={form.region_id}
                    onChange={(e) => set("region_id")(e.target.value)}
                  />
                </div>
              )}
            </div>

            {success && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                {success}
              </div>
            )}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <Button
              variant="gradient"
              className="w-full gap-2"
              disabled={mutation.isPending || !form.phone_number || !form.password || !form.full_name}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {mutation.isPending ? "Creating..." : "Create Administrator"}
            </Button>
          </CardContent>
        </Card>

        {/* Info box */}
        <div className="mt-6 p-4 rounded-xl glass border border-amber-500/20 text-sm text-amber-400">
          <p className="font-semibold mb-1">⚠️ Important</p>
          <p className="text-amber-400/80">
            Administrator accounts are immediately active and verified. Share credentials securely with the new admin.
            Community Admins have full platform access; Local Admins are scoped to their assigned regions.
          </p>
        </div>
      </div>
    </div>
  )
}
