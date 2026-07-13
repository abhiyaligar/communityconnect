import { useEffect, useState, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import { handleApiError } from "@/lib/utils"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"

export default function GoogleCallback() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing")
  
  // Use a ref to prevent double execution in React StrictMode
  const executedRef = useRef(false)

  useEffect(() => {
    if (executedRef.current) return
    
    const code = searchParams.get("code")
    if (!code) {
      setError("No authorization code provided from Google.")
      setStatus("error")
      return
    }

    executedRef.current = true
    const exchangeCode = async () => {
      try {
        const res = await api.post("/auth/google/callback", { code })
        const { access_token, registered, role, user_id } = res.data

        setStatus("success")
        
        // Log the user in to system (saves token & fetches profiles/me)
        await login(access_token, user_id, role)

        // Delay slightly for smooth transition
        setTimeout(() => {
          if (!registered) {
            // Redirect to registration onboarding profile step
            navigate("/register", { state: { step: "core" }, replace: true })
          } else {
            // Normal redirect based on role
            if (role === "community_admin" || role === "local_admin") {
              navigate("/admin/dashboard", { replace: true })
            } else if (role === "unverified") {
              navigate("/pending-verification", { replace: true })
            } else {
              navigate("/dashboard", { replace: true })
            }
          }
        }, 1500)
      } catch (err: unknown) {
        console.error("Google authentication failed", err)
        setError(handleApiError(err, "Failed to authenticate with Google."))
        setStatus("error")
      }
    }

    exchangeCode()
  }, [searchParams, login, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Simple Background */}

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded border border-border/80 bg-card/60 flex items-center justify-center shadow-sm">
              <svg className="h-4.5 w-4.5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="3.5" className="fill-foreground/10" />
                <circle cx="12" cy="4.5" r="2" />
                <circle cx="5" cy="9.5" r="2" />
                <circle cx="19" cy="9.5" r="2" />
                <circle cx="8" cy="18.5" r="2" />
                <circle cx="16" cy="18.5" r="2" />
                <path d="M12 8v1.5M6.5 11l2.5 1M17.5 11l-2.5 1M9 16.5l2-2M15 16.5l-2-2" />
              </svg>
            </div>
            <span className="font-semibold text-lg tracking-tight text-foreground notranslate" translate="no">Lad Matrimony</span>
          </div>
        </div>

        <Card className="border border-border shadow-sm bg-card transition-all duration-300">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            {status === "processing" && (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center mx-auto shadow-sm">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
                <div className="space-y-1.5">
                  <CardTitle className="text-xl font-bold tracking-tight">Verifying Google Account</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Please wait while we establish your secure session...
                  </CardDescription>
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="space-y-1.5">
                  <CardTitle className="text-xl font-bold tracking-tight">Authenticated Successfully!</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                     Redirecting you to <span translate="no" className="notranslate">Lad Matrimony</span>...
                  </CardDescription>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl font-bold tracking-tight text-destructive">Authentication Failed</CardTitle>
                  <p className="text-sm text-muted-foreground px-4">
                    {error || "An unexpected error occurred during Google sign-in."}
                  </p>
                </div>
                <div className="pt-2 flex flex-col gap-2">
                  <Button onClick={() => navigate("/login")} className="w-full">
                    Return to Login
                  </Button>
                  <Button onClick={() => navigate("/register")} variant="ghost" className="w-full text-muted-foreground">
                    Create a new account
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
