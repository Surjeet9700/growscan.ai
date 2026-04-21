// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Poppins, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";
import { ClerkProvider, SignInButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { WelcomeScreen } from "@/components/ui/branding/WelcomeScreen";
import { GlowLogo } from "@/components/ui/branding/GlowLogo";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins" 
});
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-serif" });

export const viewport: Viewport = {
  themeColor: "#F6F6F6", // Neutral Stage
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://glowscans-ai.vercel.app"),
  title: "GlowScan — AI Skin Analyser | Clinical Grade Screening",
  description: "Advanced AI face scan for clinical-grade skin analysis. Detect concerns, calculate your Glow Score, and get a personalized routine in 30 seconds.",
  keywords: ["AI Skin Analysis", "Face Scan", "Skincare Routine", "Fitzpatrick Scale", "Dermatologist AI", "Skin Health Metrics", "Clinical Skin Screening", "AI Dermatology", "Skin Condition Analysis"],
  manifest: "/manifest.json",
  openGraph: {
    title: "GlowScan — AI Skin Analyser",
    description: "Advanced AI face scan for clinical-grade skin analysis.",
    url: "https://glowscans-ai.vercel.app",
    siteName: "GlowScan",
    images: [{ url: "/icon-512.png", width: 512, height: 512 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GlowScan — AI Skin Analyser",
    description: "Get a clinical-grade face scan and personalized skincare routine in 30 seconds.",
    images: ["/icon-512.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon.png", sizes: "512x512", type: "image/png" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { userId } = await auth();

  return (
    <ClerkProvider>
      <html lang="en" data-scroll-behavior="smooth">
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": "GlowScan",
                "applicationCategory": "HealthApplication",
                "operatingSystem": "All",
                "description": "AI-powered clinical skin diagnostics and personalized skincare planning.",
                "offers": {
                  "@type": "Offer",
                  "price": "199.00",
                  "priceCurrency": "INR"
                }
              })
            }}
          />
        </head>
        <body className={`${poppins.variable} ${instrument.variable} font-poppins selection:bg-[#A377D2]/20`}>
          <WelcomeScreen />
          <div className="flex flex-col min-h-[100dvh] w-full max-w-md mx-auto relative bg-[#FBFBFD] bg-noise shadow-2xl overflow-x-hidden">
            {/* Minimal Sticky Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-black/5 flex h-16 items-center px-6 justify-between transition-all">
              <Link href="/" className="group flex items-center gap-3">
                <div className="w-10 h-10 rounded-[14px] bg-white border border-black/[0.03] shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex items-center justify-center group-active:scale-90 transition-transform">
                  <GlowLogo size={24} />
                </div>
                <h1 className="text-xl font-black tracking-[-0.04em] text-[#2F2F30] font-poppins">GLOWSCAN</h1>
              </Link>
              <div className="flex items-center gap-3">
                {!userId ? (
                  <SignInButton mode="modal"><span className="text-sm font-bold bg-black text-white px-4 py-2 rounded-full active:scale-95 transition-all cursor-pointer">Sign In</span></SignInButton>
                ) : (
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-9 h-9 border-2 border-white shadow-sm ring-1 ring-black/5",
                      },
                    }}
                  />
                )}
              </div>
            </header>
            
            <main className="flex-1 flex flex-col relative">
              {children}
            </main>
            
            <BottomNav />
            <Toaster position="top-center" richColors />
          </div>
          <Script
            src="https://checkout.razorpay.com/v1/checkout.js"
            strategy="afterInteractive"
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
