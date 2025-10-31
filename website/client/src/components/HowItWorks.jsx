const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-gray-900/30">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
          Simple & Powerful
        </h2>
        <p className="text-xl text-gray-400 mb-16">
          Get started in three easy steps
        </p>

        <div className="space-y-12">
          {/* Step 1 */}
          <div className="flex items-start gap-6 text-left">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-green-500/50">
              1
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white mb-2">Install the Extension</h3>
              <p className="text-lg text-gray-400">Download and add VynceAI to your browser in one click</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-6 text-left">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-emerald-500/50">
              2
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white mb-2">Activate with Voice</h3>
              <p className="text-lg text-gray-400">Press the hotkey and speak your command naturally</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-6 text-left">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-teal-500 to-green-600 rounded-full flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-teal-500/50">
              3
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white mb-2">Watch It Work</h3>
              <p className="text-lg text-gray-400">VynceAI executes your task automatically while you relax</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
