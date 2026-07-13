import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { UserRole } from "@/types"

interface ProtectedRouteProps {

  children: React.ReactNode
  allowedRoles?: UserRole[]
  requireAuth?: boolean
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireAuth = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] relative overflow-hidden">
        <style>{`
          @keyframes progress-shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
          .animate-shimmer {
            animation: progress-shimmer 1.6s infinite ease-in-out;
          }
        `}</style>

        {/* Ambient background glow blobs */}
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-violet-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/3 right-1/3 translate-x-1/2 translate-y-1/2 w-72 h-72 bg-sky-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '3s' }} />

        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Logo container with animated pulsing scaling and gradient background */}
          <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-2xl border border-border/60 transition-all duration-300 transform hover:scale-105">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-violet-500/20 to-sky-400/20 animate-pulse" />
            <svg
              className="h-10 w-10 text-[#0f172a] relative z-10 animate-pulse"
              style={{ animationDuration: '2s' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <circle cx="12" cy="12" r="3.5" className="fill-current/10" />
              <circle cx="12" cy="4.5" r="2" />
              <circle cx="5" cy="9.5" r="2" />
              <circle cx="19" cy="9.5" r="2" />
              <circle cx="8" cy="18.5" r="2" />
              <circle cx="16" cy="18.5" r="2" />
              <path d="M12 8v1.5M6.5 11l2.5 1M17.5 11l-2.5 1M9 16.5l2-2M15 16.5l-2-2" />
            </svg>
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-[#0f172a]">
              <span translate="no" className="notranslate">Lad Matrimony</span>
            </h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-80">
              Loading...
            </p>
          </div>

          {/* Premium linear loading bar */}
          <div className="w-40 h-1 bg-border/40 rounded-full overflow-hidden relative">
            <div className="absolute top-0 bottom-0 left-0 w-2/3 bg-gradient-to-r from-violet-600 to-sky-500 rounded-full animate-shimmer" style={{ transformOrigin: 'left' }} />
          </div>
        </div>
      </div>
    )
  }


  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role as UserRole)) {
    // Redirect based on role
    if (user.role === "unverified") return <Navigate to="/pending-verification" replace />
    if (user.role === "community_admin" || user.role === "local_admin")
      return <Navigate to="/admin/dashboard" replace />
    return <Navigate to="/dashboard" replace />
  }

  // Legal agreement check — redirect to accept page if not accepted (skip for legal routes)
  if (
    user &&
    !user.terms_accepted_at &&
    !user.nda_accepted_at &&
    !location.pathname.startsWith("/legal/") &&
    !location.pathname.startsWith("/pending-verification") &&
    !location.pathname.startsWith("/register") &&
    !location.pathname.startsWith("/login") &&
    !location.pathname.startsWith("/terms") &&
    !location.pathname.startsWith("/nda")
  ) {
    return <Navigate to="/legal/accept" replace />
  }

  return <>{children}</>
}
