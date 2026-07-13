import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import api from "@/lib/api"
import { handleApiError } from "@/lib/utils"
import { ArrowRight, ArrowLeft, Loader2, Heart, Sparkles } from "lucide-react"

const RASHI_OPTIONS = [
  { value: "aries", label: "Mesh (Aries)" },
  { value: "taurus", label: "Vrishabh (Taurus)" },
  { value: "gemini", label: "Mithun (Gemini)" },
  { value: "cancer", label: "Kark (Cancer)" },
  { value: "leo", label: "Simha (Leo)" },
  { value: "virgo", label: "Kanya (Virgo)" },
  { value: "libra", label: "Tula (Libra)" },
  { value: "scorpio", label: "Vrishchik (Scorpio)" },
  { value: "sagittarius", label: "Dhanu (Sagittarius)" },
  { value: "capricorn", label: "Makar (Capricorn)" },
  { value: "aquarius", label: "Kumbh (Aquarius)" },
  { value: "pisces", label: "Meen (Pisces)" },
]

const EMPLOYMENT_OPTIONS = [
  { value: "employed", label: "Employed" },
  { value: "self_employed", label: "Self Employed" },
  { value: "business", label: "Business" },
  { value: "student", label: "Student" },
  { value: "not_working", label: "Not Working" },
]

const EDUCATION_OPTIONS = [
  { value: "bachelors", label: "Bachelor's" },
  { value: "masters", label: "Master's" },
  { value: "doctorate", label: "Doctorate" },
  { value: "diploma", label: "Diploma" },
  { value: "high_school", label: "High School" },
]

const HOBBIES_OPTIONS = [
  { value: "reading", label: "Reading" },
  { value: "traveling", label: "Traveling" },
  { value: "cooking", label: "Cooking" },
  { value: "music", label: "Music" },
  { value: "sports", label: "Sports" },
  { value: "dancing", label: "Dancing" },
  { value: "photography", label: "Photography" },
  { value: "gardening", label: "Gardening" },
  { value: "painting", label: "Painting" },
  { value: "gaming", label: "Gaming" },
  { value: "yoga", label: "Yoga" },
  { value: "fitness", label: "Fitness" },
  { value: "movies", label: "Movies" },
  { value: "hiking", label: "Hiking" },
  { value: "writing", label: "Writing" },
  { value: "meditation", label: "Meditation" },
]

const DIET_OPTIONS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "non_vegetarian", label: "Non-Vegetarian" },
  { value: "eggetarian", label: "Eggetarian" },
  { value: "vegan", label: "Vegan" },
]

const INCOME_OPTIONS = [
  { value: "below_3lpa", label: "Below ₹3 LPA" },
  { value: "3_to_6lpa", label: "₹3 - 6 LPA" },
  { value: "6_to_10lpa", label: "₹6 - 10 LPA" },
  { value: "10_to_20lpa", label: "₹10 - 20 LPA" },
  { value: "above_20lpa", label: "Above ₹20 LPA" },
]

interface MultiSelectProps {
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
}

function MultiCheckbox({ options, selected, onChange }: MultiSelectProps) {
  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter((v) => v !== val))
    } else {
      onChange([...selected, val])
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2 pt-1">
      {options.map((opt) => (
        <label key={opt.value} className="flex items-center gap-2 text-xs cursor-pointer">
          <Checkbox checked={selected.includes(opt.value)} onCheckedChange={() => toggle(opt.value)} />
          {opt.label}
        </label>
      ))}
    </div>
  )
}

interface TierFieldProps {
  label: string
  strictValue: string[]
  onStrictChange: (v: string[]) => void
  prefValue: string[]
  onPrefChange: (v: string[]) => void
  options: { value: string; label: string }[]
}

