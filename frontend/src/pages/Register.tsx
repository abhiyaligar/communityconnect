import { useState, useEffect } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import api from "@/lib/api"
import { handleApiError, getImageUrl } from "@/lib/utils"
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
  region_id: string
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

  const location = useLocation()
  const [step, setStep] = useState<Step>((location.state?.step as Step) || "email")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [countdown, setCountdown] = useState(0)

  const handleGoogleSignup = async () => {
    setGoogleLoading(true)
    setError("")
    try {
      const res = await api.get("/auth/google/url")
      window.location.href = res.data.url
    } catch (err: unknown) {
      setError(handleApiError(err, "Failed to get Google authorization link."))
      setGoogleLoading(false)
    }
  }


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
    region_id: "",
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

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > 20 * 1024 * 1024) {
      setError("Image file is too large. Maximum size is 20MB.")
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    
    setError("")
    setLoading(true)
    try {
      const res = await api.post("/uploads/image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      setForm((f) => ({ ...f, profile_photo_url: res.data.url }))
    } catch (err: any) {
      setError(handleApiError(err, "Failed to upload image."))
    } finally {
      setLoading(false)
    }
  }

  const [regions, setRegions] = useState<any[]>([])

  // Load regions when on the core onboarding step
  useEffect(() => {
    if (step === "core") {
      api.get("/admin/regions?limit=100")
        .then((res) => setRegions(res.data))
        .catch((err) => console.error("Failed to load regions", err))
    }
  }, [step])

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
    if (!form.full_name || !form.date_of_birth || !form.gender || !form.phone_number || !form.region_id) {
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
        region_id: form.region_id || undefined,
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">

      <div className="w-full max-w-xl relative z-10">
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center group-hover:opacity-90 transition-opacity">
              <Users className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-foreground">CommunityConnect</span>
          </Link>
        </div>

        <Card className="border border-border shadow-sm bg-card">
          {/* STEP 1: Email & Password */}
          {step === "email" && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-6 w-6 text-foreground" />
                </div>
                <CardTitle className="text-xl">Create Account</CardTitle>
                <CardDescription className="text-xs">Enter your email and password to begin.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={form.email}
                      onChange={(e) => setF("email")(e.target.value)}
                      className="h-10 bg-background border-border"
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
                      className="h-10 bg-background border-border"
                      required
                    />
                  </div>
                  {error && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}
                  <Button type="submit" size="lg" className="w-full h-10 gap-2 mt-4" disabled={loading || googleLoading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {loading ? "Sending OTP..." : "Continue"}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </Button>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-border"></div>
                    <span className="flex-shrink mx-4 text-muted-foreground text-xs uppercase font-medium tracking-wider">
                      or continue with
                    </span>
                    <div className="flex-grow border-t border-border"></div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full h-10 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-secondary/40 transition-colors"
                    onClick={handleGoogleSignup}
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
                <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="h-6 w-6 text-foreground" />
                </div>
                <CardTitle className="text-xl">Verify Email</CardTitle>
                <CardDescription className="text-xs">We sent a 6-digit code to {form.email}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
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
                      className="h-12 text-2xl text-center font-mono tracking-[0.5em] bg-background border-border"
                      required
                    />
                  </div>
                  {error && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}
                  <Button type="submit" size="lg" className="w-full h-10 mt-2" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Verify & Continue"}
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
                <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center mx-auto mb-4">
                  <User className="h-6 w-6 text-foreground" />
                </div>
                <CardTitle className="text-xl">Your Profile</CardTitle>
                <CardDescription className="text-xs">Tell us a bit about yourself.</CardDescription>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Region / Area *</Label>
                      <Select value={form.region_id} onValueChange={setF("region_id")} required>
                        <SelectTrigger className="w-full bg-background border-border text-foreground"><SelectValue placeholder="Select Area" /></SelectTrigger>
                        <SelectContent className="bg-white text-[#0f172a] border border-[#e2e8f0]">
                          {regions.map((reg) => (
                            <SelectItem key={reg.id} value={reg.id}>
                              {reg.name} ({reg.pin_code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Current Location / Address *</Label>
                      <Input placeholder="City, State" value={form.address} onChange={(e) => setF("address")(e.target.value)} required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Profile Photo (Optional)</Label>
                    <div className="flex items-center gap-4">
                      {form.profile_photo_url ? (
                        <img
                          src={getImageUrl(form.profile_photo_url)}
                          alt="Profile Preview"
                          className="w-12 h-12 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] text-muted-foreground font-semibold">
                          No Photo
                        </div>
                      )}
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          onChange={handleProfilePhotoUpload}
                          className="h-10 bg-background border-border cursor-pointer text-xs"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Button type="submit" className="w-full h-10 text-xs">
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
                <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6 text-foreground" />
                </div>
                <CardTitle className="text-xl">Matrimony (Optional)</CardTitle>
                <CardDescription className="text-xs">Find your perfect life partner within the community.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleOnboard} className="space-y-6">
                  
                  <div className="flex items-center space-x-3 p-3.5 rounded-lg border border-border bg-secondary/35">
                    <Checkbox id="create_matrimony" checked={form.create_matrimony} onCheckedChange={(c) => setF("create_matrimony")(!!c)} />
                    <Label htmlFor="create_matrimony" className="font-semibold cursor-pointer text-sm text-foreground">
                      Yes, create my Matrimony Profile
                    </Label>
                  </div>

                  {form.create_matrimony && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                      <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Quick Details</h3>
                      
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

                  {error && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" className="flex-1 h-10 text-xs" onClick={() => setStep("core")}>
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <Button type="submit" className="flex-1 h-10 text-xs" disabled={loading}>
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
            <CardContent className="py-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-foreground" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold tracking-tight">Welcome aboard!</h2>
                <p className="text-sm text-muted-foreground">
                  Your profile has been created.
                </p>
              </div>
              <div className="pt-2">
                <Loader2 className="h-6 w-6 text-foreground animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground mt-3">Redirecting...</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
