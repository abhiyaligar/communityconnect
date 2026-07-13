import { useState, useEffect, useRef } from "react"
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
import { Mail, ShieldCheck, User, ArrowRight, ArrowLeft, Loader2, CheckCircle, Lock, Briefcase, Users, Star } from "lucide-react"
import { TokenResponse } from "@/types"

type Step = "email" | "otp" | "core-personal" | "core-address" | "core-id" | "matrimony-1" | "matrimony-2" | "matrimony-3" | "success"

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
  aadhar_number: string
  aadhar_card_url: string

  // Social Links
  linkedin: string
  instagram: string
  facebook: string
  twitter: string

  // Matrimony
  create_matrimony: boolean
  height_cm: string
  highest_qualification: string
  employment_type: string
  job_title: string
  company_name: string
  income_range: string
  work_location: string
  gotra: string
  sub_caste: string
  rashi: string
  nakshatra: string
  manglik_status: string
  birth_time: string
  birth_place: string
  father_name: string
  father_occupation: string
  mother_name: string
  mother_occupation: string
  family_type: string
  family_values: string
  family_financial_status: string
  diet: string
}

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const location = useLocation()
  const [step, setStep] = useState<Step>((location.state?.step as Step) || "email")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [countdown, setCountdown] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    aadhar_number: "",
    aadhar_card_url: "",
    linkedin: "",
    instagram: "",
    facebook: "",
    twitter: "",
    create_matrimony: false,
    height_cm: "",
    highest_qualification: "",
    employment_type: "",
    job_title: "",
    company_name: "",
    income_range: "",
    work_location: "",
    gotra: "",
    sub_caste: "",
    rashi: "",
    nakshatra: "",
    manglik_status: "",
    birth_time: "",
    birth_place: "",
    father_name: "",
    father_occupation: "",
    mother_name: "",
    mother_occupation: "",
    family_type: "",
    family_values: "",
    family_financial_status: "",
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
    if (step.startsWith("core")) {
      api.get("/admin/regions?limit=100")
        .then((res) => setRegions(res.data))
        .catch((err) => console.error("Failed to load regions", err))
    }
  }, [step])

  // If user is already authenticated but profile doesn't exist, jump directly to core onboarding step
  useEffect(() => {
    const checkActiveSession = async () => {
      const token = localStorage.getItem("access_token")
      if (!token) return

      try {
        const res = await api.get("/profiles/me")
        // If profile exists, they should go to dashboard
        if (res.data.role === "community_admin" || res.data.role === "local_admin") {
          navigate("/admin/dashboard", { replace: true })
        } else if (res.data.role === "unverified") {
          navigate("/pending-verification", { replace: true })
        } else {
          navigate("/dashboard", { replace: true })
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Token exists but no profile, load the core step directly
          setStep("core-personal")
        }
      }
    }
    checkActiveSession()
  }, [navigate])


  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCountdown = () => {
    setCountdown(60)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCountdown((c) => { if (c <= 1) { if (timerRef.current) clearInterval(timerRef.current); timerRef.current = null; return 0 } return c - 1 })
    }, 1000)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

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
      setStep("core-personal")
    } catch (err: unknown) {
      setError(handleApiError(err, "Invalid code."))
    } finally {
      setLoading(false)
    }
  }

  const handleNextToAddress = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name || !form.date_of_birth || !form.gender || !form.phone_number) {
      setError("Please fill in all required fields.")
      return
    }
    setError("")
    setStep("core-address")
  }

  const handleNextToId = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.region_id) {
      setError("Please select your region/area.")
      return
    }
    if (!form.profile_photo_url || form.profile_photo_url === "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde") {
      setError("A profile photo upload is compulsory. Please upload a photo to proceed.")
      return
    }
    setError("")
    setStep("core-id")
  }

  const handleNextToMatrimony = (e: React.FormEvent) => {
    e.preventDefault()

    const hasSocial = form.linkedin?.trim() || form.instagram?.trim() || form.facebook?.trim() || form.twitter?.trim()
    if (!hasSocial) {
      setError("At least one social media link (LinkedIn, Instagram, Facebook, or Twitter) is compulsory.")
      return
    }

    // Validate Aadhar
    if (!form.aadhar_number || form.aadhar_number.length !== 12) {
      setError("Aadhar number must be exactly 12 digits.")
      return
    }
    if (!form.aadhar_card_url) {
      setError("Aadhar card image upload is compulsory.")
      return
    }

    if (form.marital_status === "married") {
      handleOnboard(e)
      return
    }

    setError("")
    setStep("matrimony-1")
  }

  const handleNextToMatrimony2 = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setStep("matrimony-2")
  }

  const handleNextToMatrimony3 = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setStep("matrimony-3")
  }

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name || !form.date_of_birth || !form.gender || !form.phone_number || !form.region_id) {
      setError("Please fill in all required core fields.")
      return
    }

    // Double check social link counts
    const hasSocial = form.linkedin?.trim() || form.instagram?.trim() || form.facebook?.trim() || form.twitter?.trim();
    if (!hasSocial) {
      setError("At least one social media link is compulsory.")
      return
    }

    // Double check LinkedIn rule for active employment
    const isEmployed = form.create_matrimony && ["employed", "self_employed", "business"].includes(form.employment_type);
    if (isEmployed && (!form.linkedin || !form.linkedin.trim() || !form.linkedin.toLowerCase().includes("linkedin.com"))) {
      setError("LinkedIn profile URL is compulsory for employed, self-employed, or business candidates.")
      return
    }

    // Double check photo upload
    if (!form.profile_photo_url || form.profile_photo_url === "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde") {
      setError("A profile photo upload is compulsory.")
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
        aadhar_number: form.aadhar_number,
        aadhar_card_url: form.aadhar_card_url,
        create_matrimony: form.create_matrimony,
        social_links: {
          linkedin: form.linkedin?.trim() || undefined,
          instagram: form.instagram?.trim() || undefined,
          facebook: form.facebook?.trim() || undefined,
          twitter: form.twitter?.trim() || undefined
        },
        // Optional Matrimony data
        height_cm: form.height_cm || undefined,
        highest_qualification: form.highest_qualification || undefined,
        employment_type: form.employment_type || undefined,
        job_title: form.job_title || undefined,
        company_name: form.company_name || undefined,
        income_range: form.income_range || undefined,
        work_location: form.work_location || undefined,
        gotra: form.gotra || undefined,
        sub_caste: form.sub_caste || undefined,
        rashi: form.rashi || undefined,
        nakshatra: form.nakshatra || undefined,
        manglik_status: form.manglik_status || undefined,
        birth_time: form.birth_time || undefined,
        birth_place: form.birth_place || undefined,
        father_name: form.father_name || undefined,
        father_occupation: form.father_occupation || undefined,
        mother_name: form.mother_name || undefined,
        mother_occupation: form.mother_occupation || undefined,
        family_type: form.family_type || undefined,
        family_values: form.family_values || undefined,
        family_financial_status: form.family_financial_status || undefined,
        diet: form.diet || undefined,
      })
      
      // Update AuthContext and redirect
      // We re-fetch /profiles/me to get the newly created profile data
      const token = localStorage.getItem("access_token") || ""
      await login(token, "unknown", "unverified") 
      
      setStep("success")
      const goTo = (form.marital_status === "single" && form.create_matrimony) ? "/preferences" : "/pending-verification"
      setTimeout(() => navigate(goTo), 2000)
    } catch (err: unknown) {
      setError(handleApiError(err, "Onboarding failed."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 sm:px-6 sm:py-12 relative overflow-hidden transition-colors duration-300">
      {/* Simple Background */}
      <div className="absolute inset-0 bg-background -z-10" />

      <div className="w-full max-w-xl relative z-10">
        <div className="flex flex-col items-center mb-8 sm:mb-10 text-center stagger-fade-in-1">
          <Link to="/" className="flex flex-col items-center group">
            <div className="w-14 h-14 rounded-2xl border border-border/80 bg-card/60 flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-300 backdrop-blur-md">
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
              Lad Matrimony
            </span>
          </Link>
        </div>

        <Card className="w-full border-0 bg-transparent shadow-none p-0 sm:border sm:border-border sm:bg-card sm:shadow-sm sm:p-6 transition-all duration-300 stagger-fade-in-2">
          {/* STEP 1: Email & Password */}
          {step === "email" && (
            <>
              <CardHeader className="text-left sm:text-center pb-2 px-0 pt-0 sm:px-6 sm:pt-6">
                <div className="w-12 h-12 rounded-full border bg-secondary border-border text-foreground flex items-center justify-center mx-auto mb-4 hidden sm:flex">
                  <Mail className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Create Account</CardTitle>
                <CardDescription className="text-xs">Enter your email and password to begin.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 px-0 pb-0 sm:px-6 sm:pb-6">
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2 stagger-fade-in-3">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-0 sm:left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/85 block sm:hidden" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={form.email}
                        onChange={(e) => setF("email")(e.target.value)}
                        className="pl-10 pr-0 h-11 bg-transparent border-0 border-b border-border rounded-none text-xs placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 transition-all duration-200 sm:pl-4 sm:pr-4 sm:h-10 sm:bg-background sm:border sm:border-border sm:rounded-md"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2 stagger-fade-in-3">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-0 sm:left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/85 block sm:hidden" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => setF("password")(e.target.value)}
                        className="pl-10 pr-0 h-11 bg-transparent border-0 border-b border-border rounded-none text-xs placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 transition-all duration-200 sm:pl-4 sm:pr-4 sm:h-10 sm:bg-background sm:border sm:border-border sm:rounded-md"
                        required
                      />
                    </div>
                  </div>
                  {error && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}
                  
                  <div className="stagger-fade-in-4 space-y-4 pt-2">
                    <Button type="submit" size="lg" className="w-full h-11 sm:h-10 gap-2 hover-scale cursor-pointer" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {loading ? "Sending OTP..." : "Continue"}
                      {!loading && <ArrowRight className="h-4 w-4" />}
                    </Button>


                  </div>
                </form>
                <p className="text-center text-sm text-muted-foreground mt-6 stagger-fade-in-4">
                  Already a member? <Link to="/login" className="text-primary hover:underline font-semibold">Sign in</Link>
                </p>
              </CardContent>
            </>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {step === "otp" && (
            <>
              <CardHeader className="text-left sm:text-center pb-2 px-0 pt-0 sm:px-6 sm:pt-6">
                <div className="w-12 h-12 rounded-full border bg-secondary border-border text-foreground flex items-center justify-center mx-auto mb-4 hidden sm:flex">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Verify Email</CardTitle>
                <CardDescription className="text-xs">We sent a 6-digit code to {form.email}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 px-0 pb-0 sm:px-6 sm:pb-6">
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
                      className="h-12 text-2xl text-center font-mono tracking-[0.5em] bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:h-12 sm:bg-background sm:border sm:border-border sm:rounded-md"
                      required
                    />
                  </div>
                  {error && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}
                  <Button type="submit" size="lg" className="w-full h-11 sm:h-10 mt-2 cursor-pointer" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Verify & Continue"}
                  </Button>
                  <div className="flex items-center justify-between text-sm mt-4">
                    <button type="button" onClick={() => { setStep("email"); setError("") }} className="text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer bg-transparent border-0">
                      <ArrowLeft className="h-4 w-4" /> Change email
                    </button>
                    <button type="button" disabled={countdown > 0} onClick={handleSendOtp} className="text-primary hover:underline font-medium disabled:opacity-50 cursor-pointer bg-transparent border-0">
                      {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
                    </button>
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {/* STEP 3: PERSONAL INFO */}
          {step === "core-personal" && (
            <>
              <CardHeader className="text-left sm:text-center pb-2 px-0 pt-0 sm:px-6 sm:pt-6">
                <div className="w-12 h-12 rounded-full border bg-secondary border-border text-foreground flex items-center justify-center mx-auto mb-4 hidden sm:flex">
                  <User className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Personal Details</CardTitle>
                <CardDescription className="text-xs">Step 1 of 3 — Your basic information.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 px-0 pb-0 sm:px-6 sm:pb-6">
                <form onSubmit={handleNextToAddress} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input 
                      value={form.full_name} 
                      onChange={(e) => setF("full_name")(e.target.value)} 
                      className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3"
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Date of Birth *</Label>
                    <Input 
                      type="date" 
                      value={form.date_of_birth} 
                      onChange={(e) => setF("date_of_birth")(e.target.value)} 
                      className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-left w-full block"
                      required 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Gender *</Label>
                    <Select value={form.gender} onValueChange={setF("gender")} required>
                      <SelectTrigger className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Marital Status *</Label>
                    <Select value={form.marital_status} onValueChange={setF("marital_status")} required>
                      <SelectTrigger className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3"><SelectValue placeholder="Select" /></SelectTrigger>
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
                    <div className="relative flex items-center">
                      <span className="text-xs font-semibold text-muted-foreground mr-2 select-none border-b border-border h-10 flex items-center px-1 sm:px-2 bg-transparent sm:bg-secondary/45 sm:border sm:rounded-l-md sm:border-r-0 shrink-0">
                        +91
                      </span>
                      <Input 
                        type="tel" 
                        placeholder="9876543210" 
                        value={form.phone_number.startsWith("+91") ? form.phone_number.slice(3) : form.phone_number} 
                        onChange={(e) => {
                          const rawVal = e.target.value.replace(/\D/g, "");
                          const limitedVal = rawVal.slice(0, 10);
                          setForm((f) => ({ ...f, phone_number: limitedVal ? `+91${limitedVal}` : "" }));
                        }} 
                        className="flex-1 bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-r-md sm:rounded-l-none h-10 px-0 sm:px-3"
                        required 
                      />
                    </div>
                  </div>

                  {error && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}

                  <div className="pt-2 flex gap-3">
                    <Button type="button" variant="outline" className="flex-1 h-11 sm:h-10 text-xs" onClick={() => { setStep("otp"); setError("") }}>
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <Button type="submit" className="flex-1 h-11 sm:h-10 text-xs cursor-pointer hover-scale">
                      Continue <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {/* STEP 4: ADDRESS & PHOTO */}
          {step === "core-address" && (
            <>
              <CardHeader className="text-left sm:text-center pb-2 px-0 pt-0 sm:px-6 sm:pt-6">
                <div className="w-12 h-12 rounded-full border bg-secondary border-border text-foreground flex items-center justify-center mx-auto mb-4 hidden sm:flex">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <CardTitle className="text-xl">Location & Photo</CardTitle>
                <CardDescription className="text-xs">Step 2 of 3 — Where you're from and your profile picture.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 px-0 pb-0 sm:px-6 sm:pb-6">
                <form onSubmit={handleNextToId} className="space-y-5">
                  {/* Profile Photo Upload */}
                  <div className="flex flex-col items-center justify-center pb-6 border-b border-border/40">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      {form.profile_photo_url ? (
                        <img
                          src={getImageUrl(form.profile_photo_url)}
                          alt="Profile Preview"
                          className="w-24 h-24 rounded-full object-cover border-2 border-border shadow-md group-hover:opacity-85 transition-opacity"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-secondary border border-border flex flex-col items-center justify-center text-muted-foreground shadow-inner group-hover:bg-muted transition-colors">
                          <User className="h-8 w-8 opacity-65 mb-1" />
                          <span className="text-[10px] font-bold">Add Photo</span>
                        </div>
                      )}
                      <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md border-2 border-background group-hover:scale-105 transition-transform duration-200">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handleProfilePhotoUpload}
                      className="hidden"
                      disabled={loading}
                    />
                    {loading && <p className="text-[10px] text-muted-foreground mt-2 animate-pulse font-medium">Uploading photo...</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Region / Area *</Label>
                    <Select value={form.region_id} onValueChange={setF("region_id")} required>
                      <SelectTrigger className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3"><SelectValue placeholder="Select Area" /></SelectTrigger>
                      <SelectContent>
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
                    <Input 
                      placeholder="Current Address" 
                      value={form.address} 
                      onChange={(e) => setF("address")(e.target.value)} 
                      className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3"
                      required 
                    />
                  </div>

                  {error && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}

                  <div className="pt-2 flex gap-3">
                    <Button type="button" variant="outline" className="flex-1 h-11 sm:h-10 text-xs" onClick={() => { setStep("core-personal"); setError("") }}>
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <Button type="submit" className="flex-1 h-11 sm:h-10 text-xs cursor-pointer hover-scale">
                      Continue <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {/* STEP 5: ID VERIFICATION & SOCIAL */}
          {step === "core-id" && (
            <>
              <CardHeader className="text-left sm:text-center pb-2 px-0 pt-0 sm:px-6 sm:pt-6">
                <div className="w-12 h-12 rounded-full border bg-secondary border-border text-foreground flex items-center justify-center mx-auto mb-4 hidden sm:flex">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Identity & Social</CardTitle>
                <CardDescription className="text-xs">Step 3 of 3 — Verify your identity and add social links.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 px-0 pb-0 sm:px-6 sm:pb-6">
                <form onSubmit={handleNextToMatrimony} className="space-y-5">
                  {/* Aadhar Number */}
                  <div className="space-y-2">
                    <Label>Aadhar Number *</Label>
                    <Input 
                      type="text"
                      inputMode="numeric"
                      placeholder="1234 5678 9012"
                      value={form.aadhar_number.replace(/(\d{4})(?=\d)/g, "$1 ").trim()}
                      onChange={(e) => {
                        const rawVal = e.target.value.replace(/\D/g, "");
                        const limitedVal = rawVal.slice(0, 12);
                        setForm((f) => ({ ...f, aadhar_number: limitedVal }));
                      }}
                      className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 font-mono tracking-wider"
                      required
                    />
                    {form.aadhar_number.length > 0 && form.aadhar_number.length < 12 && (
                      <p className="text-[10px] text-amber-600">Aadhar must be 12 digits</p>
                    )}
                    <p className="text-[10px] text-muted-foreground">Your Aadhar details will be deleted 8 days after verification.</p>
                  </div>

                  {/* Aadhar Card Upload */}
                  <div className="space-y-2">
                    <Label>Aadhar Card Image *</Label>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("aadhar-upload")?.click()}
                        disabled={loading}
                        className="text-xs h-9"
                      >
                        {form.aadhar_card_url ? "Change Image" : "Upload Image"}
                      </Button>
                      {form.aadhar_card_url && (
                        <span className="text-[10px] text-green-600 font-medium">Uploaded</span>
                      )}
                    </div>
                    <input
                      id="aadhar-upload"
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={async (e) => {
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
                          setForm((f) => ({ ...f, aadhar_card_url: res.data.url }))
                        } catch (err: any) {
                          setError(handleApiError(err, "Failed to upload aadhar card image."))
                        } finally {
                          setLoading(false)
                        }
                      }}
                      className="hidden"
                      disabled={loading}
                    />
                    <p className="text-[10px] text-muted-foreground">Upload a clear image of your Aadhar card. This is mandatory for verification.</p>
                  </div>

                  {/* Social Media Links */}
                  <div className="space-y-4 pt-2 border-t border-border/40">
                    <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Social Media (Add at least one)</h3>
                    
                    <div className="space-y-2">
                      <Label>LinkedIn Profile URL (Mandatory if employed)</Label>
                      <Input 
                        placeholder="https://www.linkedin.com/in/username" 
                        value={form.linkedin} 
                        onChange={(e) => setF("linkedin")(e.target.value)} 
                        className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Instagram Profile URL</Label>
                      <Input 
                        placeholder="https://www.instagram.com/username" 
                        value={form.instagram} 
                        onChange={(e) => setF("instagram")(e.target.value)} 
                        className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Facebook URL</Label>
                        <Input 
                          placeholder="https://facebook.com/username" 
                          value={form.facebook} 
                          onChange={(e) => setF("facebook")(e.target.value)} 
                          className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Twitter / X URL</Label>
                        <Input 
                          placeholder="https://x.com/username" 
                          value={form.twitter} 
                          onChange={(e) => setF("twitter")(e.target.value)} 
                          className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {error && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}

                  <div className="pt-2 flex gap-3">
                    <Button type="button" variant="outline" className="flex-1 h-11 sm:h-10 text-xs" onClick={() => { setStep("core-address"); setError("") }}>
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <Button type="submit" className="flex-1 h-11 sm:h-10 text-xs cursor-pointer hover-scale">
                      {form.marital_status === "married" ? "Submit" : "Next: Matrimony"} <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    {form.marital_status !== "married" && (
                      <Button type="button" variant="ghost" className="text-xs text-muted-foreground" onClick={handleOnboard}>
                        Skip Matrimony
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {/* STEP 6: MATRIMONY - PERSONAL & PROFESSIONAL */}
          {step === "matrimony-1" && (
            <>
              <CardHeader className="text-left sm:text-center pb-2 px-0 pt-0 sm:px-6 sm:pt-6">
                <div className="w-12 h-12 rounded-full border bg-secondary border-border text-foreground flex items-center justify-center mx-auto mb-4 hidden sm:flex">
                  <Briefcase className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Matrimony Profile</CardTitle>
                <CardDescription className="text-xs">Step 1 of 3 — Personal & professional details.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 px-0 pb-0 sm:px-6 sm:pb-6">
                <form onSubmit={handleNextToMatrimony2} className="space-y-6">
                  
                  <div className="flex items-center space-x-3 p-3.5 rounded-lg border border-border bg-secondary/35">
                    <Checkbox id="create_matrimony" checked={form.create_matrimony} onCheckedChange={(c) => setF("create_matrimony")(!!c)} />
                    <Label htmlFor="create_matrimony" className="font-semibold cursor-pointer text-sm text-foreground">
                      Yes, create my Matrimony Profile
                    </Label>
                  </div>

                  {form.create_matrimony && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                      <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Personal & Professional</h3>
                      
                      <div className="space-y-2">
                        <Label>Height (cm) *</Label>
                        <Input 
                          type="number" 
                          placeholder="175" 
                          value={form.height_cm} 
                          onChange={(e) => setF("height_cm")(e.target.value)} 
                          className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-xs"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Education *</Label>
                        <Select value={form.highest_qualification} onValueChange={setF("highest_qualification")} required>
                          <SelectTrigger className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bachelors">Bachelor's</SelectItem>
                            <SelectItem value="masters">Master's</SelectItem>
                            <SelectItem value="doctorate">Doctorate</SelectItem>
                            <SelectItem value="diploma">Diploma</SelectItem>
                            <SelectItem value="high_school">High School</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Employment Status *</Label>
                          <Select value={form.employment_type} onValueChange={setF("employment_type")} required>
                            <SelectTrigger className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="employed">Employed</SelectItem>
                              <SelectItem value="self_employed">Self Employed</SelectItem>
                              <SelectItem value="business">Business</SelectItem>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="not_working">Not Working</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Company * (If employed)</Label>
                          <Input 
                            placeholder="e.g. Google" 
                            value={form.company_name} 
                            onChange={(e) => setF("company_name")(e.target.value)} 
                            className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-xs"
                            required={["employed", "self_employed", "business"].includes(form.employment_type)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Job Title *</Label>
                          <Input 
                            placeholder="e.g. Software Engineer" 
                            value={form.job_title} 
                            onChange={(e) => setForm(f => ({ ...f, job_title: e.target.value }))} 
                            className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-xs"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Work Location *</Label>
                          <Input 
                            placeholder="e.g. Bangalore" 
                            value={form.work_location} 
                            onChange={(e) => setF("work_location")(e.target.value)} 
                            className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-xs"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Annual Income Range *</Label>
                        <Select value={form.income_range} onValueChange={setF("income_range")} required>
                          <SelectTrigger className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="below_3lpa">Below ₹3 LPA</SelectItem>
                            <SelectItem value="3_to_6lpa">₹3 - 6 LPA</SelectItem>
                            <SelectItem value="6_to_10lpa">₹6 - 10 LPA</SelectItem>
                            <SelectItem value="10_to_20lpa">₹10 - 20 LPA</SelectItem>
                            <SelectItem value="above_20lpa">Above ₹20 LPA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {error && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" className="flex-1 h-11 sm:h-10 text-xs cursor-pointer" onClick={() => setStep("core-id")}>
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <Button type="submit" className="flex-1 h-11 sm:h-10 text-xs cursor-pointer">
                      Next <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {/* STEP 7: MATRIMONY - HOROSCOPE & FAMILY */}
          {step === "matrimony-2" && (
            <>
              <CardHeader className="text-left sm:text-center pb-2 px-0 pt-0 sm:px-6 sm:pt-6">
                <div className="w-12 h-12 rounded-full border bg-secondary border-border text-foreground flex items-center justify-center mx-auto mb-4 hidden sm:flex">
                  <Star className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Matrimony Profile</CardTitle>
                <CardDescription className="text-xs">Step 2 of 3 — Horoscope & family background.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 px-0 pb-0 sm:px-6 sm:pb-6">
                <form onSubmit={handleNextToMatrimony3} className="space-y-6">

                  {form.create_matrimony && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                      <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Horoscope & Family</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Gotra *</Label>
                          <Input 
                            placeholder="e.g. Kashyap" 
                            value={form.gotra} 
                            onChange={(e) => setF("gotra")(e.target.value)} 
                            className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-xs"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Sub Caste *</Label>
                          <Input 
                            placeholder="e.g. Shakdwipi" 
                            value={form.sub_caste} 
                            onChange={(e) => setF("sub_caste")(e.target.value)} 
                            className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-xs"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Rashi *</Label>
                          <Select value={form.rashi} onValueChange={setF("rashi")} required>
                            <SelectTrigger className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-xs"><SelectValue placeholder="Select Rashi" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="aries">Mesh (Aries)</SelectItem>
                              <SelectItem value="taurus">Vrishabh (Taurus)</SelectItem>
                              <SelectItem value="gemini">Mithun (Gemini)</SelectItem>
                              <SelectItem value="cancer">Kark (Cancer)</SelectItem>
                              <SelectItem value="leo">Simha (Leo)</SelectItem>
                              <SelectItem value="virgo">Kanya (Virgo)</SelectItem>
                              <SelectItem value="libra">Tula (Libra)</SelectItem>
                              <SelectItem value="scorpio">Vrishchik (Scorpio)</SelectItem>
                              <SelectItem value="sagittarius">Dhanu (Sagittarius)</SelectItem>
                              <SelectItem value="capricorn">Makar (Capricorn)</SelectItem>
                              <SelectItem value="aquarius">Kumbh (Aquarius)</SelectItem>
                              <SelectItem value="pisces">Meen (Pisces)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Nakshatra *</Label>
                          <Input 
                            placeholder="e.g. Ashwini" 
                            value={form.nakshatra} 
                            onChange={(e) => setF("nakshatra")(e.target.value)} 
                            className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-xs"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Manglik Status *</Label>
                        <Select value={form.manglik_status} onValueChange={setF("manglik_status")} required>
                          <SelectTrigger className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manglik">Manglik</SelectItem>
                            <SelectItem value="non_manglik">Non Manglik</SelectItem>
                            <SelectItem value="partial">Anshik (Partial)</SelectItem>
                            <SelectItem value="unknown">Don't Know</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Birth Time *</Label>
                          <BirthTimePicker value={form.birth_time} onChange={setF("birth_time")} />
                        </div>
                        <div className="space-y-2">
                          <Label>Birth Place *</Label>
                          <Input 
                            placeholder="e.g. Hubli" 
                            value={form.birth_place} 
                            onChange={(e) => setF("birth_place")(e.target.value)} 
                            className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-xs"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Father's Name *</Label>
                          <Input 
                            placeholder="Father's Full Name" 
                            value={form.father_name} 
                            onChange={(e) => setF("father_name")(e.target.value)} 
                            className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-xs"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Mother's Name *</Label>
                          <Input 
                            placeholder="Mother's Full Name" 
                            value={form.mother_name} 
                            onChange={(e) => setF("mother_name")(e.target.value)} 
                            className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-xs"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {error && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" className="flex-1 h-11 sm:h-10 text-xs cursor-pointer" onClick={() => setStep("matrimony-1")}>
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <Button type="submit" className="flex-1 h-11 sm:h-10 text-xs cursor-pointer">
                      Next <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {/* STEP 8: MATRIMONY - LIFESTYLE & SUBMIT */}
          {step === "matrimony-3" && (
            <>
              <CardHeader className="text-left sm:text-center pb-2 px-0 pt-0 sm:px-6 sm:pt-6">
                <div className="w-12 h-12 rounded-full border bg-secondary border-border text-foreground flex items-center justify-center mx-auto mb-4 hidden sm:flex">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Matrimony Profile</CardTitle>
                <CardDescription className="text-xs">Step 3 of 3 — Lifestyle & family values.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 px-0 pb-0 sm:px-6 sm:pb-6">
                <form onSubmit={handleOnboard} className="space-y-6">

                  {form.create_matrimony && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                      <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Lifestyle & Family</h3>

                      <div className="space-y-2">
                        <Label>Family Type *</Label>
                        <Select value={form.family_type} onValueChange={setF("family_type")} required>
                          <SelectTrigger className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nuclear">Nuclear</SelectItem>
                            <SelectItem value="joint">Joint</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Family Values *</Label>
                        <Select value={form.family_values} onValueChange={setF("family_values")} required>
                          <SelectTrigger className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="orthodox">Orthodox</SelectItem>
                            <SelectItem value="traditional">Traditional</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="liberal">Liberal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Family Financial Status *</Label>
                        <Select value={form.family_financial_status} onValueChange={setF("family_financial_status")} required>
                          <SelectTrigger className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="upper_class">Upper Class</SelectItem>
                            <SelectItem value="middle_class">Middle Class</SelectItem>
                            <SelectItem value="lower_middle_class">Lower Middle Class</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Diet *</Label>
                        <Select value={form.diet} onValueChange={setF("diet")} required>
                          <SelectTrigger className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vegetarian">Vegetarian</SelectItem>
                            <SelectItem value="non_vegetarian">Non-Vegetarian</SelectItem>
                            <SelectItem value="eggetarian">Eggetarian</SelectItem>
                            <SelectItem value="vegan">Vegan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {error && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" className="flex-1 h-11 sm:h-10 text-xs cursor-pointer" onClick={() => setStep("matrimony-2")}>
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <Button type="submit" className="flex-1 h-11 sm:h-10 text-xs cursor-pointer" disabled={loading}>
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
            <CardContent className="py-12 px-0 sm:px-6 text-center space-y-4">
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

function BirthTimePicker({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const parse = (val: string) => {
    if (!val) return { hour: "", minute: "", period: "" }
    const m = val.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i)
    if (!m) return { hour: "", minute: "", period: "" }
    return { hour: m[1], minute: m[2], period: m[3].toUpperCase() }
  }

  const bt = parse(value)

  const handleChange = (field: "hour" | "minute" | "period", v: string) => {
    const h = field === "hour" ? v : bt.hour
    const m = field === "minute" ? v : bt.minute
    const p = field === "period" ? v : bt.period
    if (h && m && p) {
      onChange(`${h.padStart(2, "0")}:${m} ${p}`)
    } else {
      onChange("")
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1">
        <Select value={bt.hour} onValueChange={(v) => handleChange("hour", v)} required>
          <SelectTrigger className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-xs"><SelectValue placeholder="HH" /></SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((h) => (
              <SelectItem key={h} value={h}>{h}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <span className="text-muted-foreground text-xs font-bold -mt-3">:</span>
      <div className="flex-1">
        <Select value={bt.minute} onValueChange={(v) => handleChange("minute", v)} required>
          <SelectTrigger className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-xs"><SelectValue placeholder="MM" /></SelectTrigger>
          <SelectContent>
            {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-16">
        <Select value={bt.period} onValueChange={(v) => handleChange("period", v)} required>
          <SelectTrigger className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 sm:bg-background sm:border sm:border-border sm:rounded-md h-10 px-0 sm:px-3 text-xs"><SelectValue placeholder="" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
