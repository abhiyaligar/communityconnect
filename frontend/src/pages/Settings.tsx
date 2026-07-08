import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LogOut, Download, Globe } from "lucide-react"
import { toast } from "sonner"

export default function Settings() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [language, setLanguage] = useState("english")

  const handleExportData = () => {
    toast.success("Preparing your personal data archive... Your download will start shortly.")
  }

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <div className="max-w-3xl mx-auto py-4 md:py-8 px-3 md:px-4 space-y-6 text-[#0f172a]">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">Settings</h1>
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
                <p className="font-bold text-sm text-[#0f172a]">App Language</p>
                <p className="text-[10px] text-[#64748b]">Change interface translation settings.</p>
              </div>
            </div>
            <div className="w-full sm:w-auto shrink-0">
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value)
                  toast.success(`Language updated to ${e.target.value.toUpperCase()}!`)
                }}
                className="w-full sm:w-48 bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] p-2 rounded-lg focus:outline-none text-xs font-semibold"
              >
                <option value="english">English (US)</option>
                <option value="hindi">Hindi (हिन्दी)</option>
                <option value="gujarati">Gujarati (ગુજરાતી)</option>
                <option value="marathi">Marathi (મરાઠી)</option>
                <option value="spanish">Spanish (Español)</option>
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

          {/* Row 3: Account Actions (Logout) */}
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
                <span>Log Out</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
