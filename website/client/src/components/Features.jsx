import GradualBlur from './GradualBlur';

const Features = () => {
  return (
    <section id="features" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Feature 1 - Voice Control */}
        <div className="relative grid md:grid-cols-2 gap-16 items-center mb-32" style={{position: 'relative'}}>
          <GradualBlur
            position="bottom"
            height="8rem"
            strength={3}
            divCount={6}
            curve="bezier"
            exponential={true}
            opacity={1}
          />
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl mb-6">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Voice-Activated Control
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed">
              Command your browser naturally with voice. No typing required - just speak what you want, and VynceAI executes it instantly.
            </p>
          </div>
          <div className="relative">
            <div className="aspect-video bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl border border-green-500/20 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-green-500/10 via-transparent to-transparent"></div>
              <div className="w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center animate-pulse relative z-10">
                <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2 - Smart Automation */}
        <div className="relative grid md:grid-cols-2 gap-16 items-center mb-32" style={{position: 'relative'}}>
          <GradualBlur
            position="bottom"
            height="8rem"
            strength={3}
            divCount={6}
            curve="bezier"
            exponential={true}
            opacity={1}
          />
          <div className="order-2 md:order-1 relative">
            <div className="aspect-video bg-gradient-to-bl from-emerald-500/5 to-teal-500/5 rounded-2xl border border-emerald-500/20 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tl from-emerald-500/10 via-transparent to-transparent"></div>
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center relative z-10">
                <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl mb-6">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Lightning-Fast Automation
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed">
              Automate repetitive tasks in seconds. Fill forms, navigate websites, and complete workflows without manual effort.
            </p>
          </div>
        </div>

        {/* Feature 3 - Privacy */}
        <div className="relative grid md:grid-cols-2 gap-16 items-center" style={{position: 'relative'}}>
          <GradualBlur
            position="bottom"
            height="8rem"
            strength={3}
            divCount={6}
            curve="bezier"
            exponential={true}
            opacity={1}
          />
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500/10 to-green-500/10 rounded-2xl mb-6">
              <svg className="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Privacy-First Design
            </h2>
            <p className="text-xl text-gray-400 leading-relaxed">
              All processing happens locally in your browser. Your data never leaves your device, ensuring complete privacy and security.
            </p>
          </div>
          <div className="relative">
            <div className="aspect-video bg-gradient-to-br from-teal-500/5 to-green-500/5 rounded-2xl border border-teal-500/20 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/10 via-transparent to-transparent"></div>
              <div className="w-24 h-24 bg-gradient-to-br from-teal-500/20 to-green-500/20 rounded-full flex items-center justify-center relative z-10">
                <svg className="w-12 h-12 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

export default Features
