import React from "react";
import Navbar from "@/components/Navbar"; // Adjust path if needed
import Footer from "@/components/Footer"; // Adjust path if needed

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="pt-24 flex-1">{children}</main>
      <Footer />
    </div>
  );
}