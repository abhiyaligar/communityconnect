import React, { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import api from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Send,
  MessageCircle,
  ArrowLeft,
  Loader2,
  ShieldAlert,
  Check,
  CheckCheck,
  Lock
} from "lucide-react"
import { toast } from "sonner"

interface ChatSession {
  profile: {
    id: string
    full_name: string
    profile_photo_url: string
    gender: string | null
    username: string | null
  }
  last_message: {
    id: string
    sender_profile_id: string
    receiver_profile_id: string
    content: string
    is_read: boolean
    created_at: string
  } | null
  unread_count: number
}

interface ChatMessage {
  id: string
  sender_profile_id: string
  receiver_profile_id: string
  content: string
  is_read: boolean
  created_at: string
}

export default function Chat() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const messageEndRef = useRef<HTMLDivElement>(null)

  // Selected chat partner profile ID
  const selectedProfileId = searchParams.get("profile_id") || ""
  const [inputText, setInputText] = useState("")
  const [showWarning, setShowWarning] = useState(false)

  // Membership gate
  const membership = user?.membership
  const isAdmin = user?.role === "community_admin" || user?.role === "local_admin"
  const hasActiveMembership = isAdmin || (membership?.has_membership && membership?.status === "active")

  if (!hasActiveMembership) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-[#e2e8f0]">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-[#0f172a]">Membership Required</h2>
        <p className="text-xs text-[#64748b] max-w-sm leading-relaxed">
          An active membership is required to access chat. Please purchase a membership plan to connect with other verified members.
        </p>
      </div>
    )
  }

  // Mobile layout state: "list" or "chat"
  const [viewMode, setViewMode] = useState<"list" | "chat">(
    selectedProfileId ? "chat" : "list"
  )

  // Update view mode when query param changes
  useEffect(() => {
    if (selectedProfileId) {
      setViewMode("chat")
    } else {
      setViewMode("list")
    }
  }, [selectedProfileId])

  // Fetch all chat sessions (approved connections only)
  const { data: sessions = [], refetch: refetchSessions, isLoading: isLoadingSessions } = useQuery<ChatSession[]>({
    queryKey: ["chat-sessions"],
    queryFn: async () => {
      const res = await api.get("/chat/sessions")
      return res.data
    },
    refetchOnWindowFocus: false
  })

  // Find the selected session object
  const activeSession = sessions.find((s) => s.profile.id === selectedProfileId)

  // Fetch messages with the selected profile
  const { data: messages = [], refetch: refetchMessages, isLoading: isLoadingMessages } = useQuery<ChatMessage[]>({
    queryKey: ["chat-messages", selectedProfileId],
    queryFn: async () => {
      if (!selectedProfileId) return []
      const res = await api.get(`/chat/${selectedProfileId}/messages`)
      return res.data
    },
    enabled: !!selectedProfileId,
    refetchOnWindowFocus: false
  })

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await api.post("/chat/messages", {
        receiver_profile_id: selectedProfileId,
        content: text
      })
      return res.data
    },
    onSuccess: () => {
      setInputText("")
      setShowWarning(false)
      refetchMessages()
      refetchSessions()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to send message.")
    }
  })

  // 4-second Polling logic (ONLY active when component is mounted and chat is active)
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const schedulePoll = useCallback(() => {
    pollingRef.current = setTimeout(async () => {
      try {
        await Promise.all([
          refetchSessions(),
          selectedProfileId ? refetchMessages() : Promise.resolve(),
        ])
      } catch {
        // Swallow polling errors silently
      }
      schedulePoll()
    }, 4000)
  }, [selectedProfileId, refetchSessions, refetchMessages])

  useEffect(() => {
    refetchSessions()
    schedulePoll()
    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current)
    }
  }, [schedulePoll, refetchSessions])

  // Scroll to bottom when messages list updates
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Privacy Warning Scanner: Checks input text for phone numbers or address patterns
  useEffect(() => {
    if (!inputText) {
      setShowWarning(false)
      return
    }

    // Phone number regex (must match backend sanitize_message exactly)
    const phoneRegex = /\+?\d[\d\s\-\(\)]{7,15}\d/
    // Indian PIN codes (6-digit starting with 1-9) and US Zip codes (5-digit)
    const pinRegex = /\b[1-9]\d{2}\s?\d{3}\b/
    
    // Address keyword list (must match backend sanitize_message exactly)
    const addressKeywords = [
      "street", "road", "lane", "sector", "apartment", "apt", "flat",
      "building", "house no", "h.no", "flat no", "nagar",
      "colony", "bazar", "pincode", "pin code"
    ]

    const containsPhone = phoneRegex.test(inputText)
    const containsPin = pinRegex.test(inputText)
    const containsAddressKeyword = addressKeywords.some((keyword) =>
      new RegExp(`\\b${keyword}\\b`, "i").test(inputText)
    )

    if (containsPhone || containsPin || containsAddressKeyword) {
      setShowWarning(true)
    } else {
      setShowWarning(false)
    }
  }, [inputText])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return
    sendMutation.mutate(inputText.trim())
  }

  const selectSession = (profileId: string) => {
    setSearchParams({ profile_id: profileId })
    setViewMode("chat")
  }

  const goBackToList = () => {
    setSearchParams({})
    setViewMode("list")
  }

  // Format message timestamps
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch {
      return ""
    }
  }

  // Format session date
  const formatSessionDate = (isoString: string) => {
    try {
      const date = new Date(isoString)
      const now = new Date()
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    } catch {
      return ""
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] lg:h-screen w-full bg-white overflow-hidden">
      {/* ── LEFT SIDEBAR (Sessions List) ── */}
      <div
        className={`w-full md:w-80 border-r border-[#e2e8f0] bg-slate-50/5 flex flex-col shrink-0 ${
          viewMode === "chat" ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="h-16 px-6 border-b border-[#e2e8f0] bg-white flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-[#0f172a]">
            Connection
          </h2>
          {sessions.length > 0 && (
            <span className="text-[10px] bg-slate-200 text-[#0f172a] font-extrabold rounded-full px-2 py-0.5">
              {sessions.length}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoadingSessions ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-[#0f172a]" />
              <span className="text-[10px] text-muted-foreground font-medium">Loading chats...</span>
            </div>
          ) : sessions.length > 0 ? (
            sessions.map((session) => {
              const isActive = session.profile.id === selectedProfileId
              const isUnread = session.unread_count > 0
              const partnerInitials = session.profile.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)

              return (
                <button
                  key={session.profile.id}
                  onClick={() => selectSession(session.profile.id)}
                  className={`w-full flex gap-3 p-3 rounded-xl items-center text-left transition-all duration-200 ${
                    isActive
                      ? "bg-slate-200/80 shadow-inner border-l-4 border-[#0f172a]"
                      : "hover:bg-slate-100/50"
                  }`}
                >
                  <Avatar className="h-10 w-10 border border-[#e2e8f0] shrink-0">
                    <AvatarImage src={session.profile.profile_photo_url} />
                    <AvatarFallback className="text-xs bg-[#f1f5f9] font-bold text-[#0f172a]">
                      {partnerInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="text-xs font-bold text-[#0f172a] truncate">
                        {session.profile.full_name}
                      </h4>
                      {session.last_message && (
                        <span className="text-[9px] text-[#64748b] shrink-0 font-medium">
                          {formatSessionDate(session.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <p className={`text-[11px] truncate flex-1 ${isUnread ? "font-bold text-[#0f172a]" : "text-[#64748b]"}`}>
                        {session.last_message?.content || "No messages yet"}
                      </p>
                      {isUnread && (
                        <span className="text-[8px] bg-emerald-500 text-white font-extrabold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                          {session.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          ) : (
            <div className="text-center py-12 px-4 space-y-2">
              <p className="text-xs text-[#64748b] font-semibold">No active chat connections.</p>
              <p className="text-[10px] text-muted-foreground leading-normal max-w-xs mx-auto">
                Once a connection request is accepted and approved by both parties, you will be able to message them here securely.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT WINDOW (Conversation Window) ── */}
      <div
        className={`flex-1 flex flex-col bg-white ${
          viewMode === "list" ? "hidden md:flex" : "flex"
        }`}
      >
        {selectedProfileId ? (
          <>
            {/* Window Header */}
            <div className="h-16 border-b border-[#e2e8f0] bg-white flex items-center px-4 shrink-0 gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={goBackToList}
                className="md:hidden h-9 w-9 text-[#0f172a] hover:bg-slate-100 shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-10 w-10 border border-[#e2e8f0] shrink-0">
                <AvatarImage src={activeSession?.profile.profile_photo_url} />
                <AvatarFallback className="text-xs bg-[#f1f5f9] font-bold text-[#0f172a]">
                  {activeSession?.profile.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-[#0f172a] truncate">
                  {activeSession?.profile.full_name || "Chat Partner"}
                </h3>
                {activeSession?.profile.username && (
                  <p className="text-[10px] text-[#64748b] font-mono leading-none">
                    @{activeSession.profile.username}
                  </p>
                )}
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]">
              {isLoadingMessages ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-[#0f172a]" />
                  <span className="text-xs text-muted-foreground">Loading message history...</span>
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg) => {
                  const isMe = msg.sender_profile_id !== selectedProfileId
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm text-xs relative ${
                          isMe
                            ? "bg-[#0f172a] text-white rounded-br-none"
                            : "bg-white border border-[#e2e8f0] text-[#0f172a] rounded-bl-none"
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-70">
                          <span>{formatTime(msg.created_at)}</span>
                          {isMe && (
                            msg.is_read ? (
                              <CheckCheck className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground gap-1">
                  <MessageCircle className="h-8 w-8 opacity-40 mb-1" />
                  <p className="text-xs font-bold text-[#0f172a]">Your conversation begins here</p>
                  <p className="text-[10px] max-w-xs leading-normal">
                    Send a friendly message to break the ice! Mobile numbers, addresses, and PIN codes are automatically masked for privacy.
                  </p>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>

            {/* Privacy warnings and Text Input panel */}
            <div className="p-4 border-t border-[#e2e8f0] bg-white space-y-2">
              {showWarning && (
                <div className="flex items-center gap-2 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <p className="leading-normal font-semibold">
                    Privacy Alert: Sharing mobile numbers or address components is blocked. Send will trigger automatic masking ([REDACTED]).
                  </p>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Type a secure message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-slate-50 border-[#e2e8f0] focus-visible:ring-[#0f172a]"
                  maxLength={1000}
                />
                <Button
                  type="submit"
                  disabled={!inputText.trim() || sendMutation.isPending}
                  className="bg-[#0f172a] text-white hover:bg-[#1e293b] shrink-0"
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/30">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4 border border-[#e2e8f0]">
              <MessageCircle className="h-8 w-8" />
            </div>
            <h3 className="text-sm font-bold text-[#0f172a]">Select a Connection</h3>
            <p className="text-xs text-[#64748b] max-w-xs mt-1 leading-normal font-medium">
              Choose a connection from the left sidebar to open a focused, privacy-first conversation window.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
