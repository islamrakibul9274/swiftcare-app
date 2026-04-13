import React from 'react';

const metrics = [
  {
    id: 1,
    stat: "98%+",
    title: "Collection Rate",
    description: "Industry-leading claims collection ensures your clinic maximizes its hard-earned revenue without the constant back-and-forth.",
    color: "text-swift-blue",
    borderColor: "border-swift-blue"
  },
  {
    id: 2,
    stat: "< 1%",
    title: "Claim Denial Rate",
    description: "Our automated pre-submission scrubbing catches errors before they reach the payer, keeping your denial rate virtually non-existent.",
    color: "text-swift-green",
    borderColor: "border-swift-green"
  },
  {
    id: 3,
    stat: "8 Days",
    title: "Average Payment Time",
    description: "Stop waiting 30 to 60 days for reimbursements. SwiftCare accelerates your revenue cycle so you get paid in as little as 8 days.",
    color: "text-brand-indigo",
    borderColor: "border-brand-indigo"
  }
];

const BillingMetrics = () => {
  return (
    <section className="w-full py-20 lg:py-32 bg-white">
      <div className="max-w-[1140px] mx-auto px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-6 tracking-tight">
            Easy, Automated, Integrated Billing
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Get paid quickly for great work. SwiftCare’s best-in-class, integrated claims tool makes ABA billing a breeze, driving financial results that actually matter to your bottom line.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {metrics.map((metric) => (
            <div 
              key={metric.id} 
              className={`bg-white rounded-2xl p-8 shadow-lg border-t-4 ${metric.borderColor} hover:-translate-y-2 transition-transform duration-300`}
            >
              <div className={`text-5xl font-black mb-4 tracking-tighter ${metric.color}`}>
                {metric.stat}
              </div>
              <h3 className="text-xl font-bold text-brand-dark mb-3">
                {metric.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {metric.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default BillingMetrics;