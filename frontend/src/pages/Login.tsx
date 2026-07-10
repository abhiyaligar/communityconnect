import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useTranslation } from "@/contexts/LanguageContext"
import { useTheme } from "@/contexts/ThemeContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import api from "@/lib/api"
import { handleApiError } from "@/lib/utils"
import { Mail, Lock, Loader2, Shield, ShieldCheck, BadgeCheck, Sun, Moon } from "lucide-react"
import { TokenResponse } from "@/types"

export default function Login() {
  const { login } = useAuth()
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [staySignedIn, setStaySignedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError("")
    try {
      const res = await api.get("/auth/google/url")
      window.location.href = res.data.url
    } catch (err: unknown) {
      setError(handleApiError(err, "Failed to get Google login link."))
      setGoogleLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Please enter both email and password.")
      return
    }
    
    setError("")
    setLoading(true)
    
    try {
      const res = await api.post<TokenResponse>("/auth/login", {
        email,
        password,
      })
      await login(res.data.access_token, res.data.user_id, res.data.role)

      // Redirect to onboarding if profile hasn't been created yet
      if (!res.data.registered) {
        navigate("/register", { state: { step: "core" } })
        return
      }

      // Redirect based on role
      if (res.data.role === "community_admin" || res.data.role === "local_admin") {
        navigate("/admin/dashboard")
      } else if (res.data.role === "unverified") {
        navigate("/pending-verification")
      } else {
        navigate("/dashboard")
      }

    } catch (err: unknown) {
      setError(handleApiError(err, "Invalid email or password."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden transition-colors duration-300">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-secondary/30 -z-10" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />

      {/* Floating Theme Toggle */}
      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="absolute top-6 right-6 p-2.5 rounded-xl border border-border bg-card/50 text-foreground hover:bg-secondary transition-all duration-300 shadow-sm backdrop-blur-sm z-50 cursor-pointer"
        aria-label="Toggle Theme"
      >
        {theme === "dark" ? (
          <Sun className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
        ) : (
          <Moon className="h-4.5 w-4.5 text-slate-700" />
        )}
      </button>

      <div className="w-full max-w-[420px] relative z-10 flex flex-col items-center">
        {/* App Logo */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Link to="/" className="flex flex-col items-center group">
            <div className="w-14 h-14 rounded-2xl border border-border/80 bg-card/60 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300 backdrop-blur-md">
              <svg className="h-7 w-7 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="3.5" className="fill-foreground/10" />
                <circle cx="12" cy="4.5" r="2" />
                <circle cx="5" cy="9.5" r="2" />
                <circle cx="19" cy="9.5" r="2" />
                <circle cx="8" cy="18.5" r="2" />
                <circle cx="16" cy="18.5" r="2" />
                <path d="M12 8v1.5M6.5 11l2.5 1M17.5 11l-2.5 1M9 16.5l2-2M15 16.5l-2-2" />
              </svg>
            </div>
            <span className="font-extrabold text-3xl tracking-tight text-foreground mt-4 group-hover:opacity-90 transition-opacity">
              CommunityConnect
            </span>
          </Link>
        </div>


        {/* Form Container */}
        <div className="w-full border border-border/80 bg-card/45 backdrop-blur-xl shadow-xl rounded-[24px] p-8 transition-all duration-300">
          <div className="space-y-1.5 pb-6">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{t("welcome")}</h2>
          </div>


          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                {t("email_label")}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/85" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 pr-4 h-11 bg-background/50 border-border rounded-xl text-xs placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary/30"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                  {t("password_label")}
                </Label>
                <Link to="/forgot-password" className="text-[11px] text-primary hover:underline font-semibold transition-colors">
                  {t("forgot_password")}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/85" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-4 h-11 bg-background/50 border-border rounded-xl text-xs placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary/30"
                  required
                />
              </div>
            </div>

            {/* Custom Checkbox stay signed in */}
            <div className="flex items-center space-x-2 pt-1 select-none">
              <button
                type="button"
                id="staySignedIn"
                onClick={() => setStaySignedIn(!staySignedIn)}
                className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  staySignedIn
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border bg-background/50 hover:border-muted-foreground"
                }`}
              >
                {staySignedIn && (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <label
                htmlFor="staySignedIn"
                onClick={() => setStaySignedIn(!staySignedIn)}
                className="text-xs text-muted-foreground font-medium cursor-pointer"
              >
                Stay signed in for 30 days
              </label>
            </div>

            {error && (
              <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <Button 
              type="submit" 
              size="lg" 
              className="w-full h-11 text-xs font-bold mt-2 shadow-md hover:opacity-95 rounded-xl gap-2 flex items-center justify-center transition-all duration-300 cursor-pointer" 
              disabled={loading || googleLoading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 fill-primary-foreground/10" />
              )}
              {loading ? "..." : t("login")}
            </Button>

            <div className="relative flex py-2.5 items-center">
              <div className="flex-grow border-t border-border/60"></div>
              <span className="flex-shrink mx-4 text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                or continue with
              </span>
              <div className="flex-grow border-t border-border/60"></div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full h-11 text-xs font-bold border border-border bg-card/30 hover:bg-secondary/80 hover:text-foreground text-foreground rounded-xl flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              {googleLoading ? "Connecting to Google..." : "Google"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8 select-none font-medium">
          New here?{" "}
          <Link to="/register" className="text-primary hover:underline font-bold transition-all">
            Create Account
          </Link>
        </p>

        {/* Security badges */}
        <div className="flex justify-center items-center gap-5 mt-10 pt-5 border-t border-border/30 w-full text-muted-foreground/80 select-none">
          <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-wider uppercase">
            <Lock className="h-3.5 w-3.5 text-muted-foreground/75" />
            <span>AES-256</span>
          </div>
          <div className="w-1 h-1 bg-border/50 rounded-full" />
          <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-wider uppercase">
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground/75" />
            <span>Verified</span>
          </div>
          <div className="w-1 h-1 bg-border/50 rounded-full" />
          <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-wider uppercase">
            <BadgeCheck className="h-3.5 w-3.5 text-muted-foreground/75" />
            <span>Certified</span>
          </div>
        </div>
      </div>
    </div>
  )
}