function TierMultiField({ label, strictValue, onStrictChange, prefValue, onPrefChange, options }: TierFieldProps) {
  return (
    <div className="space-y-3 p-4 rounded-lg border border-border bg-card/40">
      <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">{label}</h4>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-medium text-foreground/80">Compulsory</span>
        </div>
        <MultiCheckbox options={options} selected={strictValue} onChange={onStrictChange} />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-medium text-muted-foreground">Preferred</span>
        </div>
        <MultiCheckbox options={options} selected={prefValue} onChange={onPrefChange} />
      </div>
    </div>
  )
}

interface RangeFieldProps {
  label: string
  strictMin: string
  strictMax: string
  onStrictMin: (v: string) => void
  onStrictMax: (v: string) => void
  prefMin: string
  prefMax: string
  onPrefMin: (v: string) => void
  onPrefMax: (v: string) => void
  unit?: string
  min?: number
}

function TierRangeField({ label, strictMin, strictMax, onStrictMin, onStrictMax, prefMin, prefMax, onPrefMin, onPrefMax, unit, min }: RangeFieldProps) {
  return (
    <div className="space-y-3 p-4 rounded-lg border border-border bg-card/40">
      <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">{label}</h4>
      <div>
        <span className="text-[11px] font-medium text-foreground/80 block mb-1.5">Compulsory Range</span>
        <div className="flex items-center gap-2">
          <Input type="number" placeholder="Min" min={min} value={strictMin} onChange={(e) => onStrictMin(e.target.value)} className="h-9 text-xs" />
          <span className="text-muted-foreground text-xs">to</span>
          <Input type="number" placeholder="Max" min={min} value={strictMax} onChange={(e) => onStrictMax(e.target.value)} className="h-9 text-xs" />
          {unit && <span className="text-xs text-muted-foreground w-6">{unit}</span>}
        </div>
      </div>
      <div>
        <span className="text-[11px] font-medium text-muted-foreground block mb-1.5">Flexible Range</span>
        <div className="flex items-center gap-2">
          <Input type="number" placeholder="Min" min={min} value={prefMin} onChange={(e) => onPrefMin(e.target.value)} className="h-9 text-xs" />
          <span className="text-muted-foreground text-xs">to</span>
          <Input type="number" placeholder="Max" min={min} value={prefMax} onChange={(e) => onPrefMax(e.target.value)} className="h-9 text-xs" />
          {unit && <span className="text-xs text-muted-foreground w-6">{unit}</span>}
        </div>
      </div>
    </div>
  )
}

