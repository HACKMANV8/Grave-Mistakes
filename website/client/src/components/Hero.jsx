import GradualBlur from './GradualBlur';
import DecryptedText from './DecryptedText';
import logo from '../assets/v.png';
import { installExtension } from '../utils/downloadExtension';

const Hero = () => {
  const handleMacDownload = () => {
    installExtension('mac');
  };

  const handleWindowsDownload = () => {
    installExtension('windows');
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-8 pb-32">      
      <div className="relative max-w-7xl mx-auto px-6 py-12 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={logo} alt="VynceAI" className="w-24 h-24" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-full px-4 py-2 mb-6">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-sm text-gray-300">Now Available for Chrome</span>
        </div>

        {/* Main Heading with Encrypted Animation */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          <span className="block text-white mb-2">
            <DecryptedText
              text="Meet VynceAI"
              animateOn="view"
              sequential={true}
              revealDirection="start"
              speed={30}
              characters="@#$%&*0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
              className="text-white"
              encryptedClassName="text-green-400/50"
            />
          </span>
          <span className="block bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
            <DecryptedText
              text="Your AI Web Assistant"
              animateOn="view"
              sequential={true}
              revealDirection="start"
              speed={25}
              characters="@#$%&*0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
              className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent"
              encryptedClassName="text-emerald-400/40"
            />
          </span>
        </h1>

        {/* Subtitle with Encrypted Animation */}
        <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
          <DecryptedText
            text="Command your browser with voice. Automate tasks instantly."
            animateOn="view"
            sequential={true}
            revealDirection="start"
            speed={20}
            characters="@#$%&*0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
            className="text-gray-400"
            encryptedClassName="text-gray-600/50"
          />
          <br />
          <DecryptedText
            text="Browse smarter with AI-powered assistance."
            animateOn="view"
            sequential={true}
            revealDirection="start"
            speed={20}
            characters="@#$%&*0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
            className="text-gray-400"
            encryptedClassName="text-gray-600/50"
          />
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button 
            onClick={handleMacDownload}
            className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black font-semibold rounded-xl transition-all duration-200 shadow-xl shadow-green-500/30 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
            </svg>
            <span>Get for Mac</span>
          </button>
          <button 
            onClick={handleWindowsDownload}
            className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black font-semibold rounded-xl transition-all duration-200 shadow-xl shadow-green-500/30 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
            </svg>
            <span>Get for Windows</span>
          </button>
        </div>

        {/* Demo Visual - Placeholder for video */}
        <div className="relative max-w-6xl mx-auto mt-12 mb-32">
          <div className="relative rounded-2xl overflow-hidden border border-gray-800 shadow-2xl shadow-green-500/10">
            {/* Browser chrome */}
            <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-1 mx-4 bg-gray-800/50 rounded-md px-4 py-1.5 text-sm text-gray-500">
                vynceai.com
              </div>
            </div>
            
            {/* Content area - Video will go here */}
            <div className="aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-t from-green-900/10 via-transparent to-transparent"></div>
              
              {/* Centered icon/content */}
              <div className="relative z-10 text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-3xl flex items-center justify-center border border-green-500/30 backdrop-blur-sm">
                  <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">Voice-Activated Browser Control</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <GradualBlur
        position="bottom"
        height="10rem"
        strength={4}
        divCount={8}
        curve="bezier"
        exponential={true}
        opacity={1}
      />
    </section>
  )
}

export default Hero
