import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2, FileText, ShieldCheck } from "lucide-react"
import api from "@/lib/api"

export default function LegalAccept() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptNda, setAcceptNda] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [loadingStatus, setLoadingStatus] = useState(true)

  const termsAccepted = !!user?.terms_accepted_at
  const ndaAccepted = !!user?.nda_accepted_at

  useEffect(() => {
    if (termsAccepted && ndaAccepted) {
      navigate("/dashboard", { replace: true })
    }
    setLoadingStatus(false)
  }, [termsAccepted, ndaAccepted, navigate])

  const handleAccept = async () => {
    if (!acceptTerms && !acceptNda) return
    setSubmitting(true)
    setError("")
    try {
      await api.post("/legal/accept", null, {
        params: { accept_terms: acceptTerms, accept_nda: acceptNda },
      })
      await refreshUser()
      navigate("/dashboard", { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to accept agreements.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0f172a]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-[#0f172a]/5 flex items-center justify-center">
              <FileText className="h-6 w-6 text-[#0f172a]" />
            </div>
            <div className="h-12 w-12 rounded-xl bg-[#0f172a]/5 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-[#0f172a]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Legal Agreements</h1>
          <p className="text-sm text-[#64748b]">
            Please review and accept our legal agreements to continue using the platform.
          </p>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 space-y-5 shadow-sm">
          {/* Terms & Conditions */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={acceptTerms || termsAccepted}
                disabled={termsAccepted}
                onCheckedChange={(v) => setAcceptTerms(v === true)}
              />
              <div>
                <label htmlFor="terms" className="text-sm font-bold text-[#0f172a] cursor-pointer">
                  Terms & Conditions
                </label>
                <p className="text-xs text-[#64748b] mt-0.5">
                  I have read and agree to the{" "}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#0f172a] underline font-semibold">
                    Terms & Conditions
                  </a>
                  .
                </p>
                {termsAccepted && (
                  <p className="text-[10px] text-green-600 font-semibold mt-1">Already accepted</p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-[#e2e8f0]" />

          {/* NDA */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="nda"
                checked={acceptNda || ndaAccepted}
                disabled={ndaAccepted}
                onCheckedChange={(v) => setAcceptNda(v === true)}
              />
              <div>
                <label htmlFor="nda" className="text-sm font-bold text-[#0f172a] cursor-pointer">
                  Non-Disclosure Agreement
                </label>
                <p className="text-xs text-[#64748b] mt-0.5">
                  I have read and agree to the{" "}
                  <a href="/nda" target="_blank" rel="noopener noreferrer" className="text-[#0f172a] underline font-semibold">
                    Non-Disclosure Agreement
                  </a>
                  .
                </p>
                {ndaAccepted && (
                  <p className="text-[10px] text-green-600 font-semibold mt-1">Already accepted</p>
                )}
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 font-semibold text-center">{error}</p>
          )}

          <Button
            className="w-full bg-[#0f172a] text-white hover:bg-[#1e293b] text-sm font-semibold py-5 rounded-lg"
            disabled={(!acceptTerms && !acceptNda) || submitting}
            onClick={handleAccept}
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              "Accept & Continue"
            )}
          </Button>

          <p className="text-[10px] text-[#94a3b8] text-center">
            You must accept both agreements to use the platform.
          </p>
        </div>
      </div>
    </div>
  )
}
