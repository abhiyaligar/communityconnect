import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import api from "@/lib/api"
import { handleApiError } from "@/lib/utils"
import { Users, Mail, ShieldCheck, User, ArrowRight, ArrowLeft, Loader2, CheckCircle, Heart } from "lucide-react"
import { TokenResponse } from "@/types"

type Step = "email" | "otp" | "core" | "matrimony" | "success"

interface FormData {
  // Auth
  email: string
  password: string
  code: string

  // Core Profile
  full_name: string
  date_of_birth: string
  gender: string
  marital_status: string
  phone_number: string
  address: string
  profile_photo_url: string

  // Matrimony
  create_matrimony: boolean
  height_cm: string
  highest_qualification: string
  employment_type: string
  job_title: string
  income_range: string
  work_location: string
  gotra: string
  manglik_status: string
  diet: string
}

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>("email")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [countdown, setCountdown] = useState(0)

  const [form, setForm] = useState<FormData>({
    email: "",
    password: "",
    code: "",
    full_name: "",
    date_of_birth: "",
    gender: "",
    marital_status: "single",
    phone_number: "",
    address: "",
    profile_photo_url: "",
    create_matrimony: false,
    height_cm: "",
    highest_qualification: "",
    employment_type: "",
    job_title: "",
    income_range: "",
    work_location: "",
    gotra: "",
    manglik_status: "",
    diet: "",
  })

  const setF = (field: keyof FormData) => (val: string | boolean) =>
    setForm((f) => ({ ...f, [field]: val }))

  const startCountdown = () => {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((c) => { if (c <= 1) { clearInterval(timer); return 0 } return c - 1 })
    }, 1000)
  }

  // --- API Handlers ---

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!form.email || !form.password) {
      setError("Email and password are required.")
      return
    }
    setError("")
    setLoading(true)
    try {
      await api.post("/auth/register/email", { email: form.email, password: form.password })
      setStep("otp")
      startCountdown()
    } catch (err: unknown) {
      setError(handleApiError(err, "Failed to send OTP."))
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.code.length !== 6) { setError("Enter the 6-digit code."); return }
    setError("")
    setLoading(true)
    try {
      const res = await api.post<TokenResponse>("/auth/register/verify-email", {
        email: form.email,
        code: form.code,
        password: form.password,
      })
      // We are now authenticated (role: unverified), but need to onboard
      localStorage.setItem("access_token", res.data.access_token)
      setStep("core")
    } catch (err: unknown) {
      setError(handleApiError(err, "Invalid code."))
    } finally {
      setLoading(false)
    }
  }

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name || !form.date_of_birth || !form.gender || !form.phone_number) {
      setError("Please fill in all required core fields.")
      return
    }
    setError("")
    setLoading(true)
    try {
      // Submit the massive payload to /profiles/onboard
      await api.post("/profiles/onboard", {
        full_name: form.full_name,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        marital_status: form.marital_status,
        phone_number: form.phone_number,
        address: form.address || "Not provided",
        profile_photo_url: form.profile_photo_url || undefined,
        create_matrimony: form.create_matrimony,
        // Optional Matrimony data
        height_cm: form.height_cm || undefined,
        highest_qualification: form.highest_qualification || undefined,
        employment_type: form.employment_type || undefined,
        job_title: form.job_title || undefined,
        income_range: form.income_range || undefined,
        work_location: form.work_location || undefined,
        gotra: form.gotra || undefined,
        manglik_status: form.manglik_status || undefined,
        diet: form.diet || undefined,
      })
      
      // Update AuthContext and redirect
      // We re-fetch /profiles/me to get the newly created profile data
      const token = localStorage.getItem("access_token") || ""
      await login(token, "unknown", "unverified") 
      
      setStep("success")
      setTimeout(() => navigate("/pending-verification"), 2000)
    } catch (err: unknown) {
      setError(handleApiError(err, "Onboarding failed."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[80px]" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
              <Users className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight">CommunityConnect</span>
          </Link>
        </div>

        <Card className="glass-card border-white/10 shadow-2xl backdrop-blur-xl">
          {/* STEP 1: Email & Password */}
          {step === "email" && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="w-14 h-14 rounded-2xl glass border border-primary/30 flex items-center justify-center mx-auto mb-4 bg-primary/5">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-2xl">Create Account</CardTitle>
                <CardDescription>Enter your email and password to begin.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={form.email}
                      onChange={(e) => setF("email")(e.target.value)}
                      className="h-12 bg-background/50 border-white/10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setF("password")(e.target.value)}
                      className="h-12 bg-background/50 border-white/10"
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}
                  <Button type="submit" variant="gradient" size="lg" className="w-full h-12 gap-2 mt-4" disabled={loading}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                    {loading ? "Sending OTP..." : "Continue"}
                    {!loading && <ArrowRight className="h-5 w-5" />}
                  </Button>
                </form>
                <p className="text-center text-sm text-muted-foreground mt-6">
                  Already a member? <Link to="/login" className="text-primary hover:underline font-semibold">Sign in</Link>
                </p>
              </CardContent>
            </>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {step === "otp" && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="w-14 h-14 rounded-2xl glass border border-primary/30 flex items-center justify-center mx-auto mb-4 bg-primary/5">
                  <ShieldCheck className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-2xl">Verify Email</CardTitle>
                <CardDescription>We sent a 6-digit code to {form.email}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="code">Verification Code</Label>
                    <Input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      placeholder="000000"
                      maxLength={6}
                      value={form.code}
                      onChange={(e) => setF("code")(e.target.value.replace(/\D/g, ""))}
                      className="h-14 text-3xl text-center font-mono tracking-[0.5em] bg-background/50 border-white/10"
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}
                  <Button type="submit" variant="gradient" size="lg" className="w-full h-12 mt-2" disabled={loading}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Verify & Continue"}
                  </Button>
                  <div className="flex items-center justify-between text-sm mt-4">
                    <button type="button" onClick={() => { setStep("email"); setError("") }} className="text-muted-foreground hover:text-foreground flex items-center gap-1">
                      <ArrowLeft className="h-4 w-4" /> Change email
                    </button>
                    <button type="button" disabled={countdown > 0} onClick={handleSendOtp} className="text-primary hover:underline font-medium disabled:opacity-50">
                      {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
                    </button>
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {/* STEP 3: CORE PROFILE */}
          {step === "core" && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="w-14 h-14 rounded-2xl glass border border-primary/30 flex items-center justify-center mx-auto mb-4 bg-primary/5">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-2xl">Your Profile</CardTitle>
                <CardDescription>Tell us a bit about yourself.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <form onSubmit={(e) => { e.preventDefault(); setStep("matrimony") }} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input value={form.full_name} onChange={(e) => setF("full_name")(e.target.value)} required />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date of Birth *</Label>
                      <Input type="date" value={form.date_of_birth} onChange={(e) => setF("date_of_birth")(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender *</Label>
                      <Select value={form.gender} onValueChange={setF("gender")} required>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Marital Status *</Label>
                      <Select value={form.marital_status} onValueChange={setF("marital_status")} required>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="divorced">Divorced</SelectItem>
                          <SelectItem value="widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number *</Label>
                      <Input type="tel" placeholder="+91..." value={form.phone_number} onChange={(e) => setF("phone_number")(e.target.value)} required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Current Location / Address *</Label>
                    <Input placeholder="City, State" value={form.address} onChange={(e) => setF("address")(e.target.value)} required />
                  </div>
                  
                  <div className="pt-2">
                    <Button type="submit" variant="gradient" className="w-full h-11">
                      Next Step <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {/* STEP 4: MATRIMONY & SUBMIT */}
          {step === "matrimony" && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="w-14 h-14 rounded-2xl glass border border-primary/30 flex items-center justify-center mx-auto mb-4 bg-primary/5">
                  <Heart className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-2xl">Matrimony (Optional)</CardTitle>
                <CardDescription>Find your perfect life partner within the community.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleOnboard} className="space-y-6">
                  
                  <div className="flex items-center space-x-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
                    <Checkbox id="create_matrimony" checked={form.create_matrimony} onCheckedChange={(c) => setF("create_matrimony")(!!c)} />
                    <Label htmlFor="create_matrimony" className="font-semibold cursor-pointer text-base">
                      Yes, create my Matrimony Profile
                    </Label>
                  </div>

                  {form.create_matrimony && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                      <h3 className="font-medium text-sm text-primary uppercase tracking-wider">Quick Details</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Height (cm)</Label>
                          <Input type="number" placeholder="175" value={form.height_cm} onChange={(e) => setF("height_cm")(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Gotra</Label>
                          <Input placeholder="e.g. Kashyap" value={form.gotra} onChange={(e) => setF("gotra")(e.target.value)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Education</Label>
                          <Select value={form.highest_qualification} onValueChange={setF("highest_qualification")}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bachelors">Bachelor's</SelectItem>
                              <SelectItem value="masters">Master's</SelectItem>
                              <SelectItem value="doctorate">Doctorate</SelectItem>
                              <SelectItem value="diploma">Diploma</SelectItem>
                              <SelectItem value="high_school">High School</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Employment</Label>
                          <Select value={form.employment_type} onValueChange={setF("employment_type")}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="employed">Employed</SelectItem>
                              <SelectItem value="self_employed">Self Employed</SelectItem>
                              <SelectItem value="business">Business</SelectItem>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="not_working">Not Working</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        You can add more details (horoscope, family, photos) later from your dashboard.
                      </p>
                    </div>
                  )}

                  {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setStep("core")}>
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <Button type="submit" variant="gradient" className="flex-1 h-11" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {loading ? "Submitting..." : "Complete Setup"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {/* STEP 5: SUCCESS */}
          {step === "success" && (
            <CardContent className="py-16 text-center space-y-5">
              <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto animate-in zoom-in duration-500 shadow-xl shadow-primary/30">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Welcome aboard!</h2>
                <p className="text-muted-foreground text-lg">
                  Your profile has been created.
                </p>
              </div>
              <div className="pt-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground mt-4">Redirecting...</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
