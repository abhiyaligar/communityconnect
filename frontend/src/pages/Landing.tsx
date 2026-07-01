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
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  {
    icon: Heart,
    title: "Matrimony Platform",
    desc: "Connect with compatible partners from within your trusted community network.",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  {
    icon: Users,
    title: "Family Trees",
    desc: "Map and preserve your family heritage across generations in a beautiful digital format.",
    color: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/20",
  },
  {
    icon: Globe,
    title: "Regional Connect",
    desc: "Stay connected with members from your region, managed by trusted local administrators.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/30 text-sm font-medium text-primary mb-8 animate-fade-in">
            <Star className="h-3.5 w-3.5 fill-primary" />
            Trusted by Communities Nationwide
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 animate-fade-in">
            Your Community,{" "}
            <span className="gradient-text">Connected</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in">
            CommunityConnect brings your community together — verified members,
            family trees, matrimony matching, and region-level governance all in
            one secure platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            <Link to="/register">
              <Button variant="gradient" size="xl" className="gap-2 w-full sm:w-auto">
                Join Your Community <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="xl" className="w-full sm:w-auto">
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
                className="glass-card rounded-xl p-5 text-center"
              >
                <p className="text-3xl font-bold gradient-text">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 text-sm text-muted-foreground mb-6">
              <Zap className="h-3.5 w-3.5 text-accent" />
              Why CommunityConnect
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Built for your <span className="gradient-text">community</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every feature is designed to strengthen connections, preserve heritage,
              and empower communities to self-govern.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="glass-card hover:border-primary/20 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl border ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <f.icon className={`h-6 w-6 ${f.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-gradient-to-b from-transparent to-card/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Join in <span className="gradient-text">3 simple steps</span>
          </h2>
          <p className="text-muted-foreground mb-16">Getting started is quick and easy</p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Register", desc: "Sign up with your phone number and complete your profile with verified details." },
              { step: "02", title: "Get Verified", desc: "A local admin or community admin reviews and approves your membership." },
              { step: "03", title: "Connect", desc: "Access all community features — matrimony, family trees, and regional connections." },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="glass-card rounded-2xl p-8 h-full">
                  <div className="text-5xl font-black gradient-text opacity-30 mb-4">{item.step}</div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-card rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 gradient-primary opacity-5 rounded-3xl" />
            <CheckCircle className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">Ready to connect?</h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of verified community members today.
            </p>
            <Link to="/register">
              <Button variant="gradient" size="xl" className="gap-2">
                Get Started Free <ArrowRight className="h-5 w-5" />
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
