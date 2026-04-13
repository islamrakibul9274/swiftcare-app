import React from 'react';

const FeatureAIPilot = () => {
  return (
    <section className="w-full py-20 lg:py-32 bg-slate-50 overflow-hidden">
      <div className="max-w-[1140px] mx-auto px-8 flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
        
        {/* Left Column: Copy & Value Prop */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center">
          <div className="inline-block px-4 py-1.5 bg-blue-100 text-swift-blue font-semibold rounded-full text-sm mb-6 w-max">
            SwiftCare AI
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-dark leading-tight mb-6">
            Your AI-Powered Clinical Co-Pilot
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed mb-8">
            Stop managing data. Let SwiftCare's AI do it for you. From session notes drafted in real time to intelligent progress tracking across every client, SwiftCare surfaces the insights you need—so you can practice at the top of your license.
          </p>
          
          <ul className="space-y-4 mb-10">
            {[
              "Automated Session Notes",
              "Real-time Behavioral Trend Analysis",
              "Spend less time at the keyboard"
            ].map((item, i) => (
              <li key={i} className="flex items-center text-slate-700 font-medium">
                <svg className="w-5 h-5 text-swift-green mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
                {item}
              </li>
            ))}
          </ul>

          <button className="text-brand-indigo font-semibold hover:text-brand-indigo-hover transition-colors flex items-center group w-max">
            Explore AI Capabilities
            <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
            </svg>
          </button>
        </div>

        {/* Right Column: Abstract UI Mockup */}
        <div className="w-full lg:w-1/2 relative">
          {/* Decorative background blur */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-swift-blue/20 blur-3xl rounded-full"></div>
          
          {/* Main Mockup Card */}
          <div className="relative bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 md:p-8 z-10 transform transition hover:-translate-y-1 duration-500">
            {/* Mockup Header */}
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-slate-400">JD</span>
                </div>
                <div>
                  <div className="h-4 w-32 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 w-20 bg-slate-100 rounded"></div>
                </div>
              </div>
              <div className="h-8 w-24 bg-indigo-50 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-brand-indigo">GENERATING...</span>
              </div>
            </div>

            {/* Mockup Content (Simulating AI Typing) */}
            <div className="space-y-4">
              <div className="flex space-x-2">
                <div className="h-4 w-full bg-slate-100 rounded"></div>
                <div className="h-4 w-4/5 bg-slate-100 rounded"></div>
              </div>
              <div className="flex space-x-2">
                <div className="h-4 w-5/6 bg-slate-100 rounded"></div>
                <div className="h-4 w-full bg-slate-100 rounded"></div>
              </div>
              <div className="flex space-x-2 w-3/4">
                <div className="h-4 w-full bg-swift-blue/20 rounded animate-pulse"></div>
                <div className="h-4 w-1/2 bg-swift-blue/20 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Mockup Floating Action Button */}
            <div className="absolute -bottom-6 -right-6 bg-brand-dark text-white p-4 rounded-xl shadow-xl flex items-center space-x-3">
              <svg className="w-6 h-6 text-swift-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span className="font-semibold text-sm">Note Approved</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default FeatureAIPilot;