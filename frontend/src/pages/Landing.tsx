import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Users,
  Shield,
  Heart,
  CheckCircle,
  ArrowRight,
  Globe,
  Star,
  Zap,
} from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "Verified Community",
    desc: "Every member is manually verified to ensure authenticity and trust within the community.",
    color: "text-foreground",
    bg: "bg-muted border-border",
  },
  {
    icon: Heart,
    title: "Matrimony Platform",
    desc: "Connect with compatible partners from within your trusted community network.",
    color: "text-foreground",
    bg: "bg-muted border-border",
  },
  {
    icon: Users,
    title: "Family Trees",
    desc: "Map and preserve your family heritage across generations in a beautiful digital format.",
    color: "text-foreground",
    bg: "bg-muted border-border",
  },
  {
    icon: Globe,
    title: "Regional Connect",
    desc: "Stay connected with members from your region, managed by trusted local administrators.",
    color: "text-foreground",
    bg: "bg-muted border-border",
  },
]

const stats = [
  { value: "5,000+", label: "Verified Members" },
  { value: "12", label: "Regions Covered" },
  { value: "300+", label: "Families Connected" },
  { value: "98%", label: "Trust Score" },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-24 px-4">
        {/* Background glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-accent/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-primary/5 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary border border-border text-xs font-semibold text-foreground mb-8">
            <Star className="h-3 w-3 fill-foreground text-foreground" />
            Trusted by Communities Nationwide
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Your Community, Connected
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            CommunityConnect brings your community together — verified members,
            family trees, matrimony matching, and region-level governance all in
            one secure, minimal platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto font-medium">
                Join Your Community
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto font-medium">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="relative max-w-4xl mx-auto mt-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-card border border-border rounded-xl p-5 text-center"
              >
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 border-t border-border bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-xs text-muted-foreground mb-6">
              <Zap className="h-3 w-3 text-foreground" />
              Why CommunityConnect
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Built for your community
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm">
              Every feature is designed to strengthen connections, preserve heritage,
              and empower communities to self-govern.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="bg-card border border-border hover:shadow-md transition-shadow group">
                <CardContent className="p-6">
                  <div className={`w-10 h-10 rounded-lg border ${f.bg} flex items-center justify-center mb-4`}>
                    <f.icon className={`h-5 w-5 ${f.color}`} />
                  </div>
                  <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 border-t border-border bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold mb-4">
            Join in 3 simple steps
          </h2>
          <p className="text-muted-foreground text-sm mb-16">Getting started is quick and easy</p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Register", desc: "Sign up with your email and complete your profile with verified details." },
              { step: "02", title: "Get Verified", desc: "A local admin or community admin reviews and approves your membership." },
              { step: "03", title: "Connect", desc: "Access all community features — matrimony, family trees, and regional connections." },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="bg-card border border-border rounded-xl p-6 h-full text-left">
                  <div className="text-3xl font-black text-muted-foreground/30 mb-3">{item.step}</div>
                  <h3 className="text-base font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-border bg-secondary/10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-card border border-border rounded-2xl p-10 relative overflow-hidden">
            <CheckCircle className="h-10 w-10 text-foreground mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-3">Ready to connect?</h2>
            <p className="text-muted-foreground text-sm mb-8">
              Join thousands of verified community members today.
            </p>
            <Link to="/register">
              <Button size="lg" className="font-medium">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded gradient-primary flex items-center justify-center">
              <Users className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold gradient-text">CommunityConnect</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CommunityConnect. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