export default function MatrimonyPreferences() {
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = (location.state as { returnTo?: string })?.returnTo
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState("")

  const [strictRashi, setStrictRashi] = useState<string[]>([])
  const [prefRashi, setPrefRashi] = useState<string[]>([])
  const [strictGotra, setStrictGotra] = useState<string[]>([])
  const [prefGotra, setPrefGotra] = useState<string[]>([])
  const [strictNakshatra, setStrictNakshatra] = useState<string[]>([])
  const [prefNakshatra, setPrefNakshatra] = useState<string[]>([])
  const [strictSubCaste, setStrictSubCaste] = useState<string[]>([])
  const [prefSubCaste, setPrefSubCaste] = useState<string[]>([])
  const [strictDiet, setStrictDiet] = useState<string[]>([])
  const [prefDiet, setPrefDiet] = useState<string[]>([])
  const [strictEducation, setStrictEducation] = useState<string[]>([])
  const [prefEducation, setPrefEducation] = useState<string[]>([])
  const [strictEmployment, setStrictEmployment] = useState<string[]>([])
  const [prefEmployment, setPrefEmployment] = useState<string[]>([])

  const [strictIncomeMin, setStrictIncomeMin] = useState("")
  const [strictIncomeMax, setStrictIncomeMax] = useState("")
  const [prefIncome, setPrefIncome] = useState("")

  const [strictAgeMin, setStrictAgeMin] = useState("")
  const [strictAgeMax, setStrictAgeMax] = useState("")
  const [prefAgeMin, setPrefAgeMin] = useState("")
  const [prefAgeMax, setPrefAgeMax] = useState("")

  const [strictHeightMin, setStrictHeightMin] = useState("")
  const [strictHeightMax, setStrictHeightMax] = useState("")
  const [prefHeightMin, setPrefHeightMin] = useState("")
  const [prefHeightMax, setPrefHeightMax] = useState("")

  const [strictWeightMin, setStrictWeightMin] = useState("")
  const [strictWeightMax, setStrictWeightMax] = useState("")
  const [prefWeightMin, setPrefWeightMin] = useState("")
  const [prefWeightMax, setPrefWeightMax] = useState("")

  const [manglik, setManglik] = useState("any")
  const [preferredHobbies, setPreferredHobbies] = useState<string[]>([])
  const [aboutPartner, setAboutPartner] = useState("")
  const [prefStep, setPrefStep] = useState(1)

  // Fetch existing preferences on mount
  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await api.get("/matrimony/preferences")
        const d = res.data
        if (d.strict_rashi) setStrictRashi(d.strict_rashi)
        if (d.preferred_rashi) setPrefRashi(d.preferred_rashi)
        if (d.strict_gotra) setStrictGotra(d.strict_gotra)
        if (d.preferred_gotra) setPrefGotra(d.preferred_gotra)
        if (d.strict_nakshatra) setStrictNakshatra(d.strict_nakshatra)
        if (d.preferred_nakshatra) setPrefNakshatra(d.preferred_nakshatra)
        if (d.strict_sub_caste) setStrictSubCaste(d.strict_sub_caste)
        if (d.preferred_sub_caste) setPrefSubCaste(d.preferred_sub_caste)
        if (d.strict_diet) setStrictDiet(d.strict_diet)
        if (d.preferred_diet) setPrefDiet(d.preferred_diet)
        if (d.strict_education) setStrictEducation(d.strict_education)
        if (d.preferred_education) setPrefEducation(d.preferred_education)
        if (d.strict_employment) setStrictEmployment(d.strict_employment)
        if (d.preferred_employment) setPrefEmployment(d.preferred_employment)
        if (d.strict_income_min) setStrictIncomeMin(d.strict_income_min)
        if (d.strict_income_max) setStrictIncomeMax(d.strict_income_max)
        if (d.preferred_income) setPrefIncome(d.preferred_income)
        if (d.strict_age_min) setStrictAgeMin(String(d.strict_age_min))
        if (d.strict_age_max) setStrictAgeMax(String(d.strict_age_max))
        if (d.preferred_age_min) setPrefAgeMin(String(d.preferred_age_min))
        if (d.preferred_age_max) setPrefAgeMax(String(d.preferred_age_max))
        if (d.strict_height_min) setStrictHeightMin(String(d.strict_height_min))
        if (d.strict_height_max) setStrictHeightMax(String(d.strict_height_max))
        if (d.preferred_height_min) setPrefHeightMin(String(d.preferred_height_min))
        if (d.preferred_height_max) setPrefHeightMax(String(d.preferred_height_max))
        if (d.strict_weight_min) setStrictWeightMin(String(d.strict_weight_min))
        if (d.strict_weight_max) setStrictWeightMax(String(d.strict_weight_max))
        if (d.preferred_weight_min) setPrefWeightMin(String(d.preferred_weight_min))
        if (d.preferred_weight_max) setPrefWeightMax(String(d.preferred_weight_max))
        if (d.manglik) setManglik(d.manglik)
        if (d.preferred_hobbies) setPreferredHobbies(d.preferred_hobbies)
        if (d.about_partner) setAboutPartner(d.about_partner)
      } catch (err: any) {
        // 404 = no prefs yet, that's fine
        if (err.response?.status !== 404) {
          setError(handleApiError(err, "Failed to load preferences."))
        }
      } finally {
        setFetching(false)
      }
    }
    fetchPrefs()
  }, [])

  const buildPayload = () => ({
    strict_rashi: strictRashi.length ? strictRashi : null,
    preferred_rashi: prefRashi.length ? prefRashi : null,
    strict_gotra: strictGotra.length ? strictGotra : null,
    preferred_gotra: prefGotra.length ? prefGotra : null,
    strict_nakshatra: strictNakshatra.length ? strictNakshatra : null,
    preferred_nakshatra: prefNakshatra.length ? prefNakshatra : null,
    strict_sub_caste: strictSubCaste.length ? strictSubCaste : null,
    preferred_sub_caste: prefSubCaste.length ? prefSubCaste : null,
    strict_diet: strictDiet.length ? strictDiet : null,
    preferred_diet: prefDiet.length ? prefDiet : null,
    strict_education: strictEducation.length ? strictEducation : null,
    preferred_education: prefEducation.length ? prefEducation : null,
    strict_employment: strictEmployment.length ? strictEmployment : null,
    preferred_employment: prefEmployment.length ? prefEmployment : null,
    strict_income_min: strictIncomeMin || null,
    strict_income_max: strictIncomeMax || null,
    preferred_income: prefIncome || null,
    strict_age_min: strictAgeMin ? parseInt(strictAgeMin) : null,
    strict_age_max: strictAgeMax ? parseInt(strictAgeMax) : null,
    preferred_age_min: prefAgeMin ? parseInt(prefAgeMin) : null,
    preferred_age_max: prefAgeMax ? parseInt(prefAgeMax) : null,
    strict_height_min: strictHeightMin ? parseInt(strictHeightMin) : null,
    strict_height_max: strictHeightMax ? parseInt(strictHeightMax) : null,
    preferred_height_min: prefHeightMin ? parseInt(prefHeightMin) : null,
    preferred_height_max: prefHeightMax ? parseInt(prefHeightMax) : null,
    strict_weight_min: strictWeightMin ? parseInt(strictWeightMin) : null,
    strict_weight_max: strictWeightMax ? parseInt(strictWeightMax) : null,
    preferred_weight_min: prefWeightMin ? parseInt(prefWeightMin) : null,
    preferred_weight_max: prefWeightMax ? parseInt(prefWeightMax) : null,
    manglik,
    preferred_hobbies: preferredHobbies.length ? preferredHobbies : null,
    about_partner: aboutPartner || null,
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await api.post("/matrimony/preferences", buildPayload())
      navigate(returnTo || "/pending-verification")
    } catch (err: unknown) {
      setError(handleApiError(err, "Failed to save preferences."))
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    navigate(returnTo || "/pending-verification")
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl border border-border/80 bg-card/60 flex items-center justify-center shadow-lg">
            <Heart className="h-7 w-7 text-foreground" />
          </div>
          <span className="font-extrabold text-3xl tracking-tight text-foreground mt-4">
            Matrimony Preferences
          </span>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Set what you're looking for in a partner. Fields marked as <strong>Compulsory</strong> must match;
            <strong> Preferred</strong> are nice-to-haves. Leave empty for no filter.
          </p>
        </div>

        <Card className="w-full border border-border bg-card shadow-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Your Preferences</CardTitle>
            <CardDescription className="text-xs">Step {prefStep} of 5 — All fields are optional</CardDescription>
            <div className="flex justify-center gap-1.5 mt-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className={`h-1.5 w-8 rounded-full transition-colors ${s === prefStep ? "bg-foreground" : "bg-muted"}`} />
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-4 pb-6">
            <form onSubmit={handleSave}>
              {/* Step 1: Zodiac / Rashi */}
              {prefStep === 1 && (
                <div className="space-y-5">
                  <TierMultiField
                    label="Zodiac / Rashi"
                    strictValue={strictRashi}
                    onStrictChange={setStrictRashi}
                    prefValue={prefRashi}
                    onPrefChange={setPrefRashi}
                    options={RASHI_OPTIONS}
                  />

                  {error && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" className="flex-1 h-11 sm:h-10 text-xs" onClick={handleSkip}>
                      Skip All
                    </Button>
                    <Button type="button" className="flex-1 h-11 sm:h-10 text-xs cursor-pointer" onClick={() => setPrefStep(2)}>
                      Next <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Gotra, Nakshatra, Sub Caste, Manglik */}
              {prefStep === 2 && (
                <div className="space-y-5">
                  <TierMultiField
                    label="Gotra"
                    strictValue={strictGotra}
                    onStrictChange={(v) => setStrictGotra(v.map((x) => x))}
                    prefValue={prefGotra}
                    onPrefChange={(v) => setPrefGotra(v.map((x) => x))}
                    options={[
                      { value: "kashyap", label: "Kashyap" },
                      { value: "bhardwaj", label: "Bhardwaj" },
                      { value: "vashistha", label: "Vashistha" },
                      { value: "atrey", label: "Atrey" },
                      { value: "jaimini", label: "Jaimini" },
                      { value: "other", label: "Other" },
                    ]}
                  />

                  <div className="space-y-3 p-4 rounded-lg border border-border bg-card/40">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Nakshatra</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] font-medium text-foreground/80 block mb-1.5">Compulsory</span>
                        <Input placeholder="e.g. Ashwini, Bharani" value={strictNakshatra.join(", ")} onChange={(e) => setStrictNakshatra(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} className="h-9 text-xs" />
                      </div>
                      <div>
                        <span className="text-[11px] font-medium text-muted-foreground block mb-1.5">Preferred</span>
                        <Input placeholder="e.g. Ashwini, Bharani" value={prefNakshatra.join(", ")} onChange={(e) => setPrefNakshatra(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} className="h-9 text-xs" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 rounded-lg border border-border bg-card/40">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Sub Caste</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] font-medium text-foreground/80 block mb-1.5">Compulsory</span>
                        <Input placeholder="e.g. Shakdwipi" value={strictSubCaste.join(", ")} onChange={(e) => setStrictSubCaste(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} className="h-9 text-xs" />
                      </div>
                      <div>
                        <span className="text-[11px] font-medium text-muted-foreground block mb-1.5">Preferred</span>
                        <Input placeholder="e.g. Shakdwipi" value={prefSubCaste.join(", ")} onChange={(e) => setPrefSubCaste(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} className="h-9 text-xs" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 rounded-lg border border-border bg-card/40">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Manglik Status</h4>
                    <Select value={manglik} onValueChange={setManglik}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Any" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any / Don't Care</SelectItem>
                        <SelectItem value="manglik">Must be Manglik</SelectItem>
                        <SelectItem value="non_manglik">Must be Non-Manglik</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {error && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" className="flex-1 h-11 sm:h-10 text-xs" onClick={() => setPrefStep(1)}>
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <Button type="button" className="flex-1 h-11 sm:h-10 text-xs cursor-pointer" onClick={() => setPrefStep(3)}>
                      Next <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Physical & Lifestyle */}
              {prefStep === 3 && (
                <div className="space-y-5">
                  <div className="space-y-3 p-4 rounded-lg border border-border bg-card/40">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Income Range</h4>
                    <div>
                      <span className="text-[11px] font-medium text-foreground/80 block mb-1.5">Compulsory Range</span>
                      <div className="flex items-center gap-2">
                        <Select value={strictIncomeMin} onValueChange={setStrictIncomeMin}>
                          <SelectTrigger className="h-9 text-xs flex-1"><SelectValue placeholder="Min Income" /></SelectTrigger>
                          <SelectContent>
                            {INCOME_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground">to</span>
                        <Select value={strictIncomeMax} onValueChange={setStrictIncomeMax}>
                          <SelectTrigger className="h-9 text-xs flex-1"><SelectValue placeholder="Max Income" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any</SelectItem>
                            {INCOME_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-muted-foreground block mb-1.5">Flexible</span>
                      <Select value={prefIncome} onValueChange={setPrefIncome}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Any" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any</SelectItem>
                          {INCOME_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <TierRangeField
                    label="Age (Years)"
                    strictMin={strictAgeMin} strictMax={strictAgeMax}
                    onStrictMin={setStrictAgeMin} onStrictMax={setStrictAgeMax}
                    prefMin={prefAgeMin} prefMax={prefAgeMax}
                    onPrefMin={setPrefAgeMin} onPrefMax={setPrefAgeMax}
                    min={18}
                  />

                  <TierRangeField
                    label="Height (cm)"
                    strictMin={strictHeightMin} strictMax={strictHeightMax}
                    onStrictMin={setStrictHeightMin} onStrictMax={setStrictHeightMax}
                    prefMin={prefHeightMin} prefMax={prefHeightMax}
                    onPrefMin={setPrefHeightMin} onPrefMax={setPrefHeightMax}
                    unit="cm"
                  />

                  <TierRangeField
                    label="Weight (kg)"
                    strictMin={strictWeightMin} strictMax={strictWeightMax}
                    onStrictMin={setStrictWeightMin} onStrictMax={setStrictWeightMax}
                    prefMin={prefWeightMin} prefMax={prefWeightMax}
                    onPrefMin={setPrefWeightMin} onPrefMax={setPrefWeightMax}
                    unit="kg"
                  />

                  <TierMultiField
                    label="Diet"
                    strictValue={strictDiet}
                    onStrictChange={setStrictDiet}
                    prefValue={prefDiet}
                    onPrefChange={setPrefDiet}
                    options={DIET_OPTIONS}
                  />

                  {error && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" className="flex-1 h-11 sm:h-10 text-xs" onClick={() => setPrefStep(2)}>
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <Button type="button" className="flex-1 h-11 sm:h-10 text-xs cursor-pointer" onClick={() => setPrefStep(4)}>
                      Next <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Education & Employment */}
              {prefStep === 4 && (
                <div className="space-y-5">
                  <TierMultiField
                    label="Education"
                    strictValue={strictEducation}
                    onStrictChange={setStrictEducation}
                    prefValue={prefEducation}
                    onPrefChange={setPrefEducation}
                    options={EDUCATION_OPTIONS}
                  />

                  <TierMultiField
                    label="Employment Type"
                    strictValue={strictEmployment}
                    onStrictChange={setStrictEmployment}
                    prefValue={prefEmployment}
                    onPrefChange={setPrefEmployment}
                    options={EMPLOYMENT_OPTIONS}
                  />

                  {error && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" className="flex-1 h-11 sm:h-10 text-xs" onClick={() => setPrefStep(3)}>
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <Button type="button" className="flex-1 h-11 sm:h-10 text-xs cursor-pointer" onClick={() => setPrefStep(5)}>
                      Next <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 5: Hobbies & About Partner + Submit */}
              {prefStep === 5 && (
                <div className="space-y-5">
                  <TierMultiField
                    label="Preferred Hobbies"
                    strictValue={[]}
                    onStrictChange={() => {}}
                    prefValue={preferredHobbies}
                    onPrefChange={setPreferredHobbies}
                    options={HOBBIES_OPTIONS}
                  />

                  <div className="space-y-3 p-4 rounded-lg border border-border bg-card/40">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">About the Partner I'm Looking For</h4>
                    <textarea
                      value={aboutPartner}
                      onChange={(e) => setAboutPartner(e.target.value)}
                      placeholder="Describe the kind of person you're looking for — values, personality, interests..."
                      className="w-full min-h-[100px] bg-transparent border border-border rounded-md p-3 text-xs resize-y focus:outline-none focus:ring-1 focus:ring-foreground"
                    />
                  </div>

                  {error && <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}

                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" className="flex-1 h-11 sm:h-10 text-xs" onClick={() => setPrefStep(4)}>
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <Button type="submit" className="flex-1 h-11 sm:h-10 text-xs cursor-pointer" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {loading ? "Saving..." : "Save & Continue"}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
