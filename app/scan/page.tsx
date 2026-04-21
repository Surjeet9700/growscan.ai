"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ShieldCheck, ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { GlowLogo } from "@/components/ui/branding/GlowLogo";

// CRITICAL: SSR: false prevents hydration crash on mobile
const CameraCapture = dynamic(
  () => import("@/components/CameraCapture").then((m) => m.CameraCapture),
  {
    ssr: false,
    loading: () => (
      <div className="w-full max-w-sm mx-auto aspect-[3/4] bg-neutral-100 rounded-[40px] flex items-center justify-center border-8 border-white shadow-xl">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-black/20" />
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-black/40">Activating Scanner...</p>
        </div>
      </div>
    ),
  }
);

const STAGES = [
  "Setting up secure scan...",
  "Checking lighting balance...",
  "Analyzing skin texture...",
  "Evaluating skin clarity...",
  "Generating your plan...",
];

export default function ScanPage() {
  const [showQuestionnaire, setShowQuestionnaire] = useState(true);
  const [qStep, setQStep] = useState(0);
  const [qData, setQData] = useState({ age: "", concern: "", habits: "" });
  
  const [analyzing, setAnalyzing] = useState(false);
  const [stage, setStage] = useState(0);
  const [detectorReady, setDetectorReady] = useState(false);
  const router = useRouter();

  // ── PRE-LOAD MODELS ───────────────────────────────────────────────
  useEffect(() => {
    import("@/lib/faceDetector").then(({ preloadFaceDetector }) => {
      preloadFaceDetector().then(() => setDetectorReady(true));
    }).catch(console.error);
  }, []);

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
      // 1. Prepare Image Element for MediaPipe detection
      const img = new Image();
      const imageLoadPromise = new Promise<HTMLImageElement>((resolve) => {
        img.onload = () => resolve(img);
        img.src = base64String;
      });

      // 2. STAGE 1: Client-Side "Circuit Breaker" (Fast Feedback)
      const imageEl = await imageLoadPromise;
      const bespokeZones = await import("@/lib/faceDetector").then(m => m.detectZonePositions(imageEl));

      if (!bespokeZones) {
        throw new Error("LOW_SIGNAL_QUALITY");
      }

      // 3. STAGE 2: Cloud Analysis (Guarded by Success of Stage 1)
      const analysisResult = await fetch("/api/analyse/free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          imageBase64: base64String,
          context: qData
        }),
      }).then(res => res.json());

      if (analysisResult.error) {
        throw new Error(analysisResult.error);
      }
      
      const data = analysisResult;

      // 4. Merge coordinates into results
      if (data.face_zones) {
        data.face_zones = data.face_zones.map((zone: any) => {
          const coords = (bespokeZones as any)[zone.zone];
          return coords ? { ...zone, x: coords.x, y: coords.y } : zone;
        });
      }

      clearInterval(intervalId);
      localStorage.setItem("glowscan_image", base64String);
      localStorage.setItem("glowscan_free", JSON.stringify({ ...data, timestamp: Date.now() }));

      // 6. DB History Persistence (Privacy-first: No images)
      try {
        await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
             type: "free",
             result: {
                glow_score: data.glow_score,
                skin_type: data.skin_type,
                top_concern: data.top_concern,
                face_zones: data.face_zones, // Contains high-precision x/y points
                preview_insight: data.preview_insight
             }
          })
        });
      } catch (dbErr) {
        console.error("DB Save failed, falling back to LocalStorage:", dbErr);
      }

      // 7. LocalStorage Fallback (Legacy/Guest)
      try {
        const prev = JSON.parse(localStorage.getItem("glowscan_history") ?? "[]");
        const updated = [{
          id: Date.now().toString(),
          timestamp: Date.now(),
          glow_score: data.glow_score,
          skin_type: data.skin_type,
          top_concern: data.top_concern,
          preview_insight: data.preview_insight,
        }, ...prev].slice(0, 20);
        localStorage.setItem("glowscan_history", JSON.stringify(updated));
      } catch {}

      setTimeout(() => router.push("/result/free"), 500);

    } catch (error: any) {
      clearInterval(intervalId);
      
      const message = error.message === "LOW_SIGNAL_QUALITY" 
        ? "Face not detected. Please ensure you are in a bright room and holding the phone steady."
        : error.message;

      toast.error("Analysis Blocked", { description: message });
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-forensic font-poppins text-[#2F2F30]">
      {/* ── HEADER ───────────────────────────────────────────────────── */}
      <div className="px-5 pt-8 flex items-center justify-between">
         <Link href="/">
           <button className="w-12 h-12 rounded-[22px] bg-white border border-black/[0.02] flex items-center justify-center text-[#2F2F30]/60 shadow-[0_4px_12px_rgba(0,0,0,0.03)] active:scale-90 transition-transform">
             <ArrowLeft className="w-5 h-5" />
           </button>
         </Link>
         <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-black/[0.02] shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-[#A377D2] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#A377D2]">Active Diagnostic</span>
         </div>
      </div>

      <div className="px-6 pt-10 pb-6 text-center">
        <h1 className="text-[32px] font-black text-[#2F2F30] tracking-tight leading-tight">Skin Intelligence</h1>
        <div className="h-6 flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
              <motion.p 
                key={stage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="text-[10px] text-[#A377D2] font-black uppercase tracking-[0.2em]"
              >
              {analyzing ? STAGES[stage] : "Dermatological Assessment"}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* ── QUESTIONNAIRE / CAMERA ────────────────────────────────────── */}
      <div className="px-4 relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {showQuestionnaire ? (
            <motion.div
              key="q-form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm mx-auto p-2"
            >
              {/* Progress Bar (Wide Track) */}
              <div className="px-6 mb-8">
                 <div className="h-1 w-full bg-black/5 rounded-full relative overflow-hidden">
                    <motion.div 
                      className="absolute inset-y-0 left-0 bg-[#A377D2] rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${((qStep + 1) / 3) * 100}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    />
                 </div>
                 <div className="flex justify-between items-center mt-3">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A377D2]">Question {qStep + 1}/3</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20">{Math.round(((qStep + 1) / 3) * 100)}% Complete</span>
                 </div>
              </div>

              {qStep === 0 && (
                <div className="space-y-6">
                  <div className="px-4">
                    <h2 className="text-2xl font-black text-[#2F2F30] tracking-tight leading-tight">What is your<br/>age range?</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {["Under 20", "20-35", "35-50", "Over 50"].map((opt) => (
                      <motion.button
                        key={opt}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", damping: 25, stiffness: 400 }}
                        onClick={() => { setQData({ ...qData, age: opt }); setQStep(1); }}
                        className="w-full p-6 rounded-[28px] glass-ios border border-black/[0.02] shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:bg-[#F6F1FB] hover:border-[#A377D2]/10 text-sm font-bold text-[#2F2F30] transition-all text-left flex justify-between items-center active:scale-[0.98]"
                      >
                        {opt}
                        <div className="w-8 h-8 rounded-full bg-[#A377D2]/5 flex items-center justify-center">
                           <ArrowLeft className="w-4 h-4 rotate-180 text-[#A377D2]/40" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {qStep === 1 && (
                <div className="space-y-6">
                  <div className="px-4">
                    <h2 className="text-2xl font-black text-[#2F2F30] tracking-tight leading-tight">Your main<br/>skin concern?</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {["Acne & Pimples", "Dullness & Tan", "Aging & Wrinkles", "Dark Spots / PIH"].map((opt) => (
                      <motion.button
                        key={opt}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", damping: 25, stiffness: 400 }}
                        onClick={() => { setQData({ ...qData, concern: opt }); setQStep(2); }}
                        className="w-full p-6 rounded-[28px] glass-ios border border-black/[0.02] shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:bg-[#F6F1FB] hover:border-[#A377D2]/10 text-sm font-bold text-[#2F2F30] transition-all text-left flex justify-between items-center active:scale-[0.98]"
                      >
                        {opt}
                        <div className="w-8 h-8 rounded-full bg-[#A377D2]/5 flex items-center justify-center">
                           <ArrowLeft className="w-4 h-4 rotate-180 text-[#A377D2]/40" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {qStep === 2 && (
                <div className="space-y-6">
                  <div className="px-4">
                    <h2 className="text-2xl font-black text-[#2F2F30] tracking-tight leading-tight">Daily water<br/>intake?</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {["Less than 1L", "1L - 2L", "More than 2L"].map((opt) => (
                      <motion.button
                        key={opt}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", damping: 25, stiffness: 400 }}
                        onClick={() => { 
                          setQData({ ...qData, habits: opt }); 
                          setShowQuestionnaire(false);
                        }}
                        className="w-full p-6 rounded-[28px] glass-ios border border-black/[0.02] shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:bg-[#F6F1FB] hover:border-[#A377D2]/10 text-sm font-bold text-[#2F2F30] transition-all text-left flex justify-between items-center active:scale-[0.98]"
                      >
                        {opt}
                        <div className="w-8 h-8 rounded-full bg-[#A377D2]/5 flex items-center justify-center">
                           <ArrowLeft className="w-4 h-4 rotate-180 text-[#A377D2]/40" />
                        </div>
                      </motion.button>
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
        </AnimatePresence>

        <AnimatePresence>
          {analyzing && (
            <motion.div
              key="analyzing-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-x-0 inset-y-0 rounded-[40px] bg-forensic/95 backdrop-blur-2xl z-50 flex flex-col items-center justify-center p-8 text-center"
            >
               <div className="relative mb-10">
                  {/* Outer Clinical Ring */}
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="w-32 h-32 rounded-full border border-dashed border-[#A377D2]/20 border-t-[#A377D2]/40" 
                  />
                  {/* Inner Active Ring */}
                  <div className="absolute inset-2">
                    <div className="w-full h-full rounded-full border-4 border-[#A377D2]/5 border-t-[#A377D2] animate-spin" />
                  </div>
                  {/* Branding Anchor */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white rounded-[28px] p-4 shadow-2xl border border-black/[0.03]"
                    >
                       <GlowLogo size={40} className="animate-pulse" />
                    </motion.div>
                  </div>
               </div>
               <h3 className="text-2xl font-black text-[#2F2F30] mb-3 tracking-tight">Clinical Analysis</h3>
               <div className="h-4 flex items-center justify-center">
                 <AnimatePresence mode="wait">
                   <motion.p 
                     key={stage}
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 1.1 }}
                     className="text-[10px] text-[#A377D2] font-black uppercase tracking-[0.3em]"
                   >
                     {!detectorReady && stage === 0 ? "Cloud Core..." : STAGES[stage]}
                   </motion.p>
                 </AnimatePresence>
               </div>
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
