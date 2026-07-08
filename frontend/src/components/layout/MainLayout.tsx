import React, { useState } from "react"
import { NavLink, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  LayoutDashboard,
  Users,
  User,
  CheckSquare,
  Heart,
  MessageSquare,
  Shield,
  Settings,
  HelpCircle,
  Menu,
  X,
  Bell,
  Lock,
  LogOut,
  Plus,
  Camera,
  Home,
  BookOpen,
  Download
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isProfileTab = location.pathname === "/profile"
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  const isUnverified = user?.role === "unverified"
  const isVerifiedAdult = user?.role === "verified_adult"

  const menuLinks = [
    ...(isAdmin
      ? [{ to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }]
      : !isUnverified
        ? [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }]
        : []
    ),
    ...(isAdmin
      ? [{ to: "/admin/users", label: "Registry", icon: Users }]
      : !isUnverified
        ? [{ to: "/registry", label: "Registry", icon: Users }]
        : []
    ),
    { to: "/profile", label: "Profiles", icon: User },
    ...(isAdmin ? [{ to: "/admin/verification", label: "Verification", icon: CheckSquare }] : []),
    ...(isAdmin
      ? [{ to: "/admin/matrimony", label: "Matrimonial", icon: Heart }]
      : !isUnverified && isVerifiedAdult
        ? [{ to: "/matrimony", label: "Matrimonial", icon: Heart }]
        : []
    ),
    ...(!isAdmin && !isUnverified && isVerifiedAdult && user?.matrimony?.opted_in
      ? [{ to: "/matrimony/gallery", label: "Manage Gallery", icon: Camera }]
      : []
    ),
    ...(isVerifiedAdult ? [{ to: "/matrimony/requests", label: "Requests", icon: MessageSquare }] : []),
    ...(isAdmin ? [{ to: "/admin/create-admin", label: "Operators", icon: Plus }] : [])
  ]


  const bottomLinks = [
    { to: "/settings", label: "Settings", icon: Settings },
    { to: "/support", label: "Support", icon: HelpCircle }
  ]

  const bottomNavLinks = [
    { to: isAdmin ? "/admin/dashboard" : "/dashboard", label: "Home", icon: Home },
    ...(isAdmin
      ? [
          { to: "/admin/matrimony", label: "Matrimonial", icon: Heart },
          { to: "/admin/verification", label: "Manage Gallery", icon: Camera }
        ]
      : !isUnverified && isVerifiedAdult
        ? [
            { to: "/matrimony", label: "Matrimonial", icon: Heart },
            { to: "/matrimony/gallery", label: "Manage Gallery", icon: Camera }
          ]
        : []
    ),
    { to: "/profile", label: "Profile", icon: User }
  ]

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?"

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#f8fafc] border-r border-[#e2e8f0] text-[#0f172a]">
      {/* Brand Header */}
      <div className="p-6 pb-4 border-b border-[#e2e8f0]">
        <NavLink to="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded bg-[#0f172a] flex items-center justify-center text-white font-bold">
            CC
          </div>
          <span className="font-bold text-lg tracking-tight text-[#0f172a]">
            CommunityConnect
          </span>
        </NavLink>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
        <div>
          <div className="px-3 mb-2">
            <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
              Main Menu
            </p>
            <p className="text-[10px] text-[#64748b]/80">
              Secure Community Portal
            </p>
          </div>

          <nav className="space-y-1">
            {menuLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-[#eceef0] text-[#0f172a] font-semibold border-l-4 border-[#0f172a]"
                      : "text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9]"
                  )
                }
              >
                <link.icon className="h-5 w-5 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Action Button (only for unverified users) */}
        {user?.role === "unverified" && (
          <div className="pt-2 px-1">
            <Button 
              className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white flex items-center justify-center gap-2 text-xs font-semibold py-5 rounded-lg"
              onClick={() => navigate("/profile")}
            >
              <Shield className="h-4 w-4" />
              <span>Verify Identity</span>
            </Button>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="p-4 border-t border-[#e2e8f0]">
        <nav className="space-y-1 mb-4">
          {bottomLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-[#eceef0] text-[#0f172a] font-semibold"
                    : "text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9]"
                )
              }
            >
              <link.icon className="h-5 w-5 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Card */}
        <div className="flex items-center justify-between p-2.5 bg-white border border-[#e2e8f0] rounded-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="h-8 w-8 border-2 border-white shadow-sm shrink-0">
              <AvatarImage src={user?.profile_photo_url} />
              <AvatarFallback className="text-xs bg-[#f1f5f9] text-[#0f172a] font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#0f172a] truncate">
                {user?.full_name || "Guest"}
              </p>
              <p className="text-[10px] text-[#64748b] capitalize truncate">
                {user?.role?.replace(/_/g, " ")}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-[#64748b] hover:text-destructive h-7 w-7"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-[#f7f9fb] font-sans antialiased">
      {/* Persistent Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Burger Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer Sheet */}
          <div className="relative w-64 max-w-xs bg-[#f8fafc] h-full flex flex-col animate-slide-in shadow-2xl z-10">
            <div className="absolute right-4 top-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="h-8 w-8 text-[#64748b] hover:text-[#0f172a]"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 h-full">
              <SidebarContent />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-[#e2e8f0] bg-white sticky top-0 z-30 flex items-center justify-between px-6">
          {/* Left: Mobile App Name & Logo / Desktop Search */}
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile/Tablet App Brand Header */}
            <NavLink to="/dashboard" className="flex lg:hidden items-center gap-2 group">
              <div className="w-7 h-7 rounded bg-[#0f172a] flex items-center justify-center text-white font-bold text-sm shrink-0">
                CC
              </div>
              <span className="font-bold text-base tracking-tight text-[#0f172a]">
                CommunityConnect
              </span>
            </NavLink>

            {/* Desktop global search bar */}
            <div className="relative max-w-md w-full hidden lg:block">
              <input
                type="text"
                placeholder={isAdmin ? "Search members, requests..." : "Global search..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:border-[#0f172a] focus:ring-1 focus:ring-[#0f172a]"
              />
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b]" />
            </div>
          </div>

          {/* Right: Mobile Requests Indicator & Desktop Profile Card */}
          <div className="flex items-center gap-4">
            {/* Settings button - visible on both mobile and desktop ONLY on Profile page */}
            {isProfileTab && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/settings")}
                className="text-[#64748b] hover:text-[#0f172a] h-9 w-9"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            )}

            {/* Mobile/Tablet Requests Notification Icon */}
            {!isAdmin && isVerifiedAdult && (
              <div className="lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/matrimony/requests")}
                  className="text-[#64748b] hover:text-[#0f172a] h-9 w-9 relative"
                >
                  <Bell className="h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Desktop right panel layout */}
            <div className="hidden lg:flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-[#64748b] hover:text-[#0f172a] h-9 w-9">
                <Bell className="h-5 w-5" />
              </Button>

              <Button variant="ghost" size="icon" className="text-[#64748b] hover:text-[#0f172a] h-9 w-9">
                <Lock className="h-5 w-5" />
              </Button>

              <Avatar 
                className="h-8 w-8 border-2 border-[#e2e8f0] cursor-pointer hover:border-[#0f172a] transition-colors"
                onClick={() => navigate("/profile")}
              >
                <AvatarImage src={user?.profile_photo_url} />
                <AvatarFallback className="text-xs bg-[#f1f5f9] text-[#0f172a] font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 overflow-x-hidden p-6 md:p-8 pb-24 lg:pb-8 max-w-[1280px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Bottom Navigation for Mobile & Tablet */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#e2e8f0] h-16 shadow-lg">
        <div className={cn("grid h-full w-full items-center px-4 max-w-md mx-auto", {
          "grid-cols-4": bottomNavLinks.length === 4,
          "grid-cols-3": bottomNavLinks.length === 3,
          "grid-cols-2": bottomNavLinks.length === 2,
          "grid-cols-1": bottomNavLinks.length === 1,
        })}>
          {bottomNavLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-center py-2.5 px-4 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-[#10b981]/10 text-[#10b981]"
                    : "text-[#64748b] hover:text-[#0f172a]"
                )
              }
            >
              {({ isActive }) => (
                <link.icon className={cn("h-6 w-6", isActive ? "stroke-[2.5]" : "stroke-2")} />
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}
