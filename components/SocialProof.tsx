"use client";

import React from 'react';

const clinics = [
  "Neuralink Health",
  "Behavioral Independence",
  "Ausome Behaviors",
  "Balanced Behaviorists",
  "Envision Pediatric",
  "Spectrum Care",
  "Thrive ABA"
];

const SocialProof = () => {
  return (
    <section className="w-full py-12 border-b border-slate-100 bg-white overflow-hidden flex flex-col items-center">
      <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8 text-center">
        Trusted by ABA Clinics Nationwide
      </p>

      {/* Marquee Container */}
      <div className="relative w-full max-w-[1140px] mx-auto overflow-hidden group">
        
        {/* Left/Right Gradient Fades for a smooth entrance/exit */}
        <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-white to-transparent z-10"></div>
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white to-transparent z-10"></div>

        {/* Scrolling Track */}
        <div className="flex whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused]">
          
          {/* First set of logos */}
          <div className="flex items-center justify-around shrink-0 min-w-full gap-16 px-8">
            {clinics.map((clinic, index) => (
              <span key={`set1-${index}`} className="text-xl md:text-2xl font-bold text-slate-300 transition-colors hover:text-swift-blue cursor-default">
                {clinic}
              </span>
            ))}
          </div>

          {/* Duplicated set for seamless infinite loop */}
          <div className="flex items-center justify-around shrink-0 min-w-full gap-16 px-8">
            {clinics.map((clinic, index) => (
              <span key={`set2-${index}`} className="text-xl md:text-2xl font-bold text-slate-300 transition-colors hover:text-swift-blue cursor-default">
                {clinic}
              </span>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default SocialProof;