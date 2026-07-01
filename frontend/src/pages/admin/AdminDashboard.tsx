import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { AdminDashboardStats } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CheckCircle, Clock, Heart, TrendingUp, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

const statCards = (data: AdminDashboardStats) => [
  {
    title: "Total Members",
    value: data.total_users,
    icon: Users,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    change: "All time",
  },
  {
    title: "Verified Members",
    value: data.verified_users,
    icon: CheckCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    change: `${data.total_users > 0 ? Math.round((data.verified_users / data.total_users) * 100) : 0}% of total`,
  },
  {
    title: "Pending Verification",
    value: data.pending_verifications,
    icon: Clock,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    change: "Awaiting review",
  },
  {
    title: "Matrimony Opt-ins",
    value: data.matrimony_opt_ins,
    icon: Heart,
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
    change: "Active profiles",
  },
]

export default function AdminDashboard() {
  const { user } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const res = await api.get<AdminDashboardStats>("/admin/dashboard")
      return res.data
    },
    refetchInterval: 30000,
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <p className="text-muted-foreground">
          Welcome back, <strong>{user?.full_name}</strong>. Here's the community overview.
        </p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : data ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {statCards(data).map((card) => (
            <Card key={card.title} className="glass-card hover:border-primary/20 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl border ${card.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold mb-1">{card.value.toLocaleString()}</p>
                  <p className="text-sm font-medium text-foreground">{card.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.change}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {/* Overview Cards */}
      {data && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Membership Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Total Registered", value: data.total_users, color: "bg-primary" },
                { label: "Verified Members", value: data.verified_users, color: "bg-emerald-500" },
                { label: "Unverified", value: data.total_users - data.verified_users, color: "bg-amber-500" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-500`}
                      style={{ width: `${data.total_users > 0 ? (item.value / data.total_users) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" /> Action Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-amber-400" />
                  <div>
                    <p className="text-sm font-medium">Pending Verifications</p>
                    <p className="text-xs text-muted-foreground">Members awaiting approval</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-amber-400">{data.pending_verifications}</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-rose-400" />
                  <div>
                    <p className="text-sm font-medium">Matrimony Profiles</p>
                    <p className="text-xs text-muted-foreground">Active opt-in profiles</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-rose-400">{data.matrimony_opt_ins}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
