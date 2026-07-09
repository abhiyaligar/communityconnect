import { useEffect, useState, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import { handleApiError } from "@/lib/utils"
import { Loader2, AlertCircle, CheckCircle, Users } from "lucide-react"

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
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <Users className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-foreground">CommunityConnect</span>
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
                    Redirecting you to CommunityConnect...
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
