import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import api from "@/lib/api"
import ReactMarkdown from "react-markdown"

export default function NDA() {
  const navigate = useNavigate()
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/legal/nda").then((res) => {
      setContent(res.data.content)
    }).catch(() => {
      setContent("Failed to load NDA.")
    }).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0f172a]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" className="mb-4 text-xs font-semibold" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Card className="border border-[#e2e8f0] bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-[#0f172a]">Non-Disclosure Agreement</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none text-[#334155]">
            <ReactMarkdown>{content}</ReactMarkdown>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
