import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  LogOut,
  Menu,
  X,
  Home,
  Heart,
  Shield,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function Navbar() {
  const { user, isAuthenticated, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?"

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
              <Users className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text">CommunityConnect</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {isAuthenticated && !isAdmin && (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Home className="h-4 w-4" /> Dashboard
                  </Button>
                </Link>
                <Link to="/matrimony">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Heart className="h-4 w-4" /> Matrimony
                  </Button>
                </Link>
              </>
            )}
            {isAdmin && (
              <Link to="/admin/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Shield className="h-4 w-4" /> Admin Panel
                </Button>
              </Link>
            )}
          </div>

          {/* Right Section */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link to="/profile">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user?.profile_photo_url} />
                      <AvatarFallback className="text-xs gradient-primary text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate max-w-[120px]">
                      {user?.full_name}
                    </span>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/register">
                  <Button variant="gradient" size="sm">Join Community</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/5"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden border-t border-white/10 glass overflow-hidden transition-all duration-300",
          mobileOpen ? "max-h-96" : "max-h-0 border-t-0"
        )}
      >
        <div className="px-4 py-4 space-y-2">
          {isAuthenticated ? (
            <>
              <Link to="/profile" onClick={() => setMobileOpen(false)}>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profile_photo_url} />
                    <AvatarFallback className="text-xs gradient-primary text-white">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{user?.full_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace(/_/g, " ")}</p>
                  </div>
                </div>
              </Link>
              {!isAdmin && (
                <>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Home className="h-4 w-4" /> Dashboard
                    </Button>
                  </Link>
                  <Link to="/matrimony" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Heart className="h-4 w-4" /> Matrimony
                    </Button>
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link to="/admin/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Shield className="h-4 w-4" /> Admin Panel
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-destructive"
                onClick={() => { handleLogout(); setMobileOpen(false) }}
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full">Sign In</Button>
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)}>
                <Button variant="gradient" className="w-full">Join Community</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
