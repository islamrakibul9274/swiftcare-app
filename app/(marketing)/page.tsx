import Image from "next/image";
import SocialProof from "@/components/SocialProof";
import FeatureAIPilot from "@/components/FeatureAIPilot";
import BillingMetrics from "@/components/BillingMetrics";
import Testimonials from "@/components/Testimonials";



export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white overflow-hidden">

      {/* Hero Section */}
      <section className="relative w-full max-w-[1140px] mx-auto px-8 py-16 lg:py-24 flex flex-col lg:flex-row items-center justify-between">

        {/* Background Pattern (Optional) 
            If you have the subtle curved line background SVG, it would go here with absolute positioning.
        */}

        {/* Left Column: Text Content */}
        <div className="w-full lg:w-1/2 flex flex-col items-start text-left z-10">
          <h1 className="text-[3rem] md:text-6xl lg:text-[4rem] font-bold text-[#1a1a1a] tracking-tight leading-[1.05] mb-6 max-w-[600px]">
            The Leading ABA Software for New and Growing Providers
          </h1>

          <p className="text-lg md:text-[1.15rem] text-slate-600 leading-relaxed mb-8 max-w-[540px]">
            SwiftCare’s modern, all-in-one ABA software helps BCBAs easily create client programs, schedule sessions, and quickly get reimbursed for services. Learn more why hundreds of clinics are partnering with SwiftCare to see their clinics soar.
          </p>

          <button className="bg-[#4e44c2] hover:bg-[#3f36a3] text-white text-[17px] font-medium py-3.5 px-8 rounded-md transition-colors shadow-sm">
            Schedule a Demo
          </button>
        </div>

        {/* Right Column: Device Mockups */}
        <div className="w-full lg:w-1/2 mt-16 lg:mt-0 relative flex justify-center lg:justify-end z-10">
          {/* Make sure 'hero-mockups.png' is saved in your /public directory */}
          <div className="relative w-full max-w-[700px] aspect-[4/3]">
            <Image
              src="/hero-mockups.png"
              alt="SwiftCare Platform Mockups on Laptop and Mobile"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

      </section>

      {/* Next Section Goes Here */}
      {/* Social Proof Marquee */}
      <SocialProof />
      <FeatureAIPilot />

      {/* Financial/Billing Metrics Grid */}
      <BillingMetrics />

      {/* Testimonials */}
      <Testimonials />

    

    </div>
  );
}