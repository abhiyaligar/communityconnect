import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import api from "@/lib/api"
import { handleApiError } from "@/lib/utils"
import { ArrowLeft, Loader2, Save, Heart, User, Briefcase, Star, Users, Coffee } from "lucide-react"

export default function EditMatrimony() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Form State
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    if (user && user.matrimony) {
      setFormData(user.matrimony)
    }
  }, [user])

  const handleSelect = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      await api.put("/profiles/me/matrimony", formData)
      await refreshUser()
      navigate("/dashboard")
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <Card className="glass-card shadow-2xl overflow-hidden border-primary/20">
          <div className="h-2 gradient-primary" />
          <CardHeader className="text-center pb-8 pt-10">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 ring-8 ring-primary/5">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl">Matrimony Profile</CardTitle>
            <CardDescription className="text-base">
              Complete your profile to find the perfect match within the community.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 sm:px-12 pb-12">
            
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl mb-6 text-center border border-destructive/20 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-12">
              
              {/* SECTION: PHYSICAL */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 border-b pb-2">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Physical Attributes</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Height (cm)</Label>
                    <Input name="height_cm" type="number" placeholder="e.g. 175" value={formData.height_cm || ""} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Body Type</Label>
                    <Select value={formData.body_type || ""} onValueChange={(v) => handleSelect("body_type", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slim">Slim</SelectItem>
                        <SelectItem value="average">Average</SelectItem>
                        <SelectItem value="athletic">Athletic</SelectItem>
                        <SelectItem value="heavy">Heavy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Complexion</Label>
                    <Select value={formData.complexion || ""} onValueChange={(v) => handleSelect("complexion", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="wheatish">Wheatish</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              {/* SECTION: PROFESSIONAL */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Education & Career</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Highest Qualification</Label>
                    <Select value={formData.highest_qualification || ""} onValueChange={(v) => handleSelect("highest_qualification", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10th">10th Pass</SelectItem>
                        <SelectItem value="12th">12th Pass</SelectItem>
                        <SelectItem value="diploma">Diploma</SelectItem>
                        <SelectItem value="bachelors">Bachelor's</SelectItem>
                        <SelectItem value="masters">Master's</SelectItem>
                        <SelectItem value="phd">PhD</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Field of Study</Label>
                    <Input name="field_of_study" placeholder="e.g. Computer Science" value={formData.field_of_study || ""} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Employment Type</Label>
                    <Select value={formData.employment_type || ""} onValueChange={(v) => handleSelect("employment_type", v)}>
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
                  <div className="space-y-2">
                    <Label>Income Range</Label>
                    <Select value={formData.income_range || ""} onValueChange={(v) => handleSelect("income_range", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="below_2l">Below 2 Lakhs</SelectItem>
                        <SelectItem value="2_5l">2 - 5 Lakhs</SelectItem>
                        <SelectItem value="5_10l">5 - 10 Lakhs</SelectItem>
                        <SelectItem value="10_20l">10 - 20 Lakhs</SelectItem>
                        <SelectItem value="above_20l">Above 20 Lakhs</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              {/* SECTION: HOROSCOPE */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Star className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Horoscope & Astro</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Gotra</Label>
                    <Input name="gotra" placeholder="Your gotra" value={formData.gotra || ""} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Rashi / Zodiac</Label>
                    <Input name="rashi" placeholder="e.g. Leo" value={formData.rashi || ""} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label>Manglik Status</Label>
                    <Select value={formData.manglik_status || ""} onValueChange={(v) => handleSelect("manglik_status", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="partial">Partial / Anshik</SelectItem>
                        <SelectItem value="dont_know">Don't Know</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              {/* SECTION: LIFESTYLE */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Coffee className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Lifestyle</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Diet</Label>
                    <Select value={formData.diet || ""} onValueChange={(v) => handleSelect("diet", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vegetarian">Vegetarian</SelectItem>
                        <SelectItem value="eggetarian">Eggetarian</SelectItem>
                        <SelectItem value="non_vegetarian">Non-Vegetarian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Smoking</Label>
                    <Select value={formData.smoking || ""} onValueChange={(v) => handleSelect("smoking", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="occasionally">Occasionally</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Drinking</Label>
                    <Select value={formData.drinking || ""} onValueChange={(v) => handleSelect("drinking", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="occasionally">Occasionally</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              <Separator />

              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
                <Button type="submit" size="lg" disabled={loading} className="w-40 shadow-lg shadow-primary/20">
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                  Save Profile
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
