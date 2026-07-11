import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import api from "@/lib/api"
import { MessageSquareText, Bug, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SuggestionItem {
  id: string
  type: "suggestion" | "bug_report"
  subject: string
  description: string
  submitted_by: {
    id: string
    full_name: string
    username: string
    email: string
  }
  created_at: string
}

export default function AdminSuggestions() {
  const { user } = useAuth()
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<"all" | "suggestion" | "bug_report">("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (user?.role !== "community_admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Access denied. Community admin only.</p>
      </div>
    )
  }

  const fetchSuggestions = async () => {
    setLoading(true)
    try {
      const res = await api.get("/suggestions")
      setSuggestions(res.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuggestions()
  }, [])

  const filtered = suggestions.filter(
    (s) => typeFilter === "all" || s.type === typeFilter
  )

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0f172a]">Suggestions & Bug Reports</h1>
        <p className="text-sm text-[#64748b] mt-1">
          Community feedback submitted by members.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={() => setTypeFilter("all")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
            typeFilter === "all"
              ? "bg-[#0f172a] text-white border-[#0f172a]"
              : "bg-white text-[#0f172a] border-[#e2e8f0] hover:bg-[#f8fafc]"
          )}
        >
          All ({suggestions.length})
        </button>
        <button
          onClick={() => setTypeFilter("suggestion")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors inline-flex items-center gap-1.5",
            typeFilter === "suggestion"
              ? "bg-[#0f172a] text-white border-[#0f172a]"
              : "bg-white text-[#0f172a] border-[#e2e8f0] hover:bg-[#f8fafc]"
          )}
        >
          <MessageSquareText className="h-3.5 w-3.5" />
          Suggestions
        </button>
        <button
          onClick={() => setTypeFilter("bug_report")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors inline-flex items-center gap-1.5",
            typeFilter === "bug_report"
              ? "bg-[#0f172a] text-white border-[#0f172a]"
              : "bg-white text-[#0f172a] border-[#e2e8f0] hover:bg-[#f8fafc]"
          )}
        >
          <Bug className="h-3.5 w-3.5" />
          Bug Reports
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[#64748b]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#64748b] text-sm">No suggestions or bug reports yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const isExpanded = expandedId === s.id
            return (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : s.id)}
                  className="w-full flex items-start gap-3 p-4 text-left hover:bg-[#f8fafc] transition-colors"
                >
                  <div
                    className={cn(
                      "mt-0.5 p-1.5 rounded-lg shrink-0",
                      s.type === "suggestion"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-amber-100 text-amber-600"
                    )}
                  >
                    {s.type === "suggestion" ? (
                      <MessageSquareText className="h-4 w-4" />
                    ) : (
                      <Bug className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0f172a] truncate">
                      {s.subject}
                    </p>
                    <p className="text-xs text-[#64748b] mt-0.5">
                      by {s.submitted_by.full_name} (@{s.submitted_by.username}) &middot;{" "}
                      {new Date(s.created_at).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="shrink-0 text-[#64748b]">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-[#e2e8f0]">
                    <p className="text-sm text-[#334155] whitespace-pre-wrap mt-3">
                      {s.description}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
