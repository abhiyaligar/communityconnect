import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  User, Phone, MapPin, Briefcase, Calendar,
  Users, ShieldCheck, Clock
} from "lucide-react"

export default function Profile() {
  const { user } = useAuth()

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?"

  const roleColors: Record<string, string> = {
    verified_adult: "success",
    minor: "info",
    community_admin: "default",
    local_admin: "default",
    unverified: "warning",
  }

  const age = user?.date_of_birth
    ? Math.floor((Date.now() - new Date(user.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="relative glass-card rounded-3xl overflow-hidden mb-8">
          {/* Banner */}
          <div className="h-32 gradient-primary opacity-20" />
          <div className="absolute inset-0 h-32 gradient-primary opacity-10" />

          <div className="px-8 pb-8">
            <div className="flex items-end gap-6 -mt-10 mb-6">
              <Avatar className="h-20 w-20 border-4 border-card ring-2 ring-primary/30">
                <AvatarImage src={user?.profile_photo_url} />
                <AvatarFallback className="text-2xl font-bold gradient-primary text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="pb-2">
                <h1 className="text-2xl font-bold">{user?.full_name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={(roleColors[user?.role || ""] || "outline") as "success" | "info" | "default" | "warning" | "outline"}>
                    {user?.role === "verified_adult" && <ShieldCheck className="h-3 w-3 mr-1" />}
                    {user?.role === "unverified" && <Clock className="h-3 w-3 mr-1" />}
                    <span className="capitalize">{user?.role?.replace(/_/g, " ")}</span>
                  </Badge>
                  {user?.gender && (
                    <Badge variant="outline" className="capitalize">{user.gender}</Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator className="mb-6" />

            {/* Info Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Phone, label: "Phone Number", value: user?.contact_number },
                { icon: Calendar, label: "Date of Birth", value: user?.date_of_birth ? `${new Date(user.date_of_birth).toLocaleDateString()} (${age} yrs)` : "—" },
                { icon: MapPin, label: "Address", value: user?.address || "Not provided" },
                { icon: Briefcase, label: "Occupation", value: user?.occupation || "Not provided" },
                { icon: Users, label: "Marital Status", value: user?.marital_status ? user.marital_status.charAt(0).toUpperCase() + user.marital_status.slice(1) : "—" },
                { icon: User, label: "Gender", value: user?.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : "—" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3 p-4 rounded-xl bg-muted/30 border border-white/5">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                    <p className="text-sm font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Account Info */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Account Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Member ID</span>
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  {user ? "CC-" + user.contact_number?.slice(-4) : "—"}
                </code>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Account Role</span>
                <Badge variant={(roleColors[user?.role || ""] || "outline") as "success" | "info" | "default" | "warning" | "outline"} className="capitalize">
                  {user?.role?.replace(/_/g, " ")}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Verification</span>
                <span className="text-sm font-medium">
                  {user?.role === "unverified" ? (
                    <span className="text-amber-400">Pending review</span>
                  ) : (
                    <span className="text-emerald-400">Verified ✓</span>
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
