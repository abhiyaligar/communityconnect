function App() {
  return (
    <div className="min-h-screen bg-surface-50">
      {/* Hero Section — Verifies Tailwind is working */}
      <div className="relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-3xl mx-auto animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-sm font-medium mb-6 animate-scale-in">
              <span className="w-2 h-2 bg-accent-500 rounded-full animate-pulse" />
              Connecting communities everywhere
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold leading-tight mb-6 text-surface-900">
              Empower Your{' '}
              <span className="text-gradient">Local Community</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-surface-500 leading-relaxed mb-10 max-w-2xl mx-auto">
              CommunityConnect brings people together. Discover, engage, and build
              stronger neighborhoods through shared events, discussions, and collaboration.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="btn-primary py-3.5 px-8 text-base group">
                Get Started Free
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <button className="btn-secondary py-3.5 px-8 text-base">
                Explore Communities
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-4 text-surface-900">
              Everything You Need to{' '}
              <span className="text-gradient">Connect</span>
            </h2>
            <p className="text-lg text-surface-500 max-w-2xl mx-auto">
              Powerful tools designed to help your community thrive and grow together.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Build Communities',
                desc: 'Create and join communities that match your interests and passions.',
                gradient: 'from-primary-500 to-primary-600',
                icon: (
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
              },
              {
                title: 'Organize Events',
                desc: 'Plan and discover local events to bring your community together.',
                gradient: 'from-accent-500 to-accent-600',
                icon: (
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
              },
              {
                title: 'Stay Connected',
                desc: 'Engage in meaningful discussions and share ideas with your neighbors.',
                gradient: 'from-purple-500 to-purple-600',
                icon: (
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ),
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="glass-card p-8 hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 group cursor-pointer"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-heading font-bold mb-3 text-surface-900">{feature.title}</h3>
                <p className="text-surface-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 px-8 py-16 sm:px-16 text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-4">
                Ready to Connect?
              </h2>
              <p className="text-lg text-primary-100 mb-8 max-w-xl mx-auto">
                Join thousands of people building stronger, more vibrant communities.
              </p>
              <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-primary-700 font-semibold text-base shadow-xl hover:shadow-2xl hover:bg-primary-50 active:scale-[0.98] transition-all duration-200 cursor-pointer group">
                Start Your Journey
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-sm font-heading font-semibold text-surface-700">
                CommunityConnect
              </span>
            </div>
            <p className="text-sm text-surface-400">
              &copy; {new Date().getFullYear()} CommunityConnect. Made with ❤️
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
