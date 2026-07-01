import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import api from "@/lib/api"
import { handleApiError } from "@/lib/utils"
import { Users, Phone, ArrowRight, RotateCcw, Loader2, ShieldCheck } from "lucide-react"
import { TokenResponse } from "@/types"

type Step = "phone" | "otp"

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>("phone")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [countdown, setCountdown] = useState(0)

  const startCountdown = () => {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timer); return 0 }
        return c - 1
      })
    }, 1000)
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.match(/^\+?[0-9]{10,15}$/)) {
      setError("Please enter a valid phone number.")
      return
    }
    setError("")
    setLoading(true)
    try {
      await api.post("/auth/otp/send", { phone_number: phone })
      setStep("otp")
      startCountdown()
    } catch (err: unknown) {
      setError(handleApiError(err, "Failed to send OTP. Try again."))
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) {
      setError("Enter the 6-digit code.")
      return
    }
    setError("")
    setLoading(true)
    try {
      const res = await api.post<TokenResponse>("/auth/otp/verify", {
        phone_number: phone,
        code: otp,
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
      setError(handleApiError(err, "Invalid or expired code."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-accent/6 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-xl shadow-primary/30 group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl gradient-text">CommunityConnect</span>
          </Link>
        </div>

        <Card className="glass-card">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 rounded-2xl glass border border-primary/30 flex items-center justify-center mx-auto mb-4">
              {step === "phone" ? (
                <Phone className="h-7 w-7 text-primary" />
              ) : (
                <ShieldCheck className="h-7 w-7 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {step === "phone" ? "Welcome Back" : "Verify Your Number"}
            </CardTitle>
            <CardDescription>
              {step === "phone"
                ? "Enter your registered phone number to sign in."
                : `We sent a 6-digit code to ${phone}`}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {step === "phone" ? (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-12 text-base"
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
                <Button type="submit" variant="gradient" size="lg" className="w-full gap-2" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {loading ? "Sending..." : "Send OTP"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-primary hover:underline font-medium">
                    Register now
                  </Link>
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="h-12 text-2xl text-center font-mono tracking-widest"
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
                <Button type="submit" variant="gradient" size="lg" className="w-full gap-2" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {loading ? "Verifying..." : "Verify & Sign In"}
                </Button>
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => { setStep("phone"); setOtp(""); setError("") }}
                  >
                    ← Change number
                  </button>
                  <button
                    type="button"
                    disabled={countdown > 0}
                    className="flex items-center gap-1.5 text-primary hover:underline disabled:opacity-50 disabled:no-underline"
                    onClick={handleSendOtp}
                  >
                    <RotateCcw className="h-3 w-3" />
                    {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
