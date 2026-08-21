import { Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Heart, ArrowRight, Users, Sparkles } from "lucide-react"

const features = [
  {
    icon: Heart,
    title: "Matrimony Matching",
    desc: "Connect with compatible life partners from within your trusted community. Smart recommendations based on your preferences.",
  },
  {
    icon: Users,
    title: "Community Verified",
    desc: "Every profile is manually verified by local community admins, ensuring genuine connections with real people.",
  },
  {
    icon: Sparkles,
    title: "Family Heritage",
    desc: "Explore family trees, preserve your lineage, and find matches who share your values and background.",
  },
]

export default function Landing() {
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      {/* Header */}
      <header className="w-full border-b border-[#e2e8f0] sticky top-0 z-40 bg-white/95">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0f172a] flex items-center justify-center">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="3.5" className="fill-white/10" />
                <circle cx="12" cy="4.5" r="2" />
                <circle cx="5" cy="9.5" r="2" />
                <circle cx="19" cy="9.5" r="2" />
                <circle cx="8" cy="18.5" r="2" />
                <circle cx="16" cy="18.5" r="2" />
                <path d="M12 8v1.5M6.5 11l2.5 1M17.5 11l-2.5 1M9 16.5l2-2M15 16.5l-2-2" />
              </svg>
            </div>
            <span className="font-extrabold text-lg tracking-tight notranslate" translate="no">Community Connect</span>
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link to={user?.role === "community_admin" || user?.role === "local_admin" ? "/admin/dashboard" : "/dashboard"}>
                <button className="bg-[#0f172a] text-white text-xs font-bold px-5 py-2 rounded-lg hover:bg-[#1e293b] transition-colors cursor-pointer h-9 flex items-center gap-1.5">
                  Dashboard <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block">
                  <button className="text-[#0f172a] text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#f8fafc] transition-colors cursor-pointer h-9">
                    Sign In
                  </button>
                </Link>
                <Link to="/register">
                  <button className="bg-[#0f172a] text-white text-xs font-bold px-5 py-2 rounded-lg hover:bg-[#1e293b] transition-colors cursor-pointer h-9">
                    Join Now
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-28 pb-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#e2e8f0] text-[10px] sm:text-xs font-bold text-[#64748b] mb-8">
            <Heart className="h-3 w-3 text-[#0f172a]" />
            Find Your Life Partner Within The Community
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-200 text-[10px] sm:text-xs font-bold text-green-700 mb-6">
            <span className="text-green-600">✨</span>
            Your 1st Month Is On Us — Completely Free
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight mb-6 text-[#0f172a]">
            Your Community, Your Match
          </h1>
          <p className="text-sm sm:text-base text-[#64748b] max-w-2xl mx-auto mb-10 leading-relaxed">
            <span translate="no" className="notranslate">Community Connect</span> helps you discover compatible life partners from within
            your trusted community network. Every profile verified, every match meaningful.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {isAuthenticated ? (
              <Link to="/matrimony">
                <button className="bg-[#0f172a] text-white text-xs font-bold px-8 py-3 rounded-xl hover:bg-[#1e293b] transition-colors cursor-pointer shadow-md w-56 h-11 flex items-center justify-center gap-2">
                  Browse Matches <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <button className="bg-[#0f172a] text-white text-xs font-bold px-8 py-3 rounded-xl hover:bg-[#1e293b] transition-colors cursor-pointer shadow-md w-56 h-11 flex items-center justify-center gap-2">
                    Create Your Profile <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <Link to="/login">
                  <button className="text-[#0f172a] text-xs font-bold px-8 py-3 rounded-xl border border-[#e2e8f0] hover:bg-[#f8fafc] transition-colors cursor-pointer w-56 h-11">
                    Sign In
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 border-t border-[#e2e8f0]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold mb-4 text-[#0f172a]">
            Find Your Match in 3 Steps
          </h2>
          <p className="text-sm text-[#64748b] mb-16 max-w-lg mx-auto">
            Simple, secure, and community-driven matrimony.
          </p>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: "1", title: "Create Profile", desc: "Sign up and build your matrimony profile with photos and preferences." },
              { step: "2", title: "Get Verified", desc: "Local admin verifies your identity so everyone can trust the community." },
              { step: "3", title: "Connect & Match", desc: "Browse verified profiles and connect with compatible matches." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#0f172a] text-white text-lg font-extrabold flex items-center justify-center mx-auto mb-5">
                  {item.step}
                </div>
                <h3 className="text-base font-bold mb-2 text-[#0f172a]">{item.title}</h3>
                <p className="text-xs text-[#64748b] leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-[#e2e8f0]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold mb-4 text-[#0f172a]">
              Built for Meaningful Connections
            </h2>
            <p className="text-sm text-[#64748b] max-w-xl mx-auto">
              Everything you need to find the right life partner within your community.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="text-left">
                <div className="w-10 h-10 rounded-lg border border-[#e2e8f0] flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-[#0f172a]" />
                </div>
                <h3 className="text-base font-bold mb-2 text-[#0f172a]">{f.title}</h3>
                <p className="text-xs text-[#64748b] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-[#e2e8f0] text-center">
        <div className="max-w-2xl mx-auto">
          <Heart className="h-10 w-10 text-[#0f172a] mx-auto mb-6" />
          <h2 className="text-3xl font-extrabold mb-3 text-[#0f172a]">
            Ready to find your match?
          </h2>
          <p className="text-sm text-[#64748b] mb-8 max-w-md mx-auto">
            Join <span translate="no" className="notranslate">Community Connect</span> and connect with verified profiles from your community.
          </p>
          {isAuthenticated ? (
            <Link to="/matrimony">
              <button className="bg-[#0f172a] text-white text-xs font-bold px-8 py-3 rounded-xl hover:bg-[#1e293b] transition-colors cursor-pointer shadow-md w-56 h-11">
                Browse Matches
              </button>
            </Link>
          ) : (
            <Link to="/register">
              <button className="bg-[#0f172a] text-white text-xs font-bold px-8 py-3 rounded-xl hover:bg-[#1e293b] transition-colors cursor-pointer shadow-md w-56 h-11">
                Get Started
              </button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e2e8f0] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0f172a] flex items-center justify-center">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="3.5" className="fill-white/10" />
                <circle cx="12" cy="4.5" r="2" />
                <circle cx="5" cy="9.5" r="2" />
                <circle cx="19" cy="9.5" r="2" />
                <circle cx="8" cy="18.5" r="2" />
                <circle cx="16" cy="18.5" r="2" />
                <path d="M12 8v1.5M6.5 11l2.5 1M17.5 11l-2.5 1M9 16.5l2-2M15 16.5l-2-2" />
              </svg>
            </div>
            <span className="font-bold text-[#0f172a] notranslate" translate="no">Community Connect</span>
          </div>
          <p className="text-xs text-[#64748b] font-semibold">
            &copy; {new Date().getFullYear()} <span translate="no" className="notranslate">Community Connect</span>. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
