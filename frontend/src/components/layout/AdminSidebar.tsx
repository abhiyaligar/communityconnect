import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Heart,
  UserPlus,
  LogOut,
  Shield,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const adminLinks = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Members", icon: Users },
  { to: "/admin/verification", label: "Verification", icon: CheckSquare },
  { to: "/admin/matrimony", label: "Matrimony", icon: Heart },
]

const communityAdminLinks = [
  { to: "/admin/create-admin", label: "Create Admin", icon: UserPlus },
]

export function AdminSidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <aside className="w-64 min-h-screen glass border-r border-white/10 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">Admin Panel</p>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.role?.replace(/_/g, " ")}
            </p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
          Management
        </p>
        {adminLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
          </NavLink>
        ))}

        {(user?.role === "community_admin" || user?.role === "local_admin") && (
          <>
            <div className="pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
                Administration
              </p>
              {communityAdminLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                      isActive
                        ? "bg-primary/15 text-primary border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                </NavLink>
              ))}
            </div>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-medium truncate">{user?.full_name}</p>
          <p className="text-xs text-muted-foreground">{user?.contact_number}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  )
}
