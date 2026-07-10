import { Navigate } from "react-router-dom"
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-[#0f172a] relative overflow-hidden transition-colors duration-500">
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
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-violet-500/10 dark:bg-violet-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/3 right-1/3 translate-x-1/2 translate-y-1/2 w-72 h-72 bg-sky-500/10 dark:bg-sky-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '3s' }} />

        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Logo container with animated pulsing scaling and gradient background */}
          <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-white dark:bg-[#1e293b] shadow-2xl border border-border/60 transition-all duration-300 transform hover:scale-105">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-violet-500/20 to-sky-400/20 animate-pulse" />
            <svg
              className="h-10 w-10 text-[#0f172a] dark:text-[#f8fafc] relative z-10 animate-pulse"
              style={{ animationDuration: '2s' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.905 0-5.54-1.037-7.593-2.768M19.843 7.582A8.997 8.997 0 0112 18.5c-3.486 0-6.422-1.979-7.843-4.823M19.843 7.582a8.997 8.997 0 00-7.843 4.582m-7.843 0A8.997 8.997 0 0012 18.5" />
            </svg>
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-[#0f172a] dark:text-[#f8fafc] flex items-center justify-center">
              Community<span className="bg-gradient-to-r from-violet-600 to-sky-500 dark:from-violet-400 dark:to-sky-400 bg-clip-text text-transparent">Connect</span>
            </h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-80">
              Securing Your Network...
            </p>
          </div>

          {/* Premium linear loading bar */}
          <div className="w-40 h-1 bg-border/40 dark:bg-border/20 rounded-full overflow-hidden relative">
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

  return <>{children}</>
}
