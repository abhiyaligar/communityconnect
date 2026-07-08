import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Check,
  X,
  Plus,
  Loader2,
  Inbox,
  Clock,
  Shield
} from "lucide-react"
import { toast } from "sonner"

export default function MatrimonyRequests() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<"inbox" | "pending_approvals" | "guardian_view">("inbox")
  const [actioningId, setActioningId] = useState<string | null>(null)

  // Fetch actual pending requests
  const { data, isLoading } = useQuery<any>({
    queryKey: ["connection-requests-center"],
    queryFn: async () => {
      const res = await api.get("/matrimony/requests")
      return res.data
    },
    retry: false
  })

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approve" | "reject" }) => {
      await api.post(`/matrimony/requests/${id}/action`, { action })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connection-requests-center"] })
      toast.success("Request processed successfully.")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to process request.")
    }
  })

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActioningId(id)
    try {
      await actionMutation.mutateAsync({ id, action })
    } finally {
      setActioningId(null)
    }
  }

  // Calculate dynamic stats
  const incomingList = data?.incoming || []
  const outgoingList = data?.outgoing || []
  const allRequestsList = [...incomingList, ...outgoingList]

  const totalRequests = allRequestsList.length
  const newInterestsCount = incomingList.filter((r: any) => r.status === "pending_self_approval" || r.status === "pending_family_approval").length
  const connectedCount = allRequestsList.filter((r: any) => r.status === "approved").length
  const declinedCount = allRequestsList.filter((r: any) => r.status.startsWith("declined")).length

  // Guardian status
  const guardianName = user?.matrimony?.family_co_approver_name
  const guardianApproved = user?.matrimony?.family_co_approver_approved

  return (
    <div className="space-y-8 animate-fade-in text-[#0f172a]">
      {/* Header Panel */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0f172a]">
          Connection Requests
        </h1>
        <p className="text-sm text-[#64748b] mt-1 max-w-3xl">
          Manage incoming interests and monitor the status of ongoing connections. Guardian approvals are required for finalized steps.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#e2e8f0] gap-1 flex-wrap">
        <button
          onClick={() => setActiveTab("inbox")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "inbox"
              ? "border-[#0f172a] text-[#0f172a]"
              : "border-transparent text-[#64748b] hover:text-[#0f172a]"
          }`}
        >
          <Inbox className="h-4 w-4" />
          <span>Inbox ({incomingList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("pending_approvals")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "pending_approvals"
              ? "border-[#0f172a] text-[#0f172a]"
              : "border-transparent text-[#64748b] hover:text-[#0f172a]"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Pending Approvals ({newInterestsCount})</span>
        </button>
        <button
          onClick={() => setActiveTab("guardian_view")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "guardian_view"
              ? "border-[#0f172a] text-[#0f172a]"
              : "border-transparent text-[#64748b] hover:text-[#0f172a]"
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Guardian View</span>
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Requests List */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "inbox" && (
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-[#0f172a]" />
                </div>
              ) : incomingList.length > 0 ? (
                incomingList.map((req: any) => {
                  const initials = req.sender?.full_name?.split(" ").map((n: string) => n[0]).join("")
                  const showActionButtons = req.status === "pending_self_approval" || req.status === "pending_family_approval"

                  return (
                    <div
                      key={req.id}
                      className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm relative overflow-hidden space-y-4"
                    >
                      <div className="absolute top-6 right-6">
                        <span className="inline-flex px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#eceef0] text-[#0f172a]">
                          {req.status?.replace(/_/g, " ")}
                        </span>
                      </div>

                      <div className="flex gap-4 items-start">
                        <Avatar className="h-12 w-12 border border-[#e2e8f0] shadow-sm shrink-0">
                          <AvatarImage src={req.sender?.profile_photo_url} />
                          <AvatarFallback className="text-xs bg-[#f1f5f9] font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-sm text-[#0f172a]">
                            {req.sender?.full_name}
                          </h4>
                          <p className="text-xs text-[#64748b] leading-tight font-medium">
                            Connection proposal received.
                          </p>
                        </div>
                      </div>

                      {showActionButtons && (
                        <div className="flex gap-2">
                          <Button
                            className="bg-[#0f172a] text-white hover:bg-[#1e293b] text-xs font-semibold px-4 h-9 gap-1.5 rounded-lg"
                            onClick={() => handleAction(req.id, "approve")}
                            disabled={actioningId === req.id}
                          >
                            {actioningId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            <span>Approve Interest</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="border-[#e2e8f0] text-[#0f172a] text-xs font-semibold px-4 h-9 gap-1.5 rounded-lg"
                            onClick={() => handleAction(req.id, "reject")}
                            disabled={actioningId === req.id}
                          >
                            <X className="h-4 w-4" />
                            <span>Decline</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-20 bg-white border border-[#e2e8f0] rounded-2xl shadow-sm text-[#64748b] text-xs font-medium">
                  No connection proposals in your inbox.
                </div>
              )}
            </div>
          )}

          {activeTab !== "inbox" && (
            <div className="text-center py-20 bg-white border border-[#e2e8f0] rounded-2xl shadow-sm text-[#64748b] text-xs font-medium">
              No items inside this tab views.
            </div>
          )}
        </div>

        {/* Right Column: Stack of Cards */}
        <div className="space-y-8">
          {/* Card 1: My Guardians */}
          <Card className="border border-[#e2e8f0] rounded-2xl shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-[#e2e8f0] pb-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#0f172a]" /> My Guardians
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="divide-y divide-[#e2e8f0]">
                {guardianName ? (
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-[#e2e8f0] bg-[#eceef0] shrink-0 text-xs font-bold flex items-center justify-center text-[#0f172a]">
                        {guardianName.split(" ").map((n: string) => n[0]).join("")}
                      </Avatar>
                      <div>
                        <h4 className="text-xs font-bold text-[#0f172a]">{guardianName}</h4>
                        <p className="text-[10px] text-[#64748b] font-medium">
                          {guardianApproved ? "Active Guardian" : "Awaiting Acceptance"}
                        </p>
                      </div>
                    </div>
                    {guardianApproved && <Check className="h-4 w-4 text-[#10b981] font-extrabold shrink-0" />}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-[#64748b]">
                    No family guardian designated yet.
                  </div>
                )}
              </div>

              {/* Add Guardian Button */}
              <button 
                onClick={() => navigate("/matrimony/edit")}
                className="w-full py-2.5 rounded-xl border border-dashed border-[#c6c6cd] hover:bg-[#f8fafc] text-xs font-bold text-[#64748b] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Guardian</span>
              </button>
            </CardContent>
          </Card>

          {/* Card 2: Activity Summary */}
          <Card className="border border-[#e2e8f0] rounded-2xl shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-[#e2e8f0] pb-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
                <Inbox className="h-4 w-4 text-[#0f172a]" /> Activity Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Stats 1: Total Proposals */}
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 text-center space-y-1">
                  <p className="text-2xl font-extrabold text-[#0f172a]">{totalRequests}</p>
                  <p className="text-[9px] uppercase font-bold text-[#64748b] tracking-wider">Proposals</p>
                </div>

                {/* Stats 2: New Interests */}
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 text-center space-y-1">
                  <p className="text-2xl font-extrabold text-[#0f172a]">{newInterestsCount}</p>
                  <p className="text-[9px] uppercase font-bold text-[#64748b] tracking-wider">Awaiting</p>
                </div>

                {/* Stats 3: Connected */}
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 text-center space-y-1">
                  <p className="text-2xl font-extrabold text-[#10b981]">{connectedCount}</p>
                  <p className="text-[9px] uppercase font-bold text-[#64748b] tracking-wider">Connected</p>
                </div>

                {/* Stats 4: Declined */}
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 text-center space-y-1">
                  <p className="text-2xl font-extrabold text-[#ba1a1a]">{declinedCount}</p>
                  <p className="text-[9px] uppercase font-bold text-[#64748b] tracking-wider">Declined</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
