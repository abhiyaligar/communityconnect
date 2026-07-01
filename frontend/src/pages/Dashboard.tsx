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
  { to: "/profile", icon: User, label: "View Profile", desc: "Manage your personal info", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  { to: "/matrimony", icon: Heart, label: "Matrimony", desc: "Browse eligible matches", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
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
        <div className="relative glass-card rounded-3xl p-8 mb-8 overflow-hidden">
          <div className="absolute inset-0 gradient-primary opacity-5 rounded-3xl" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-2xl translate-x-16 -translate-y-16" />

          <div className="relative flex items-start gap-6">
            <Avatar className="h-16 w-16 border-2 border-primary/30">
              <AvatarImage src={user?.profile_photo_url} />
              <AvatarFallback className="text-xl font-bold gradient-primary text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">Welcome back, {user?.full_name?.split(" ")[0]}!</h1>
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={roleBadgeVariant}>
                  {user?.role === "verified_adult" ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <Clock className="h-3 w-3 mr-1" />
                  )}
                  {roleLabel[user?.role || ""] || user?.role}
                </Badge>
                {user?.gender && (
                  <Badge variant="outline" className="capitalize">{user.gender}</Badge>
                )}
                {user?.marital_status && (
                  <Badge variant="outline" className="capitalize">{user.marital_status.replace(/_/g, " ")}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Summary */}
          <div className="md:col-span-2">
            <Card className="glass-card h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4 text-primary" /> Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { icon: Phone, label: "Phone", value: user?.contact_number },
                  { icon: MapPin, label: "Address", value: user?.address || "Not set" },
                  { icon: Briefcase, label: "Occupation", value: user?.occupation || "Not set" },
                  { icon: Users, label: "Date of Birth", value: user?.date_of_birth },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
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
            {quickLinks.map(({ to, icon: Icon, label, desc, color, bg }) => (
              <Link key={to} to={to}>
                <Card className="glass-card hover:border-primary/20 transition-all duration-300 group cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl border ${bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className={`h-5 w-5 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}

            {/* Community info card */}
            <Card className="glass-card">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Community</p>
                    <p className="text-xs text-muted-foreground">Your membership status</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={roleBadgeVariant} className="text-xs">
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
