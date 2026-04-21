"use client";

import { SignIn } from "@clerk/nextjs";
import { GlowLogo } from "@/components/ui/branding/GlowLogo";
import { motion } from "framer-motion";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#F6F6F6] flex flex-col items-center justify-center px-6 relative overflow-hidden font-poppins">
      
      {/* Background Zen Primitives */}
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-[#A377D2]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-[#A377D2]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Hero Branding Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center mb-10 z-10"
      >
        <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center shadow-[0_8px_32px_rgba(163,119,210,0.08)] border border-black/[0.02] mb-6">
          <GlowLogo size={42} />
        </div>
        <h1 className="text-[28px] font-black text-[#2F2F30] tracking-tight mb-2">
          Skin Intelligence
        </h1>
        <p className="text-sm font-medium text-black/40 text-center max-w-[240px] leading-relaxed">
          Sign in to access your forensic dermatological dashboard.
        </p>
      </motion.div>

      {/* Auth Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm z-10"
      >
        <SignIn
          forceRedirectUrl="/scan"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-white/70 backdrop-blur-xl shadow-[0_24px_48px_rgba(0,0,0,0.04)] border border-white/40 rounded-[32px] p-2",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "rounded-[20px] border-black/[0.04] bg-white hover:bg-[#F6F1FB] hover:border-[#A377D2]/20 transition-all text-xs font-bold text-[#2F2F30] h-12 shadow-sm",
              socialButtonsBlockButtonText: "font-bold",
              formButtonPrimary: "bg-[#A377D2] hover:bg-[#A377D2]/90 rounded-[20px] h-12 text-sm font-black tracking-wide shadow-[0_8px_20px_rgba(163,119,210,0.25)] transition-all",
              footerActionLink: "text-[#A377D2] hover:text-[#A377D2]/80 font-bold",
              formFieldInput: "rounded-[16px] border-black/[0.04] bg-white/50 h-11 text-sm focus:ring-[#A377D2]/20 focus:border-[#A377D2]/20 transition-all",
              formFieldLabel: "text-[10px] font-black uppercase tracking-widest text-black/30 mb-1 ml-1",
              dividerLine: "bg-black/[0.04]",
              dividerText: "text-[10px] font-bold text-black/20 uppercase tracking-widest",
              identityPreviewText: "text-sm font-bold text-[#2F2F30]",
              identityPreviewEditButtonIcon: "text-[#A377D2]",
            },
          }}
        />
      </motion.div>

      {/* Institutional Footer */}
      <div className="mt-12 text-center z-10">
        <p className="text-[10px] font-bold text-black/20 uppercase tracking-[0.2em]">
          Powered by GlowScan Vision AI
        </p>
      </div>

    </div>
  );
}

