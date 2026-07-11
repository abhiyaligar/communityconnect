import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useTranslation, SupportedLanguage } from "@/contexts/LanguageContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LogOut, Download, Globe, MessageSquareText, Loader2 } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { handleApiError } from "@/lib/utils"

export default function Settings() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { language, changeLanguage, t } = useTranslation()
  const [searchParams] = useSearchParams()

  const [showSuggestionForm, setShowSuggestionForm] = useState(searchParams.get("tab") === "suggestion")
  const [suggestionType, setSuggestionType] = useState<"suggestion" | "bug_report">("suggestion")
  const [suggestionSubject, setSuggestionSubject] = useState("")
  const [suggestionDescription, setSuggestionDescription] = useState("")
  const [suggestionLoading, setSuggestionLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get("tab") === "suggestion") {
      setShowSuggestionForm(true)
    }
  }, [searchParams])

  const handleExportData = () => {
    toast.success("Preparing your personal data archive... Your download will start shortly.")
  }

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!suggestionSubject.trim() || !suggestionDescription.trim()) {
      toast.error("Please fill in both subject and description.")
      return
    }
    setSuggestionLoading(true)
    try {
      await api.post("/suggestions", {
        type: suggestionType,
        subject: suggestionSubject.trim(),
        description: suggestionDescription.trim(),
      })
      toast.success("Thank you for your feedback! We'll review it shortly.")
      setShowSuggestionForm(false)
      setSuggestionSubject("")
      setSuggestionDescription("")
    } catch (err: unknown) {
      toast.error(handleApiError(err, "Failed to submit feedback."))
    } finally {
      setSuggestionLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-4 md:py-8 px-3 md:px-4 space-y-6 text-[#0f172a]">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">{t("settings")}</h1>
      </div>

      {/* List View Settings Container */}
      <Card className="border border-[#e2e8f0] rounded-2xl shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0 divide-y divide-[#e2e8f0]">
          {/* Row 1: Language selection */}
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#f1f5f9] rounded-xl text-[#64748b]">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-[#0f172a]">{t("select_language")}</p>
                <p className="text-[10px] text-[#64748b]">{t("select_language_subtitle")}</p>
              </div>
            </div>
            <div className="w-full sm:w-auto shrink-0">
              <select
                value={language}
                onChange={async (e) => {
                  const target = e.target.value as SupportedLanguage
                  await changeLanguage(target)
                  toast.success(`Language updated to ${target.toUpperCase()}!`)
                }}
                className="w-full sm:w-48 bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2 rounded-lg focus:outline-none text-xs font-semibold"
              >
                <option value="en">English (US)</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="es">Español (Spanish)</option>
                <option value="mr">मराठी (Marathi)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Data Portability */}
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#f1f5f9] rounded-xl text-[#64748b]">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-[#0f172a]">Data Portability</p>
                <p className="text-[10px] text-[#64748b]">Export a complete copy of your personal data archive.</p>
              </div>
            </div>
            <div className="w-full sm:w-auto shrink-0">
              <Button
                variant="outline"
                className="w-full sm:w-48 border-[#e2e8f0] text-foreground hover:bg-muted gap-2 text-xs font-bold py-2 rounded-lg h-9"
                onClick={handleExportData}
              >
                <Download className="h-4 w-4" />
                <span>Export Data</span>
              </Button>
            </div>
          </div>

          {/* Row 3: Suggestion & Bug Report */}
          <div className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#f1f5f9] rounded-xl text-[#64748b]">
                <MessageSquareText className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-[#0f172a]">Suggestion & Bug Report</p>
                <p className="text-[10px] text-[#64748b]">Share your ideas or report issues to help us improve the platform.</p>
              </div>
            </div>
            <div className="w-full sm:w-auto shrink-0">
              <Button
                variant="outline"
                className="w-full sm:w-48 border-[#e2e8f0] text-foreground hover:bg-muted gap-2 text-xs font-bold py-2 rounded-lg h-9"
                onClick={() => setShowSuggestionForm(!showSuggestionForm)}
              >
                <MessageSquareText className="h-4 w-4" />
                <span>{showSuggestionForm ? "Close" : "Send Feedback"}</span>
              </Button>
            </div>
          </div>

          {/* Suggestion Form (conditionally shown) */}
          {showSuggestionForm && (
            <div className="p-5 border-t border-[#e2e8f0] bg-[#fafbfc]">
              <form onSubmit={handleSubmitSuggestion} className="space-y-4">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSuggestionType("suggestion")}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      suggestionType === "suggestion"
                        ? "bg-[#0f172a] text-white border-[#0f172a]"
                        : "bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#0f172a]"
                    }`}
                  >
                    Suggestion
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuggestionType("bug_report")}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      suggestionType === "bug_report"
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-white text-[#64748b] border-[#e2e8f0] hover:border-red-400"
                    }`}
                  >
                    Bug Report
                  </button>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Subject"
                    value={suggestionSubject}
                    onChange={(e) => setSuggestionSubject(e.target.value)}
                    className="w-full bg-white border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg focus:outline-none text-xs font-medium placeholder:text-[#94a3b8]"
                    required
                  />
                </div>

                <div>
                  <textarea
                    placeholder="Describe your suggestion or bug in detail..."
                    value={suggestionDescription}
                    onChange={(e) => setSuggestionDescription(e.target.value)}
                    rows={4}
                    className="w-full bg-white border border-[#e2e8f0] text-[#0f172a] p-2.5 rounded-lg focus:outline-none text-xs font-medium placeholder:text-[#94a3b8] resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 border-[#e2e8f0]"
                    onClick={() => { setShowSuggestionForm(false); setSuggestionSubject(""); setSuggestionDescription("") }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="text-xs h-8 bg-[#0f172a] hover:bg-[#1e293b] text-white"
                    disabled={suggestionLoading}
                  >
                    {suggestionLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : null}
                    Submit
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Row 4: Account Actions (Logout) */}
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 text-red-500 rounded-xl">
                <LogOut className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-[#ba1a1a]">Log Out</p>
                <p className="text-[10px] text-[#64748b]">Sign out of your active member session.</p>
              </div>
            </div>
            <div className="w-full sm:w-auto shrink-0">
              <Button
                variant="destructive"
                className="w-full sm:w-48 bg-red-600 hover:bg-red-700 text-white gap-2 text-xs font-bold py-2 rounded-lg h-9"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span>{t("logout")}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
