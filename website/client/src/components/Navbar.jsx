const Navbar = () => {
  return (
    <nav className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50">
      <div className="relative group">
        {/* Glow effect behind navbar */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* Main navbar with glassy effect */}
        <div className="relative bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full px-12 py-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none"></div>
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"></div>
          </div>
          
          {/* Navigation links */}
          <div className="relative flex items-center gap-12">
            <a href="#" className="relative text-white hover:text-green-400 transition-all duration-300 font-medium text-base group/link">
              <span className="relative z-10">Home</span>
              <span className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-green-400 to-emerald-400 scale-x-0 group-hover/link:scale-x-100 transition-transform duration-300 origin-left"></span>
            </a>
            <a href="#features" className="relative text-white hover:text-green-400 transition-all duration-300 font-medium text-base group/link">
              <span className="relative z-10">Features</span>
              <span className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-green-400 to-emerald-400 scale-x-0 group-hover/link:scale-x-100 transition-transform duration-300 origin-left"></span>
            </a>
            <a href="#how-it-works" className="relative text-white hover:text-green-400 transition-all duration-300 font-medium text-base group/link">
              <span className="relative z-10">How It Works</span>
              <span className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-green-400 to-emerald-400 scale-x-0 group-hover/link:scale-x-100 transition-transform duration-300 origin-left"></span>
            </a>
            <a href="#download" className="relative text-white hover:text-green-400 transition-all duration-300 font-medium text-base group/link">
              <span className="relative z-10">Download</span>
              <span className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-green-400 to-emerald-400 scale-x-0 group-hover/link:scale-x-100 transition-transform duration-300 origin-left"></span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
