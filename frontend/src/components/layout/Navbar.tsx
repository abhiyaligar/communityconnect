import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LogOut,
  Menu,
  X,
  Home,
  Heart,
  Shield,
  Sun,
  Moon,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/contexts/ThemeContext"

export function Navbar() {
  const { user, isAuthenticated, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const showMatrimony = !!user?.matrimony?.opted_in || !!(user?.wards && user.wards.length > 0)

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?"

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg border border-border bg-card/60 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
              <svg className="h-4 w-4 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="3.5" className="fill-foreground/10" />
                <circle cx="12" cy="4.5" r="2" />
                <circle cx="5" cy="9.5" r="2" />
                <circle cx="19" cy="9.5" r="2" />
                <circle cx="8" cy="18.5" r="2" />
                <circle cx="16" cy="18.5" r="2" />
                <path d="M12 8v1.5M6.5 11l2.5 1M17.5 11l-2.5 1M9 16.5l2-2M15 16.5l-2-2" />
              </svg>
            </div>
            <span className="font-semibold text-base text-foreground tracking-tight">CommunityConnect</span>
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
                {showMatrimony && (
                  <Link to="/matrimony">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Heart className="h-4 w-4" /> Matrimony
                    </Button>
                  </Link>
                )}
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
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link to="/profile">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
                    <Avatar className="h-7 w-7 border border-border">
                      <AvatarImage src={user?.profile_photo_url} />
                      <AvatarFallback className="text-xs bg-muted text-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">
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
                  <Button size="sm">Join Community</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle & Theme toggle */}
          <div className="flex items-center gap-1 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <button
              className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
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
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={user?.profile_photo_url} />
                    <AvatarFallback className="text-xs bg-muted text-foreground">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{user?.full_name}</p>
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
                  {showMatrimony && (
                    <Link to="/matrimony" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <Heart className="h-4 w-4" /> Matrimony
                      </Button>
                    </Link>
                  )}
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
