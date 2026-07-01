import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, CheckCircle, Phone, LogOut } from "lucide-react"

const steps = [
  { icon: CheckCircle, title: "Registration Complete", desc: "Your account has been created and your verification request has been submitted.", done: true },
  { icon: Clock, title: "Under Review", desc: "A local admin or community admin will review your profile and verify your membership.", done: false },
  { icon: CheckCircle, title: "Full Access Granted", desc: "Once verified, you'll have full access to all community features.", done: false },
]

export default function PendingVerification() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg text-center">
        {/* Icon */}
        <div className="relative mx-auto w-24 h-24 mb-8">
          <div className="w-24 h-24 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Clock className="h-12 w-12 text-amber-400" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white animate-ping" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-3">
          Verification <span className="gradient-text">Pending</span>
        </h1>
        <p className="text-muted-foreground mb-2">
          Hi <strong>{user?.full_name}</strong>! Your registration was successful.
        </p>
        <p className="text-muted-foreground mb-10">
          Your membership is currently being reviewed by a community administrator.
          You'll gain full access once approved.
        </p>

        {/* Steps */}
        <Card className="glass-card text-left mb-8">
          <CardContent className="p-6 space-y-6">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  s.done
                    ? "gradient-primary"
                    : i === 1
                    ? "bg-amber-500/20 border border-amber-500/30"
                    : "bg-muted border border-border"
                }`}>
                  {s.done ? (
                    <CheckCircle className="h-5 w-5 text-white" />
                  ) : i === 1 ? (
                    <Clock className="h-5 w-5 text-amber-400" />
                  ) : (
                    <span className="text-xs text-muted-foreground font-bold">{i + 1}</span>
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <p className={`font-semibold text-sm mb-1 ${s.done ? "text-foreground" : i === 1 ? "text-amber-400" : "text-muted-foreground"}`}>
                    {s.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            Contact your region's admin for faster verification
          </div>
        </div>

        <Button
          variant="ghost"
          className="mt-6 text-muted-foreground gap-2"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  )
}
