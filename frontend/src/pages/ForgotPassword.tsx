import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import api from "@/lib/api"
import { handleApiError } from "@/lib/utils"
import { Mail, Lock, Loader2, ShieldCheck, ArrowLeft, CheckCircle } from "lucide-react"

type Step = "request" | "reset" | "success"

export default function ForgotPassword() {
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>("request")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError("Please enter your email address.")
      return
    }

    setError("")
    setLoading(true)

    try {
      const res = await api.post("/auth/forgot-password", { email })
      setSuccessMsg(res.data.message || "Reset code sent successfully!")
      setStep("reset")
    } catch (err: unknown) {
      setError(handleApiError(err, "Failed to send reset code. Please try again."))
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || code.length !== 6) {
      setError("Please enter the 6-digit verification code.")
      return
    }
    if (!newPassword || newPassword.length < 8) {
      setError("Password must be at least 8 characters long.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setError("")
    setLoading(true)

    try {
      await api.post("/auth/reset-password", {
        email,
        code,
        new_password: newPassword,
      })
      setStep("success")
      setTimeout(() => {
        navigate("/login")
      }, 3000)
    } catch (err: unknown) {
      setError(handleApiError(err, "Reset failed. Please check the code and try again."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden transition-colors duration-300">
      {/* Simple Background */}
      <div className="absolute inset-0 bg-background -z-10" />

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
              <span translate="no" className="notranslate">Lad Matrimony</span>
            </span>
          </Link>
        </div>

        {/* Card Component */}
        <div className="w-full border border-border/80 bg-card/45 backdrop-blur-xl shadow-xl rounded-[24px] p-8 transition-all duration-300 animate-fade-in">
          
          {/* STEP 1: REQUEST CODE */}
          {step === "request" && (
            <>
              <div className="space-y-1.5 pb-6">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Reset Password</h2>
                <p className="text-xs text-muted-foreground">
                  Enter your email address to receive a 6-digit verification code.
                </p>
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                    Email Address
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

                {error && (
                  <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2">
                    <span className="font-semibold">{error}</span>
                  </div>
                )}

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-11 text-xs font-bold shadow-md hover:opacity-95 rounded-xl gap-2 flex items-center justify-center transition-all duration-300 cursor-pointer" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {loading ? "Sending Code..." : "Send Reset Code"}
                </Button>

                <Link 
                  to="/login" 
                  className="w-full h-10 text-xs font-semibold flex items-center justify-center gap-1.5 hover:text-foreground text-muted-foreground transition-colors mt-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Login
                </Link>
              </form>
            </>
          )}

          {/* STEP 2: VERIFY CODE & RESET PASSWORD */}
          {step === "reset" && (
            <>
              <div className="space-y-1.5 pb-6">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Enter Reset Details</h2>
                {successMsg && (
                  <p className="text-xs text-emerald-600 font-semibold bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                    {successMsg}
                  </p>
                )}
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                    Verification Code
                  </Label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/85" />
                    <Input
                      id="code"
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      className="pl-12 pr-4 h-11 bg-background/50 border-border rounded-xl text-xs placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary/30 font-mono tracking-widest"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/85" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="•••••••• (Min. 8 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-12 pr-4 h-11 bg-background/50 border-border rounded-xl text-xs placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary/30"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/85" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-12 pr-4 h-11 bg-background/50 border-border rounded-xl text-xs placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary/30"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2">
                    <span className="font-semibold">{error}</span>
                  </div>
                )}

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-11 text-xs font-bold mt-2 shadow-md hover:opacity-95 rounded-xl gap-2 flex items-center justify-center transition-all duration-300 cursor-pointer" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {loading ? "Resetting Password..." : "Reset Password"}
                </Button>

                <button 
                  type="button" 
                  onClick={() => { setStep("request"); setError(""); setCode("") }}
                  className="w-full h-10 text-xs font-semibold flex items-center justify-center gap-1.5 hover:text-foreground text-muted-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Request new code
                </button>
              </form>
            </>
          )}

          {/* STEP 3: SUCCESS REDIRECT */}
          {step === "success" && (
            <div className="text-center space-y-4 py-6 animate-in zoom-in-95 duration-300">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle className="h-7 w-7 text-emerald-500" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold tracking-tight text-foreground">Password Reset Complete</h2>
                <p className="text-xs text-muted-foreground px-2">
                  Your password has been successfully reset. Redirecting you to the login page...
                </p>
              </div>
              <div className="pt-2">
                <Loader2 className="h-5 w-5 text-muted-foreground animate-spin mx-auto" />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
