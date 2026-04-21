"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Sparkles, ShieldCheck } from "lucide-react";
import { GlowLogo } from "@/components/ui/branding/GlowLogo";

const STAGES = [
  { text: "Analysing your skin zones...", sub: "Reading forehead & cheek patterns" },
  { text: "Mapping pigmentation...", sub: "Checking T-zone & under-eye area" },
  { text: "Calculating ingredient matches...", sub: "Cross-referencing 200+ compounds" },
  { text: "Building your daily protocol...", sub: "Morning & night routine sequencing" },
  { text: "Finalising your report...", sub: "Almost ready ✨" },
];

export function ProcessingOverlay({ isOpen }: { isOpen: boolean }) {
  const [stageIdx, setStageIdx] = useState(0);
  const [showLongWait, setShowLongWait] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setStageIdx((prev) => (prev + 1) % STAGES.length);
    }, 4000);

    const timeout = setTimeout(() => {
      setShowLongWait(true);
    }, 25000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-forensic/95 backdrop-blur-xl flex flex-col items-center justify-center px-6 overflow-hidden"
        >
          {/* Clinical Scan Line */}
          <motion.div 
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#A377D2]/20 to-transparent z-50 pointer-events-none"
          />
          {/* ── BACKGROUND SKELETON (Blurred) ── */}
          <div className="absolute inset-x-8 inset-y-12 opacity-10 blur-md pointer-events-none space-y-8">
             <div className="h-40 w-full skeleton-premium rounded-[32px]" />
             <div className="flex gap-4">
                <div className="h-32 flex-1 skeleton-premium rounded-[32px]" />
                <div className="h-32 flex-1 skeleton-premium rounded-[32px]" />
                <div className="h-32 flex-1 skeleton-premium rounded-[32px]" />
             </div>
             <div className="h-64 w-full skeleton-premium rounded-[32px]" />
          </div>

          {/* ── DIAGNOSTIC RINGS ── */}
          <div className="relative w-32 h-32 flex items-center justify-center mb-12">
            <div className="ring-pulse pulse-ring-1 w-full h-full" />
            <div className="ring-pulse pulse-ring-2" />
            <div className="ring-pulse pulse-ring-3" />
            <div className="relative z-10 w-20 h-20 bg-white rounded-full shadow-2xl flex items-center justify-center border border-black/5">
              <GlowLogo size={28} />
            </div>
          </div>

          {/* ── PROGRESS TEXT ── */}
          <div className="text-center relative z-10 max-w-xs">
            <AnimatePresence mode="wait">
              <motion.div
                key={stageIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-xl font-black text-ink mb-2">
                  {STAGES[stageIdx].text}
                </h3>
                <p className="text-sm font-medium text-black/40">
                  {STAGES[stageIdx].sub}
                </p>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {showLongWait && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-12 p-5 bg-ink/5 rounded-3xl border border-black/5 text-center"
                >
                  <p className="text-[10px] font-black text-black/20 uppercase tracking-widest mb-2">
                    Taking longer than usual
                  </p>
                  <p className="text-xs font-semibold text-black/60 leading-relaxed mb-4">
                    High traffic detected. Please don't refresh — your personalized routine is almost finished.
                  </p>
                  <a 
                    href="mailto:support@glowscan.ai" 
                    className="inline-flex items-center gap-2 text-[10px] font-black text-amber-600 hover:text-amber-700 transition-colors uppercase tracking-tighter"
                  >
                    <Mail className="w-3 h-3" />
                    Support: support@glowscan.ai
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── BOTTOM STICKER ── */}
          <div className="absolute bottom-12 flex flex-col items-center gap-3">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-black/30">Secure Cloud Analysis</span>
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
