// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";
import { ClerkProvider, SignInButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";

const outfit = Outfit({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#FAF9F6", // Warm White/Cream
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "GlowScan — AI Skin Analyser",
  description: "Get a clinical-grade face scan and personalized skincare routine in 30 seconds.",
  manifest: "/manifest.json",
  openGraph: {
    title: "GlowScan — AI Skin Analyser",
    description: "Get a clinical-grade face scan and personalized skincare routine in 30 seconds.",
    url: "https://glowscan.app", // User will need to change this if domain different
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
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { userId } = await auth();

  return (
    <ClerkProvider>
      <html lang="en" data-scroll-behavior="smooth">
        <body className={outfit.className}>
          <div className="flex flex-col min-h-[100dvh] w-full max-w-md mx-auto relative bg-background shadow-2xl overflow-x-hidden">
            {/* Minimal Sticky Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-black/5 flex h-16 items-center px-6 justify-between transition-all">
              <Link href="/" className="group flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center group-active:scale-95 transition-transform">
                  <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                </div>
                <h1 className="text-xl font-black tracking-tighter text-primary">GLOW</h1>
              </Link>
              <div className="flex items-center gap-3">
                {!userId ? (
                  <SignInButton mode="modal">
                    <button className="text-sm font-bold bg-black text-white px-4 py-2 rounded-full active:scale-95 transition-all">
                      Sign In
                    </button>
                  </SignInButton>
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
