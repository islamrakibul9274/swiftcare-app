import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";
const inter = Inter({ subsets: ["latin"], display: "swap" });
export const metadata: Metadata = {
  title: { default: "SwiftCare | More space for care", template: "%s" },
  description:
    "A connected workspace for ABA sessions, clinical documentation, treatment progress, and practice operations.",
  metadataBase: new URL(
    process.env.AUTH_URL || "https://swiftcare-app.vercel.app",
  ),
  openGraph: {
    title: "SwiftCare — More space for care",
    description:
      "Connect your care team, from the first observation to a reviewed clinical note.",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
};
const themeScript = `(function(){try{var t=localStorage.getItem('swiftcare-theme')||'light';document.documentElement.dataset.theme=t==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t}catch(e){}})()`;
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
