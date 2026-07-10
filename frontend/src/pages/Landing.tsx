import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTheme } from "@/contexts/ThemeContext"
import { useAuth } from "@/contexts/AuthContext"
import {
  Shield,
  Heart,
  CheckCircle,
  Globe,
  Star,
  Zap,
  Sun,
  Moon,
  ArrowRight,
  Sparkles
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
    icon: Sparkles,
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
  const { theme, setTheme } = useTheme()
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="min-h-screen relative overflow-hidden bg-background text-foreground transition-colors duration-300">
      {/* Simple Background */}
      <div className="absolute inset-0 bg-background -z-10" />

      {/* Header Bar */}
      <header className="w-full border-b border-border/40 bg-background/55 backdrop-blur-md sticky top-0 z-40 stagger-fade-in-1">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-sm ${
              theme === "dark" ? "border-neutral-800 bg-neutral-900/60" : "border-border/80 bg-card/60"
            }`}>
              <svg className="h-4.5 w-4.5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="3.5" className="fill-foreground/10" />
                <circle cx="12" cy="4.5" r="2" />
                <circle cx="5" cy="9.5" r="2" />
                <circle cx="19" cy="9.5" r="2" />
                <circle cx="8" cy="18.5" r="2" />
                <circle cx="16" cy="18.5" r="2" />
                <path d="M12 8v1.5M6.5 11l2.5 1M17.5 11l-2.5 1M9 16.5l2-2M15 16.5l-2-2" />
              </svg>
            </div>
            <span className="font-extrabold text-lg tracking-tight text-foreground">CommunityConnect</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-xl border border-border bg-card/50 text-foreground hover:bg-secondary transition-all duration-300 shadow-sm cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-500 animate-pulse" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700" />
              )}
            </button>

            {isAuthenticated ? (
              <Link to={user?.role === "community_admin" || user?.role === "local_admin" ? "/admin/dashboard" : "/dashboard"}>
                <Button size="sm" className="font-bold hover-scale cursor-pointer gap-1.5 h-9 rounded-lg">
                  Dashboard <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="font-bold hover-scale cursor-pointer h-9 rounded-lg">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="font-bold hover-scale cursor-pointer h-9 rounded-lg">
                    Join Community
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-6 text-center max-w-4xl mx-auto">
        {/* Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card/45 border border-border/80 text-[10px] sm:text-xs font-bold text-foreground mb-8 shadow-sm stagger-fade-in-1 select-none">
          <Star className="h-3 w-3 fill-foreground text-foreground" />
          Trusted by Communities Nationwide
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight mb-6 stagger-fade-in-2">
          Your Community, Connected
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed stagger-fade-in-3">
          CommunityConnect brings your community together — verified members,
          family trees, matrimony matching, and region-level governance all in
          one secure, minimal platform.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center stagger-fade-in-4">
          {isAuthenticated ? (
            <Link to={user?.role === "community_admin" || user?.role === "local_admin" ? "/admin/dashboard" : "/dashboard"}>
              <Button size="lg" className="w-56 h-11 text-xs font-bold shadow-md hover-scale rounded-xl gap-2 cursor-pointer">
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/register">
                <Button size="lg" className="w-56 h-11 text-xs font-bold shadow-md hover-scale rounded-xl gap-2 cursor-pointer">
                  Join Your Community <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="w-56 h-11 text-xs font-bold border border-border bg-card/30 hover-scale rounded-xl cursor-pointer">
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Stats Grid */}
        <div className="max-w-4xl mx-auto mt-20 stagger-fade-in-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl p-5 text-center shadow-sm"
              >
                <p className="text-2xl sm:text-3xl font-extrabold text-foreground">{stat.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-semibold uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 border-t border-border/40 bg-secondary/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border text-xs text-muted-foreground mb-6 font-semibold shadow-sm">
              <Zap className="h-3.5 w-3.5 text-foreground" />
              Why CommunityConnect
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              Built for your community
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-xs sm:text-sm">
              Every feature is designed to strengthen connections, preserve heritage,
              and empower communities to self-govern.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="bg-card/45 backdrop-blur-md border border-border/80 hover:shadow-md transition-shadow group rounded-2xl hover-scale cursor-pointer">
                <CardContent className="p-6 flex flex-col items-start text-left">
                  <div className={`w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <f.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="text-base font-bold mb-2 text-foreground">{f.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed font-medium">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 border-t border-border/40 bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold mb-4">
            Join in 3 simple steps
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm mb-16">Getting started is quick and easy</p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Register", desc: "Sign up with your email and complete your profile with verified details." },
              { step: "02", title: "Get Verified", desc: "A local admin or community admin reviews and approves your membership." },
              { step: "03", title: "Connect", desc: "Access all community features — matrimony, family trees, and regional connections." },
            ].map((item) => (
              <div key={item.step} className="relative hover-scale cursor-pointer">
                <div className="bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl p-6 h-full text-left shadow-sm">
                  <div className="text-3xl font-black text-muted-foreground/30 mb-3">{item.step}</div>
                  <h3 className="text-base font-bold mb-2 text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-20 px-6 border-t border-border/40 bg-secondary/15">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-card/45 backdrop-blur-md border border-border/80 rounded-[24px] p-8 sm:p-12 relative overflow-hidden shadow-lg hover-scale cursor-pointer">
            <CheckCircle className="h-10 w-10 text-foreground mx-auto mb-6" />
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Ready to connect?</h2>
            <p className="text-muted-foreground text-xs sm:text-sm mb-8 font-medium">
              Join thousands of verified community members today.
            </p>
            {isAuthenticated ? (
              <Link to={user?.role === "community_admin" || user?.role === "local_admin" ? "/admin/dashboard" : "/dashboard"}>
                <Button size="lg" className="w-56 h-11 text-xs font-bold rounded-xl shadow-md cursor-pointer">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/register">
                <Button size="lg" className="w-56 h-11 text-xs font-bold rounded-xl shadow-md cursor-pointer">
                  Get Started Free
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-6 bg-background">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shadow-sm ${
              theme === "dark" ? "border-neutral-800 bg-neutral-900/60" : "border-border/80 bg-card/60"
            }`}>
              <svg className="h-4.5 w-4.5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="3.5" className="fill-foreground/10" />
                <circle cx="12" cy="4.5" r="2" />
                <circle cx="5" cy="9.5" r="2" />
                <circle cx="19" cy="9.5" r="2" />
                <circle cx="8" cy="18.5" r="2" />
                <circle cx="16" cy="18.5" r="2" />
                <path d="M12 8v1.5M6.5 11l2.5 1M17.5 11l-2.5 1M9 16.5l-2-2M15 16.5l2-2" />
              </svg>
            </div>
            <span className="font-bold text-foreground">CommunityConnect</span>
          </div>
          <p className="text-xs text-muted-foreground font-semibold">
            © {new Date().getFullYear()} CommunityConnect. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
