// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import { BottomNav } from "@/components/BottomNav";
import { WelcomeScreen } from "@/components/ui/branding/WelcomeScreen";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const viewport: Viewport = {
  themeColor: "#FAFAFA",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://glowscans-ai.vercel.app"),
  title: "GlowScan — AI Skin Analyser | Clinical Grade Screening",
  description:
    "Advanced AI face scan for clinical-grade skin analysis. Detect concerns, calculate your Glow Score, and get a personalized routine in 30 seconds.",
  keywords: [
    "AI Skin Analysis",
    "Face Scan",
    "Skincare Routine",
    "Fitzpatrick Scale",
    "Dermatologist AI",
    "Skin Health Metrics",
    "Clinical Skin Screening",
    "AI Dermatology",
    "Skin Condition Analysis",
  ],
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
    description:
      "Get a clinical-grade face scan and personalized skincare routine in 30 seconds.",
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
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                name: "GlowScan",
                applicationCategory: "HealthApplication",
                operatingSystem: "All",
                description:
                  "AI-powered clinical skin diagnostics and personalized skincare planning.",
                offers: {
                  "@type": "Offer",
                  price: "199.00",
                  priceCurrency: "INR",
                },
              }),
            }}
          />
        </head>
        <body
          className={`${poppins.variable} font-[var(--font-poppins)] selection:bg-[#A377D2]/20`}
        >
          <WelcomeScreen />
          <div className="flex flex-col min-h-[100dvh] w-full max-w-[480px] mx-auto relative bg-[#FAFAFA] overflow-x-hidden">
            <main className="flex-1 flex flex-col relative">{children}</main>
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
