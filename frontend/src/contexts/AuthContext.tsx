import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react"
import { AuthUser, UserRole } from "@/types"
import api from "@/lib/api"

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  login: (token: string, userId: string, role: UserRole) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  isAuthenticated: boolean
  hasRole: (...roles: UserRole[]) => boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("access_token")
  )
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("access_token")
      if (!savedToken) {
        setIsLoading(false)
        return
      }
      setToken(savedToken)
      try {
        const res = await api.get("/profiles/me")
        setUser({ ...res.data, hasProfile: true })

        // Bi-directional language settings sync
        const localLang = localStorage.getItem("preferred_language")
        const backendLang = res.data.preferred_language
        if (backendLang && backendLang !== localLang) {
          if (localLang && localLang !== "en" && backendLang === "en") {
            api.put("/profiles/preferred-language", { preferred_language: localLang }).catch(console.error)
          } else {
            localStorage.setItem("preferred_language", backendLang)
            window.location.reload()
          }
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          // User is authenticated but hasn't created a profile (pending onboarding)
          setUser({
            id: "unknown",
            role: "unverified",
            full_name: "New User",
            hasProfile: false,
          } as AuthUser)
        } else {
          localStorage.removeItem("access_token")
          setToken(null)
          setUser(null)
        }
      } finally {
        setIsLoading(false)
      }
    }
    initAuth()
  }, [])

  const login = async (
    accessToken: string,
    userId: string,
    role: UserRole
  ) => {
    localStorage.setItem("access_token", accessToken)
    setToken(accessToken)
    try {
      const res = await api.get("/profiles/me")
      setUser({ ...res.data, hasProfile: true })

      // Sync preferred language on login
      const localLang = localStorage.getItem("preferred_language")
      const backendLang = res.data.preferred_language
      if (backendLang && backendLang !== localLang) {
        if (localLang && localLang !== "en" && backendLang === "en") {
          await api.put("/profiles/preferred-language", { preferred_language: localLang }).catch(console.error)
        } else {
          localStorage.setItem("preferred_language", backendLang)
          window.location.reload()
        }
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setUser({
          id: userId,
          role: role,
          full_name: "New User",
          hasProfile: false,
        } as AuthUser)
      } else {
        throw err
      }
    }
  }

  const logout = async () => {
    try {
      await api.post("/auth/logout")
    } finally {
      localStorage.removeItem("access_token")
      setToken(null)
      setUser(null)
    }
  }

  const refreshUser = async () => {
    const savedToken = localStorage.getItem("access_token")
    if (!savedToken) return
    try {
      const res = await api.get("/profiles/me")
      setUser({ ...res.data, hasProfile: true })
    } catch (err) {
      console.error("Failed to refresh user profile data", err)
    }
  }

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false
    return roles.includes(user.role as UserRole)
  }

  const isAdmin =
    user?.role === "community_admin" || user?.role === "local_admin"

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        refreshUser,
        isAuthenticated: !!token && !!user,
        hasRole,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
