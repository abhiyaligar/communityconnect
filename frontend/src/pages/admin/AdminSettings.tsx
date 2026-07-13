import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

export default function AdminSettings() {
  const [settings, setSettings] = useState<{ key: string; value: string; id: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  const fetchSettings = async () => {
    try {
      const res = await api.get("/admin/settings")
      setSettings(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleToggle = async (key: string, currentValue: string) => {
    setToggling(key)
    const newValue = currentValue === "true" ? "false" : "true"
    try {
      await api.post("/admin/settings", { key, value: newValue })
      setSettings((prev) =>
        prev.map((s) => (s.key === key ? { ...s, value: newValue } : s))
      )
      toast.success(`"${key}" set to ${newValue}`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update setting")
    } finally {
      setToggling(null)
    }
  }

  const getSettingLabel = (key: string) => {
    const labels: Record<string, string> = {
      auto_create_free_membership: "Auto-create free 1-month membership for new users",
    }
    return labels[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#0f172a]" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in text-[#0f172a]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-sm text-[#64748b] mt-1">Manage global platform configuration</p>
      </div>

      <div className="space-y-4">
        {settings.map((setting) => (
          <div
            key={setting.key}
            className="bg-white border border-[#e2e8f0] rounded-2xl p-5 flex items-center justify-between shadow-sm"
          >
            <div>
              <p className="text-sm font-semibold text-[#0f172a]">
                {getSettingLabel(setting.key)}
              </p>
              <p className="text-[11px] text-[#64748b] mt-0.5 font-mono">
                {setting.key}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle(setting.key, setting.value)}
              disabled={toggling === setting.key}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
                setting.value === "true"
                  ? "bg-emerald-500"
                  : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  setting.value === "true" ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
