import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import api from "@/lib/api"
import { handleApiError } from "@/lib/utils"
import { Users, Mail, Lock, ArrowRight, Loader2 } from "lucide-react"
import { TokenResponse } from "@/types"

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center group-hover:opacity-90 transition-opacity">
              <Users className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-foreground">CommunityConnect</span>
          </Link>
        </div>

        <Card className="border border-border shadow-sm bg-card">
          <CardHeader className="space-y-1.5 pb-6">
            <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10 bg-background border-border"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-xs text-muted-foreground hover:text-foreground hover:underline font-medium">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-10 bg-background border-border"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <Button 
                type="submit" 
                size="lg" 
                className="w-full h-10 text-sm font-semibold mt-2" 
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {loading ? "Signing in..." : "Sign in"}
                {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary hover:underline font-semibold hover:text-primary/80 transition-colors">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
