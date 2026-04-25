"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ShieldCheck, ArrowLeft, ChevronRight, Info, Download, Sparkles } from "lucide-react";
import Link from "next/link";
import { triggerHaptic } from "@/lib/haptics";
import { useClimateContext } from "@/lib/use-climate-context";

// CRITICAL: SSR: false prevents hydration crash on mobile
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
  "Setting up secure scan...",
  "Checking lighting balance...",
  "Analyzing skin texture...",
  "Evaluating skin clarity...",
  "Generating your plan...",
];

const SKIN_CONCERNS = [
  "Acne & Pimples",
  "Dullness & Tan",
  "Aging & Wrinkles",
  "Dark Spots / PIH",
];

export default function ScanPage() {
  const [showQuestionnaire, setShowQuestionnaire] = useState(true);
  const [qStep, setQStep] = useState(0);
  const [qData, setQData] = useState({ age: "", concern: "", habits: "" });
  const [isLoaded, setIsLoaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [stage, setStage] = useState(0);
  const [detectorReady, setDetectorReady] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const { climate, loading: climateLoading, error: climateError, refresh: refreshClimate } = useClimateContext(!showQuestionnaire && !analyzing);
  const router = useRouter();

  // ── PRE-LOAD MODELS ──────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("glowscan_qdata");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.age && parsed.concern && parsed.habits) {
          setQData(parsed);
          setShowQuestionnaire(false);
        }
      } catch (e) {}
    }
    setIsLoaded(true);
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    );

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
    triggerHaptic("medium");
    setAnalyzing(true);
    setStage(0);
    const intervalId = cycleStages();

    try {
      const img = new Image();
      const imageLoadPromise = new Promise<HTMLImageElement>((resolve) => {
        img.onload = () => resolve(img);
        img.src = base64String;
      });

      const imageEl = await imageLoadPromise;
      const bespokeZones = await import("@/lib/faceDetector").then(m =>
        m.detectZonePositions(imageEl)
      );

      if (!bespokeZones) throw new Error("LOW_SIGNAL_QUALITY");

      const analysisResponse = await fetch("/api/analyse/free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64String,
          context: {
            ...qData,
            climate: climate ? { ...climate, source: "scan-time" as const } : null,
          },
        }),
      });

      const analysisResult = await analysisResponse.json();

      if (!analysisResponse.ok) {
        throw new Error(analysisResult.error || "Could not save scan result.");
      }

      if (analysisResult.error) throw new Error(analysisResult.error);

      const data = analysisResult;

      if (data.face_zones) {
        data.face_zones = data.face_zones.map((zone: any) => {
          const coords = (bespokeZones as any)[zone.zone];
          return coords ? { ...zone, x: coords.x, y: coords.y } : zone;
        });
      }

      clearInterval(intervalId);
      triggerHaptic("success");
      setTimeout(() => router.push("/result/free"), 500);

    } catch (error: any) {
      clearInterval(intervalId);
      const message =
        error.message === "LOW_SIGNAL_QUALITY"
          ? "Face not detected. Please ensure you are in a bright room and holding the phone steady."
          : error.message;
      toast.error("Analysis Blocked", { description: message });
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#F4ECFF_0%,#FAFAFA_38%,#FAFAFA_100%)] font-[var(--font-poppins)] text-[#1A1A1A]">

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-14 pb-3 flex items-center justify-between">
        <button 
          onClick={() => {
            if (showQuestionnaire && qStep > 0) {
               setQStep(prev => prev - 1);
            } else {
               router.push("/");
            }
          }}
          className="w-10 h-10 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex items-center justify-center active:scale-90 transition-transform">
          <ArrowLeft className="w-4.5 h-4.5 text-[#1A1A1A]" strokeWidth={2} />
        </button>
        <h1 className="text-[17px] font-black text-[#1A1A1A]">Scan Skin</h1>
        {!showQuestionnaire && !analyzing ? (
          <button 
            onClick={() => {
              setShowQuestionnaire(true);
              setQStep(0);
            }}
            className="text-[14px] font-semibold text-[#A377D2] w-10 text-right active:opacity-70 transition-opacity">
            Edit
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {!isStandalone && !analyzing && (
        <div className="px-5 mt-2">
          <div className="flex items-start gap-3 rounded-[18px] border border-[#EBDDFA] bg-white/90 px-4 py-3 shadow-[0_4px_18px_rgba(163,119,210,0.08)]">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#F3EEFB]">
              <Download className="h-4 w-4 text-[#A377D2]" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#1A1A1A]">Best camera stability comes in app mode</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[#7A7485]">
                Install GlowScan for a cleaner full-screen scan flow and less browser chrome around the camera.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── QUESTIONNAIRE / CAMERA ─────────────────────────────────────────── */}
      <div className="px-5 mt-2 relative">
        <AnimatePresence mode="wait">
          {!isLoaded ? null : showQuestionnaire ? (
            <motion.div
              key="questionnaire"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Step progress dots */}
              <div className="flex items-center gap-2 mb-6">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === qStep
                        ? "w-8 bg-[#A377D2]"
                        : i < qStep
                        ? "w-4 bg-[#A377D2]/40"
                        : "w-4 bg-black/10"
                    }`}
                  />
                ))}
                <span className="text-[11px] font-semibold text-[#9A9A9A] ml-1">
                  {qStep + 1}/3
                </span>
              </div>

              {/* Q1: Age */}
              {qStep === 0 && (
                <div>
                  <h2 className="text-[24px] font-black text-[#1A1A1A] leading-tight mb-2">
                    Your age<br />range?
                  </h2>
                  <p className="text-[13px] text-[#9A9A9A] mb-6">Used to calibrate how the scan interprets oil balance and visible ageing markers.</p>
                  <div className="space-y-3">
                    {["Under 20", "20–35", "35–50", "Over 50"].map((opt) => (
                      <motion.button
                        key={opt}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { triggerHaptic("light"); setQData({ ...qData, age: opt }); setQStep(1); }}
                        className="w-full bg-white rounded-[20px] px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)] flex items-center justify-between text-[14px] font-semibold text-[#1A1A1A] active:bg-[#F3EEFB] border border-transparent active:border-[#A377D2]/20 transition-all"
                      >
                        {opt}
                        <div className="w-7 h-7 rounded-full bg-[#F3EEFB] flex items-center justify-center">
                          <ChevronRight className="w-4 h-4 text-[#A377D2]" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Q2: Concerns */}
              {qStep === 1 && (
                <div>
                  <h2 className="text-[24px] font-black text-[#1A1A1A] leading-tight mb-2">
                    Your main<br />skin concern?
                  </h2>
                  <p className="text-[13px] text-[#9A9A9A] mb-6">Pick your top priority area.</p>
                  <div className="space-y-3">
                    {SKIN_CONCERNS.map((opt) => (
                      <motion.button
                        key={opt}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { triggerHaptic("light"); setQData({ ...qData, concern: opt }); setQStep(2); }}
                        className="w-full bg-white rounded-[20px] px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)] flex items-center justify-between text-[14px] font-semibold text-[#1A1A1A] active:bg-[#F3EEFB] border border-transparent active:border-[#A377D2]/20 transition-all"
                      >
                        {opt}
                        <div className="w-7 h-7 rounded-full bg-[#F3EEFB] flex items-center justify-center">
                          <ChevronRight className="w-4 h-4 text-[#A377D2]" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Q3: Habits */}
              {qStep === 2 && (
                <div>
                  <h2 className="text-[24px] font-black text-[#1A1A1A] leading-tight mb-2">
                    Daily water<br />intake?
                  </h2>
                  <p className="text-[13px] text-[#9A9A9A] mb-6">Hydration affects skin clarity.</p>
                  <div className="space-y-3">
                    {["Less than 1L", "1L – 2L", "More than 2L"].map((opt) => (
                      <motion.button
                        key={opt}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          triggerHaptic("light");
                          const newData = { ...qData, habits: opt };
                          setQData(newData);
                          localStorage.setItem("glowscan_qdata", JSON.stringify(newData));
                          setShowQuestionnaire(false);
                        }}
                        className="w-full bg-white rounded-[20px] px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)] flex items-center justify-between text-[14px] font-semibold text-[#1A1A1A] active:bg-[#F3EEFB] border border-transparent active:border-[#A377D2]/20 transition-all"
                      >
                        {opt}
                        <div className="w-7 h-7 rounded-full bg-[#F3EEFB] flex items-center justify-center">
                          <ChevronRight className="w-4 h-4 text-[#A377D2]" />
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 22 }}
              className="relative"
            >
              <CameraCapture onCaptureAction={handleCapture} disabled={analyzing} />

              {/* Analysis overlay */}
              <AnimatePresence>
                {analyzing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 rounded-[32px] bg-white/95 backdrop-blur-lg z-50 flex flex-col items-center justify-center gap-5"
                  >
                    {/* Spinning rings */}
                    <div className="relative w-28 h-28">
                      {/* Outer dashed */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border border-dashed border-[#A377D2]/25"
                      />
                      {/* Inner spinner */}
                      <div className="absolute inset-3 rounded-full border-4 border-[#F3EEFB] border-t-[#A377D2] animate-spin" />
                      {/* Center pulse */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#F3EEFB] flex items-center justify-center">
                          <div className="w-4 h-4 rounded-full bg-[#A377D2] animate-pulse" />
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-[16px] font-black text-[#1A1A1A] mb-2">Analyzing your skin</p>
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={stage}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="text-[12px] font-semibold text-[#A377D2]"
                        >
                          {!detectorReady && stage === 0 ? "Initializing model..." : STAGES[stage]}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── FOOTER GUIDELINES ─────────────────────────────────────────────── */}
      {!showQuestionnaire && !analyzing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="px-5 mt-6 space-y-3"
        >
          <div className="rounded-[20px] bg-[linear-gradient(135deg,#1E1828_0%,#47355C_55%,#A377D2_100%)] p-4 text-white shadow-[0_14px_30px_rgba(89,55,125,0.22)]">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-white/90" />
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/80">Scan Standard</p>
            </div>
            <p className="text-[13px] font-semibold leading-relaxed text-white/88">
              Neutral face, front camera at eye level, and soft daylight gives the cleanest read for pigmentation, texture, and dehydration.
            </p>
          </div>
          <div className="rounded-[18px] bg-white px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#A377D2]">Climate Calibration</p>
                <p className="mt-1 text-[12px] leading-relaxed text-[#6E687A]">
                  {climateLoading
                    ? "Reading local UV, humidity, and pollution so the scan can stay grounded in today’s conditions."
                    : climate
                    ? `${climate.summary} The report will adjust guidance around these conditions.`
                    : climateError || "Location is optional, but it helps the scan make more useful India-first recommendations."}
                </p>
              </div>
              {!climate && (
                <button
                  onClick={() => void refreshClimate()}
                  className="rounded-full bg-[#F3EEFB] px-3 py-1.5 text-[11px] font-bold text-[#A377D2] active:scale-[0.98] transition-transform"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white rounded-[16px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <Info className="w-4 h-4 text-[#9A9A9A] shrink-0 mt-0.5" strokeWidth={1.75} />
            <p className="text-[12px] text-[#9A9A9A] leading-relaxed">
              For best results, remove glasses and ensure you're in good lighting.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-semibold text-[#9A9A9A] uppercase tracking-widest">
              Privacy Protected · Account-Linked Storage
            </span>
          </div>
        </motion.div>
      )}

    </div>
  );
}
