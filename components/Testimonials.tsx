import React from 'react';

const testimonials = [
  {
    id: 1,
    quote: "SwiftCare has completely transformed how we operate. The AI session notes alone save our RBTs hours every week. It's effortless, intuitive, and highly accurate.",
    author: "Sarah Jenkins",
    role: "Clinical Director",
    clinic: "Comfortable Living ABA"
  },
  {
    id: 2,
    quote: "Our claim denial rate plummeted after switching to SwiftCare. The automated pre-submission checks mean we get paid in under 14 days consistently. Highly recommend.",
    author: "David Chen",
    role: "Practice Owner",
    clinic: "Crescent Bloom Autism Services"
  },
  {
    id: 3,
    quote: "The mobile-first design is exactly what our in-home therapists needed. Data collection offline is seamless, and syncing it back to the BCBA dashboard is instant.",
    author: "Elena Rodriguez",
    role: "BCBA",
    clinic: "Pair Tree Behavioral Health"
  }
];

const Testimonials = () => {
  return (
    <section className="w-full py-20 lg:py-32 bg-slate-50">
      <div className="max-w-[1140px] mx-auto px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4 tracking-tight">
            Trusted by ABA Clinics Nationwide
          </h2>
          <p className="text-lg text-slate-600">
            See why modern therapy providers are making the switch to SwiftCare to reduce admin overhead and focus on client care.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item) => (
            <div 
              key={item.id} 
              className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 flex flex-col justify-between"
            >
              {/* Quote Icon */}
              <div className="text-swift-blue opacity-50 mb-6">
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>
              
              <p className="text-slate-700 text-lg leading-relaxed mb-8 grow">
                "{item.quote}"
              </p>
              
              <div className="flex items-center space-x-4 border-t border-slate-100 pt-4 mt-auto">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-brand-indigo font-bold text-lg">
                  {item.author.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-brand-dark">{item.author}</h4>
                  <p className="text-sm text-slate-500">{item.role}, {item.clinic}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Testimonials;