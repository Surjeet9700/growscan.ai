"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ShieldCheck, ArrowLeft, Info } from "lucide-react";
import Link from "next/link";

// CRITICAL: SSR: false prevents hydration crash on mobile
const CameraCapture = dynamic(
  () => import("@/components/CameraCapture").then((m) => m.CameraCapture),
  {
    ssr: false,
    loading: () => (
      <div className="w-full max-w-sm mx-auto aspect-[3/4] bg-neutral-100 rounded-[40px] flex items-center justify-center border-8 border-white shadow-xl">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-black/20" />
          <p className="text-xs font-black uppercase tracking-widest text-black/40">Initializing Lens...</p>
        </div>
      </div>
    ),
  }
);

const STAGES = [
  "Detecting face structure...",
  "Reading skin texture...",
  "Mapping hydration zones...",
  "Checking pores & pigmentation...",
  "Generating your report...",
];

export default function ScanPage() {
  const [showQuestionnaire, setShowQuestionnaire] = useState(true);
  const [qStep, setQStep] = useState(0);
  const [qData, setQData] = useState({ age: "", concern: "", habits: "" });
  
  const [analyzing, setAnalyzing] = useState(false);
  const [stage, setStage] = useState(0);
  const router = useRouter();

  const cycleStages = () => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      if (i < STAGES.length) setStage(i);
      else clearInterval(id);
    }, 1200);
    return id;
  };

  const handleCapture = async (base64String: string) => {
    setAnalyzing(true);
    setStage(0);
    const intervalId = cycleStages();

    try {
      const response = await fetch("/api/analyse/free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          imageBase64: base64String,
          context: qData
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data?.error ?? "Analysis failed");
      }

      clearInterval(intervalId);
      localStorage.setItem("glowscan_image", base64String);
      localStorage.setItem("glowscan_free", JSON.stringify({ ...data, timestamp: Date.now() }));

      // History
      try {
        const prev = JSON.parse(localStorage.getItem("glowscan_history") ?? "[]");
        const updated = [{
          id: Date.now().toString(),
          timestamp: Date.now(),
          glow_score: data.glow_score,
          skin_type: data.skin_type,
          top_concern: data.top_concern,
        }, ...prev].slice(0, 20);
        localStorage.setItem("glowscan_history", JSON.stringify(updated));
      } catch {}

      setTimeout(() => router.push("/result/free"), 500);

    } catch (error: any) {
      clearInterval(intervalId);
      toast.error("Analysis Failed", { description: error.message });
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── HEADER ───────────────────────────────────────────────────── */}
      <div className="px-6 pt-6 flex items-center justify-between">
         <Link href="/">
           <button className="w-10 h-10 rounded-full bg-white border border-black/5 flex items-center justify-center text-black/60 shadow-sm active:scale-95 transition-all">
             <ArrowLeft className="w-5 h-5" />
           </button>
         </Link>
         <div className="pill-status">
            Step 1 of 2
         </div>
      </div>

      <div className="px-6 pt-8 pb-6 text-center">
        <h1 className="text-3xl font-black text-ink">Skin Scan</h1>
        <p className="text-black/40 font-medium mt-1">
          {analyzing ? STAGES[stage] : "Align your face within the markers"}
        </p>
      </div>

      {/* ── QUESTIONNAIRE / CAMERA ────────────────────────────────────── */}
      <div className="px-4 relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {showQuestionnaire ? (
            <motion.div
              key="q-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-sm mx-auto bg-white rounded-[40px] p-8 shadow-xl border border-black/5"
            >
              {qStep === 0 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Question 1/3</span>
                    <h2 className="text-2xl font-black text-ink mt-2">What is your age range?</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {["Under 20", "20-35", "35-50", "Over 50"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => { setQData({ ...qData, age: opt }); setQStep(1); }}
                        className="w-full p-4 rounded-2xl bg-black/5 hover:bg-black/10 text-sm font-bold text-ink transition-colors text-left flex justify-between items-center"
                      >
                        {opt}
                        <ArrowLeft className="w-4 h-4 rotate-180 opacity-20" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {qStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Question 2/3</span>
                    <h2 className="text-2xl font-black text-ink mt-2">Your main skin concern?</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {["Acne & Pimples", "Dullness & Tan", "Aging & Wrinkles", "Dark Spots / PIH"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => { setQData({ ...qData, concern: opt }); setQStep(2); }}
                        className="w-full p-4 rounded-2xl bg-black/5 hover:bg-black/10 text-sm font-bold text-ink transition-colors text-left flex justify-between items-center"
                      >
                        {opt}
                        <ArrowLeft className="w-4 h-4 rotate-180 opacity-20" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {qStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Question 3/3</span>
                    <h2 className="text-2xl font-black text-ink mt-2">Daily water intake?</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {["Less than 1L", "1L - 2L", "More than 2L"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => { 
                          setQData({ ...qData, habits: opt }); 
                          setShowQuestionnaire(false);
                        }}
                        className="w-full p-4 rounded-2xl bg-black/5 hover:bg-black/10 text-sm font-bold text-ink transition-colors text-left flex justify-between items-center"
                      >
                        {opt}
                        <ArrowLeft className="w-4 h-4 rotate-180 opacity-20" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="camera"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 20 }}
            >
              <CameraCapture onCaptureAction={handleCapture} disabled={analyzing} />
            </motion.div>
          )}

          {analyzing && (
            <motion.div
              key="analyzing-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-x-0 inset-y-0 rounded-[40px] bg-white/80 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-8 text-center"
            >
               <div className="relative mb-8">
                  <div className="w-20 h-20 rounded-full border-4 border-black/5 border-t-black animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-black animate-pulse" />
                     </div>
                  </div>
               </div>
               <h3 className="text-xl font-black text-ink mb-2">Neural Analysis</h3>
               <p className="text-sm text-black/40 font-bold uppercase tracking-widest animate-pulse">
                  {STAGES[stage]}
               </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── FOOTER GUIDELINES ────────────────────────────────────────── */}
      <div className="px-8 mt-8 space-y-4">
         <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center shrink-0">
               <Info className="w-4 h-4 text-black/40" />
            </div>
            <p className="text-[11px] text-black/30 font-bold leading-relaxed">
               For best results, remove glasses and ensure you are in a brightly lit room with neutral lighting.
            </p>
         </div>
         <div className="flex items-center justify-center gap-2 pt-4">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-black/30">Privacy Protected · No Image Storage</span>
         </div>
      </div>
      
    </div>
  );
}
