import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/lib/api"
import { handleApiError } from "@/lib/utils"
import {
  Users, Phone, User, Calendar, ArrowRight, ArrowLeft,
  Loader2, CheckCircle, ShieldCheck, MapPin, Briefcase
} from "lucide-react"
import { TokenResponse } from "@/types"

type Step = "phone" | "otp" | "details" | "success"

interface FormData {
  phone_number: string
  code: string
  full_name: string
  date_of_birth: string
  gender: string
  marital_status: string
  address: string
  profile_photo_url: string
}

const steps = ["Phone", "Verify", "Profile"]

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>("phone")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [countdown, setCountdown] = useState(0)

  const [form, setForm] = useState<FormData>({
    phone_number: "",
    code: "",
    full_name: "",
    date_of_birth: "",
    gender: "",
    marital_status: "",
    address: "",
    profile_photo_url: "",
  })

  const set = (field: keyof FormData) => (val: string) =>
    setForm((f) => ({ ...f, [field]: val }))

  const startCountdown = () => {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((c) => { if (c <= 1) { clearInterval(timer); return 0 } return c - 1 })
    }, 1000)
  }

  const handleSendOtp = async () => {
    if (!form.phone_number.match(/^\+?[0-9]{10,15}$/)) {
      setError("Please enter a valid phone number.")
      return
    }
    setError("")
    setLoading(true)
    try {
      await api.post("/auth/otp/send", { phone_number: form.phone_number })
      setStep("otp")
      startCountdown()
    } catch (err: unknown) {
      setError(handleApiError(err, "Failed to send OTP. Try again."))
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (form.code.length !== 6) { setError("Enter the 6-digit code."); return }
    setError("")
    setStep("details")
  }

  const handleRegister = async () => {
    if (!form.full_name || !form.date_of_birth || !form.gender || !form.marital_status) {
      setError("Please fill in all required fields.")
      return
    }
    setError("")
    setLoading(true)
    try {
      const res = await api.post<TokenResponse>("/auth/register", {
        phone_number: form.phone_number,
        code: form.code,
        full_name: form.full_name,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        marital_status: form.marital_status,
        address: form.address || null,
        profile_photo_url: form.profile_photo_url || null,
      })
      await login(res.data.access_token, res.data.user_id, res.data.role)
      setStep("success")
      setTimeout(() => navigate("/pending-verification"), 2000)
    } catch (err: unknown) {
      setError(handleApiError(err, "Registration failed. Please try again."))
    } finally {
      setLoading(false)
    }
  }

  const currentStepIndex = step === "phone" ? 0 : step === "otp" ? 1 : 2

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-accent/6 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-xl shadow-primary/30">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl gradient-text">CommunityConnect</span>
          </Link>
        </div>

        {/* Step indicators */}
        {step !== "success" && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < currentStepIndex
                    ? "gradient-primary text-white"
                    : i === currentStepIndex
                    ? "border-2 border-primary text-primary"
                    : "border border-muted text-muted-foreground"
                }`}>
                  {i < currentStepIndex ? <CheckCircle className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${i === currentStepIndex ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
                {i < steps.length - 1 && <div className={`w-8 h-px ${i < currentStepIndex ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>
        )}

        <Card className="glass-card">
          {/* Step 1: Phone */}
          {step === "phone" && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="w-14 h-14 rounded-2xl glass border border-primary/30 flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-2xl">Create Account</CardTitle>
                <CardDescription>Enter your phone number to get started.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="reg-phone">Phone Number</Label>
                  <Input
                    id="reg-phone"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={form.phone_number}
                    onChange={(e) => set("phone_number")(e.target.value)}
                    className="h-12"
                  />
                </div>
                {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}
                <Button variant="gradient" size="lg" className="w-full gap-2" disabled={loading} onClick={handleSendOtp}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {loading ? "Sending..." : "Send OTP"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already a member?{" "}
                  <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
                </p>
              </CardContent>
            </>
          )}

          {/* Step 2: OTP */}
          {step === "otp" && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="w-14 h-14 rounded-2xl glass border border-primary/30 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-2xl">Verify Number</CardTitle>
                <CardDescription>We sent a 6-digit code to {form.phone_number}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="reg-otp">Verification Code</Label>
                  <Input
                    id="reg-otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    maxLength={6}
                    value={form.code}
                    onChange={(e) => set("code")(e.target.value.replace(/\D/g, ""))}
                    className="h-12 text-2xl text-center font-mono tracking-widest"
                  />
                </div>
                {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}
                <Button variant="gradient" size="lg" className="w-full" onClick={handleVerifyOtp}>
                  Continue <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <div className="flex items-center justify-between text-sm">
                  <button onClick={() => { setStep("phone"); setError("") }} className="text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <ArrowLeft className="h-3 w-3" /> Change number
                  </button>
                  <button
                    disabled={countdown > 0}
                    onClick={handleSendOtp}
                    className="text-primary hover:underline disabled:opacity-50"
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                  </button>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3: Profile Details */}
          {step === "details" && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="w-14 h-14 rounded-2xl glass border border-primary/30 flex items-center justify-center mx-auto mb-4">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-2xl">Your Profile</CardTitle>
                <CardDescription>Tell us about yourself to complete registration.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5" /> Full Name *
                  </Label>
                  <Input
                    id="full_name"
                    placeholder="John Doe"
                    value={form.full_name}
                    onChange={(e) => set("full_name")(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob" className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" /> Date of Birth *
                  </Label>
                  <Input
                    id="dob"
                    type="date"
                    value={form.date_of_birth}
                    onChange={(e) => set("date_of_birth")(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Gender *</Label>
                    <Select onValueChange={set("gender")}>
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Marital Status *</Label>
                    <Select onValueChange={set("marital_status")}>
                      <SelectTrigger id="marital_status">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" /> Address
                  </Label>
                  <Input
                    id="address"
                    placeholder="City, State"
                    value={form.address}
                    onChange={(e) => set("address")(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photo_url" className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5" /> Profile Photo URL
                  </Label>
                  <Input
                    id="photo_url"
                    type="url"
                    placeholder="https://..."
                    value={form.profile_photo_url}
                    onChange={(e) => set("profile_photo_url")(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep("otp")}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                  </Button>
                  <Button variant="gradient" className="flex-1" disabled={loading} onClick={handleRegister}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {loading ? "Creating..." : "Create Account"}
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Success */}
          {step === "success" && (
            <CardContent className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto animate-fade-in">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Welcome aboard!</h2>
              <p className="text-muted-foreground">
                Your account has been created. Redirecting you to verification status...
              </p>
              <Loader2 className="h-5 w-5 text-primary animate-spin mx-auto" />
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
