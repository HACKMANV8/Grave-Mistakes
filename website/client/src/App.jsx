import './App.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import TrustedBy from './components/TrustedBy'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import CTA from './components/CTA'
import Footer from './components/Footer'
import LiquidEther from './components/LiquidEther'
import LoadingScreen from './components/LoadingScreen'
import ScrollToTop from './components/ScrollToTop'

function App() {
  return (
    <>
      <ScrollToTop />
      <LoadingScreen />
      
      <div className="relative min-h-screen bg-black text-white">
        {/* Liquid Ether Background - Fixed full screen */}
        <div className="fixed inset-0 w-full h-full z-0">
          <LiquidEther
            colors={['#22c55e', '#10b981', '#14b8a6']} // green-500, emerald-500, teal-500
            mouseForce={20}
            cursorSize={100}
            isViscous={false}
            viscous={30}
            iterationsViscous={32}
            iterationsPoisson={32}
            resolution={0.5}
            isBounce={false}
            autoDemo={true}
            autoSpeed={0.3}
            autoIntensity={1.8}
            takeoverDuration={0.25}
            autoResumeDelay={3000}
            autoRampDuration={0.6}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Content - Relative positioning for stacking above background */}
        <div className="relative z-10">
          <Navbar />
          <Hero />
          <TrustedBy />
          <Features />
          <HowItWorks />
          <CTA />
          <Footer />
        </div>
      </div>
    </>
  )
}

export default App
