import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SessionProvider } from "next-auth/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SwiftCare | Modern ABA Practice Management",
  description: "The all-in-one practice management system redefining ABA therapy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <SessionProvider>
          {/* <Navbar /> */}
          <main className=" min-h-screen"> 
            {children}
          </main>
          {/* <Footer /> */}
        </SessionProvider>
      </body>
    </html>
  );
}