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
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">

      <div className="relative w-full max-w-lg text-center">
        {/* Icon */}
        <div className="relative mx-auto w-16 h-16 mb-8">
          <div className="w-16 h-16 rounded-full bg-secondary border border-border flex items-center justify-center">
            <Clock className="h-8 w-8 text-foreground" />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-3">
          Verification Pending
        </h1>
        <p className="text-muted-foreground mb-2">
          Hi <strong>{user?.full_name}</strong>! Your registration was successful.
        </p>
        <p className="text-muted-foreground mb-10">
          Your membership is currently being reviewed by a community administrator.
          You'll gain full access once approved.
        </p>

        {/* Steps */}
        <Card className="border border-border shadow-none bg-card text-left mb-8">
          <CardContent className="p-6 space-y-6">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-4">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  s.done
                    ? "bg-primary text-primary-foreground"
                    : i === 1
                    ? "bg-secondary border border-border text-foreground"
                    : "bg-muted border border-border text-muted-foreground"
                }`}>
                  {s.done ? (
                    <CheckCircle className="h-4.5 w-4.5" />
                  ) : i === 1 ? (
                    <Clock className="h-4.5 w-4.5" />
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </div>
                <div className="flex-1 pt-0.5">
                  <p className={`font-semibold text-xs mb-0.5 ${s.done ? "text-foreground" : i === 1 ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-normal">{s.desc}</p>
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
