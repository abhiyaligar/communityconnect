import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import {
  User, Heart, Users, CheckCircle, Clock,
  MapPin, Phone, Briefcase, ArrowRight, Sparkles
} from "lucide-react"

const quickLinks = [
  { to: "/profile", icon: User, label: "View Profile", desc: "Manage your personal info", color: "text-foreground", bg: "bg-secondary border-border", requireOptIn: false },
  { to: "/matrimony", icon: Heart, label: "Matrimony", desc: "Browse eligible matches", color: "text-foreground", bg: "bg-secondary border-border", requireOptIn: true },
  { to: "/matrimony/edit", icon: User, label: "Edit Matrimony", desc: "Update matrimony details", color: "text-foreground", bg: "bg-secondary border-border", requireOptIn: false },
]

export default function Dashboard() {
  const { user } = useAuth()

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?"

  const roleLabel: Record<string, string> = {
    verified_adult: "Verified Adult",
    minor: "Minor",
    unverified: "Unverified",
  }

  const roleBadgeVariant = user?.role === "verified_adult" ? "success" : user?.role === "minor" ? "info" : "warning"

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Hero Welcome */}
        <div className="relative border border-border bg-secondary/50 rounded-2xl p-6 mb-8 overflow-hidden">
          <div className="relative flex items-center gap-5">
            <Avatar className="h-14 w-14 border border-border">
              <AvatarImage src={user?.profile_photo_url} />
              <AvatarFallback className="text-lg font-bold bg-muted text-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <h1 className="text-xl font-bold tracking-tight">Welcome back, {user?.full_name?.split(" ")[0]}!</h1>
                <Sparkles className="h-4.5 w-4.5 text-foreground" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={roleBadgeVariant === "success" ? "default" : "secondary"}>
                  {user?.role === "verified_adult" ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <Clock className="h-3 w-3 mr-1" />
                  )}
                  {roleLabel[user?.role || ""] || user?.role}
                </Badge>
                {user?.gender && (
                  <Badge variant="outline" className="capitalize text-xs font-normal">{user.gender}</Badge>
                )}
                {user?.marital_status && (
                  <Badge variant="outline" className="capitalize text-xs font-normal">{user.marital_status.replace(/_/g, " ")}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Summary */}
          <div className="md:col-span-2">
            <Card className="border border-border shadow-none h-full bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  <User className="h-4 w-4 text-foreground" /> Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { icon: Phone, label: "Phone", value: user?.contact_number },
                  { icon: MapPin, label: "Address", value: user?.address || "Not set" },
                  { icon: Briefcase, label: "Occupation", value: user?.occupation || "Not set" },
                  { icon: Users, label: "Date of Birth", value: user?.date_of_birth },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/20">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</p>
                      <p className="text-sm font-medium">{value || "—"}</p>
                    </div>
                  </div>
                ))}
                <Link to="/profile">
                  <Button variant="outline" className="w-full mt-2 gap-2">
                    View Full Profile <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Quick Access
            </h2>
            {quickLinks.map(({ to, icon: Icon, label, desc, color, bg, requireOptIn }) => {
              // Hide Matrimony browse link if user hasn't opted in
              if (requireOptIn && (!user?.matrimony || !user.matrimony.opted_in)) return null;

              return (
                <Link key={to} to={to}>
                  <Card className="border border-border shadow-none bg-card hover:bg-secondary/40 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-9 h-9 rounded border ${bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`h-4 w-4 ${color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}

            {/* Community info card */}
            <Card className="border border-border shadow-none bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded bg-secondary border border-border flex items-center justify-center">
                    <Users className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Community</p>
                    <p className="text-xs text-muted-foreground">Your membership status</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <Badge variant={roleBadgeVariant === "success" ? "default" : "secondary"} className="text-[10px] font-semibold">
                      {roleLabel[user?.role || ""] || user?.role}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
