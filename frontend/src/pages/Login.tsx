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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[80px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
              <Users className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight">CommunityConnect</span>
          </Link>
        </div>

        <Card className="glass-card border-white/10 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-3 pb-6">
            <CardTitle className="text-3xl font-bold tracking-tight">Welcome back</CardTitle>
            <CardDescription className="text-base text-muted-foreground/80">
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
                    className="pl-10 h-12 bg-background/50 border-white/10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-sm text-primary hover:underline font-medium">
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
                    className="pl-10 h-12 bg-background/50 border-white/10"
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
                variant="gradient" 
                size="lg" 
                className="w-full h-12 text-base font-semibold group mt-2" 
                disabled={loading}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                {loading ? "Signing in..." : "Sign in"}
                {!loading && <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />}
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
