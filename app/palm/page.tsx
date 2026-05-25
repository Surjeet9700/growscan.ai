"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowLeft, Hand } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";

const CameraCapture = dynamic(
  () => import("@/components/CameraCapture").then((m) => m.CameraCapture),
  {
    ssr: false,
    loading: () => (
      <div className="w-full aspect-[3/4] bg-black/5 rounded-[32px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#A377D2]" />
          <p className="text-[11px] font-semibold text-[#9A9A9A] uppercase tracking-[0.15em]">
            Activating camera...
          </p>
        </div>
      </div>
    ),
  }
);

const STAGES = [
  "Scanning palm lines...",
  "Mapping heart line...",
  "Tracing head line...",
  "Reading life line...",
  "Interpreting fate line...",
  "Generating your reading...",
];

export default function PalmScanPage() {
  const [analyzing, setAnalyzing] = useState(false);
  const [stage, setStage] = useState(0);
  const router = useRouter();

  const cycleStages = () => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      if (i < STAGES.length) setStage(i);
      else clearInterval(id);
    }, 1500);
    return id;
  };

  const handleCapture = async (base64String: string) => {
    triggerHaptic("medium");
    setAnalyzing(true);
    setStage(0);
    const intervalId = cycleStages();

    try {
      const response = await fetch("/api/palm/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64String }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not analyze palm.");
      }

      if (result.error) throw new Error(result.error);

      sessionStorage.setItem("palm_result", JSON.stringify(result));
      sessionStorage.setItem("palm_image", base64String);

      clearInterval(intervalId);
      triggerHaptic("success");
      setTimeout(() => router.push("/palm/result"), 500);
    } catch (error: unknown) {
      clearInterval(intervalId);
      const message = error instanceof Error ? error.message : "Analysis failed";
      toast.error("Palm Reading Failed", { description: message });
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1B1722_0%,#2C233A_38%,#1A1A1A_100%)] font-[var(--font-poppins)] text-white">

      {/* Header */}
      <div className="px-5 pt-14 pb-3 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
        >
          <ArrowLeft className="w-[18px] h-[18px] text-white" strokeWidth={2} />
        </button>
        <h1 className="text-[17px] font-black text-white">Palm Reading</h1>
        <div className="w-10" />
      </div>

      {/* Instructions */}
      {!analyzing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-5 mb-4"
        >
          <div className="rounded-[20px] bg-white/[0.06] border border-white/[0.08] px-5 py-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-[12px] bg-[#A377D2]/20 flex items-center justify-center">
                <Hand className="w-[18px] h-[18px] text-[#A377D2]" />
              </div>
              <p className="text-[14px] font-bold text-white">How to scan your palm</p>
            </div>
            <div className="space-y-2">
              {[
                "Open your dominant hand flat",
                "Face your palm toward the camera",
                "Ensure good lighting on your palm",
                "Keep your hand steady in the frame",
              ].map((tip, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#A377D2]/20 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-[#A377D2]">{i + 1}</span>
                  </div>
                  <p className="text-[12px] text-white/70">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Camera */}
      <div className="px-5 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key="camera"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 22 }}
            className="relative"
          >
            <CameraCapture onCaptureAction={handleCapture} disabled={analyzing} />

            {/* Hand outline overlay */}
            {!analyzing && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                <svg
                  viewBox="0 0 200 260"
                  className="w-[60%] max-w-[200px] opacity-20"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                >
                  {/* Simplified hand outline */}
                  <path d="M100 250 C60 250, 30 220, 30 180 L30 120 C30 110, 40 100, 50 100 L50 60 C50 40, 65 30, 75 40 L75 100 L80 40 C80 20, 95 10, 105 20 L100 100 L110 30 C110 10, 125 5, 130 20 L120 100 L135 50 C140 35, 155 35, 155 55 L140 120 L170 130 C185 135, 185 155, 170 165 L140 180 L140 220 C140 240, 120 250, 100 250 Z" />
                  {/* Palm lines hint */}
                  <path d="M55 140 Q80 130, 130 140" opacity="0.3" />
                  <path d="M50 160 Q90 150, 135 165" opacity="0.3" />
                  <path d="M70 180 Q100 170, 120 190" opacity="0.3" />
                </svg>
              </div>
            )}

            {/* Analysis overlay */}
            <AnimatePresence>
              {analyzing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 rounded-[32px] bg-black/90 backdrop-blur-lg z-50 flex flex-col items-center justify-center gap-5"
                >
                  <div className="relative w-28 h-28">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-full border border-dashed border-[#A377D2]/25"
                    />
                    <div className="absolute inset-3 rounded-full border-4 border-[#A377D2]/20 border-t-[#A377D2] animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#A377D2]/20 flex items-center justify-center">
                        <Hand className="w-6 h-6 text-[#A377D2]" />
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-[16px] font-black text-white mb-2">Reading your palm</p>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={stage}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="text-[12px] font-semibold text-[#A377D2]"
                      >
                        {STAGES[stage]}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
