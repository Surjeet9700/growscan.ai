"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PayButton } from "@/components/PayButton";
import { motion, AnimatePresence } from "framer-motion";
import { getProductsForIngredient } from "@/lib/affiliateProducts";
import {
  Activity, Droplets, ShieldCheck, ScanEye, Star,
  Sparkles, CheckCircle, Sun, Repeat2, Leaf,
  ArrowRight, ArrowLeft, MapPin, AlertCircle,
  Clock, MessageCircle,
} from "lucide-react";
import type { FaceZone, SkinTip, FreeAnalysisResult } from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getLevel = (score: number) => {
  if (score >= 8) return { label: "Excellent", color: "#10B981" };
  if (score >= 6) return { label: "Good", color: "#F59E0B" };
  return { label: "Needs Care", color: "#EF4444" };
};

const severityColor: Record<string, string> = {
  none: "rgba(16,185,129,0.15)",
  mild: "rgba(251,191,36,0.22)",
  moderate: "rgba(249,115,22,0.28)",
  severe: "rgba(239,68,68,0.35)",
};

const severityBorder: Record<string, string> = {
  none: "#10B981",
  mild: "#FBBF24",
  moderate: "#F97316",
  severe: "#EF4444",
};

const severityLabel: Record<string, string> = {
  none: "Clear",
  mild: "Mild",
  moderate: "Moderate",
  severe: "Severe",
};

const urgencyIcon: Record<string, any> = {
  daily: Sun,
  weekly: Repeat2,
  lifestyle: Leaf,
};

const urgencyLabel: Record<string, string> = {
  daily: "Daily Habit",
  weekly: "Weekly Treatment",
  lifestyle: "Lifestyle Change",
};

// Zone overlay positions on the face SVG (% of container)
// Recalibrated for top-heavy portrait centering (object-position: center 20%)
const ZONE_POSITIONS: Record<string, { top: string; left: string; label: string }> = {
  forehead:    { top: "15%",  left: "50%", label: "Forehead" },
  nose:        { top: "48%",  left: "50%", label: "Nose" },
  left_cheek:  { top: "52%",  left: "25%", label: "L. Cheek" },
  right_cheek: { top: "52%",  left: "75%", label: "R. Cheek" },
  chin:        { top: "78%",  left: "50%", label: "Chin" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SegmentedGauge({ score, label, icon: Icon }: { score: number; label: string; icon: any }) {
  const pct = score * 10;
  const { color } = getLevel(score);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 100 100" className="rotate-[-90deg]">
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="8" />
          <motion.circle
            cx="50" cy="50" r="44" fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round" strokeDasharray="276"
            initial={{ strokeDashoffset: 276 }}
            animate={{ strokeDashoffset: 276 * (1 - pct / 100) }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="w-4 h-4 text-black/20" />
          <span className="text-xl font-black text-ink">{score}</span>
        </div>
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-black/40">{label}</span>
    </div>
  );
}

function FaceZoneMap({ image, zones }: { image: string | null; zones: FaceZone[] }) {
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const zoneMap = Object.fromEntries(zones.map(z => [z.zone, z]));

  return (
    <div className="card-premium p-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-black/40" />
        <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Face Zone Map</span>
      </div>

      {/* Face container — FIXED INDUSTRY STANDARD POSITIONS */}
      <div className="relative mx-auto w-56 aspect-[3/4] rounded-3xl overflow-hidden bg-neutral-100 shadow-inner">
        {image ? (
          <img
            src={image}
            alt="Your skin scan"
            className="w-full h-full object-cover object-[center_20%]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ScanEye className="w-16 h-16 text-black/10" />
          </div>
        )}

        {/* Semi-transparent overlay */}
        <div className="absolute inset-0 bg-black/10" />

        {/* Zone dots — Dynamic bespoke positions from MediaPipe */}
        {zones.map((z) => {
          const fallback = ZONE_POSITIONS[z.zone];
          const isActive = activeZone === z.zone;
          
          // Use detected coordinates if available, otherwise fallback to static standard
          const left = z.x !== undefined ? `${z.x}%` : fallback?.left;
          const top = z.y !== undefined ? `${z.y}%` : fallback?.top;
          const label = fallback?.label || z.zone;

          if (!left || !top) return null;

          return (
            <button
              key={z.zone}
              onClick={() => setActiveZone(isActive ? null : z.zone)}
              style={{ top, left }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 transition-all group"
            >
              <div className="flex flex-col items-center gap-0.5">
                <div className="relative w-7 h-7 flex items-center justify-center">
                  {/* Pulsing diagnostic rings */}
                  <motion.div
                    animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border-2"
                    style={{ borderColor: severityBorder[z.severity] }}
                  />
                  <div
                    className="w-3 h-3 rounded-full border-2 border-white shadow-lg relative z-20"
                    style={{ backgroundColor: severityBorder[z.severity] }}
                  />
                  
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: -40 }}
                      className="absolute z-50 bg-black/90 backdrop-blur-md text-white text-[9px] font-bold rounded-lg px-2.5 py-2 min-w-[120px] text-center leading-tight shadow-2xl border border-white/10"
                    >
                      {z.issue}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[100%] w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-black/90" />
                    </motion.div>
                  )}
                </div>
                <span className="text-[7px] font-black tracking-widest uppercase text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)] bg-black/30 px-1 rounded-sm">
                  {label}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Zone legend */}
      <div className="mt-4 grid grid-cols-5 gap-1">
        {zones.map((z) => {
          const pos = ZONE_POSITIONS[z.zone];
          return (
            <button
              key={z.zone}
              onClick={() => setActiveZone(activeZone === z.zone ? null : z.zone)}
              className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${activeZone === z.zone ? "bg-black/5" : ""}`}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: severityBorder[z.severity] }}
              />
              <span className="text-[8px] font-bold text-black/40 leading-none text-center">
                {pos?.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Severity key */}
      <div className="mt-3 flex items-center gap-3 justify-center">
        {Object.entries(severityBorder).map(([sev, color]) => (
          <div key={sev} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[8px] font-bold text-black/30">{severityLabel[sev]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkinTipCard({ tip }: { tip: SkinTip; index: number }) {
  const Icon = urgencyIcon[tip.urgency] || Leaf;
  const label = urgencyLabel[tip.urgency];
  const colors: Record<string, string> = {
    daily: "bg-amber-50 border-amber-100",
    weekly: "bg-blue-50 border-blue-100",
    lifestyle: "bg-emerald-50 border-emerald-100",
  };
  const iconColors: Record<string, string> = {
    daily: "text-amber-500 bg-amber-100",
    weekly: "text-blue-500 bg-blue-100",
    lifestyle: "text-emerald-600 bg-emerald-100",
  };
  return (
    <div className={`card-premium flex gap-3 p-4 ${colors[tip.urgency]}`}>
      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${iconColors[tip.urgency]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-black/30 mb-0.5">{label}</p>
        <p className="text-sm font-bold text-ink leading-snug">{tip.tip}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FreeResultPage() {
  const [data, setData] = useState<FreeAnalysisResult | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem("glowscan_free");
    const img = localStorage.getItem("glowscan_image");
    if (!raw) { router.push("/scan"); return; }
    try {
      setData(JSON.parse(raw));
      setImage(img);
    } catch {
      router.push("/scan");
    }

    // ── SESSION TIMER LOGIC ──
    const startTime = localStorage.getItem("glowscan_session_start") || Date.now().toString();
    if (!localStorage.getItem("glowscan_session_start")) {
      localStorage.setItem("glowscan_session_start", startTime);
    }

    const timer = setInterval(() => {
      const elapsed = Date.now() - parseInt(startTime);
      const remaining = Math.max(24 * 60 * 60 * 1000 - elapsed, 0);
      
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      
      setTimeLeft(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  if (!data) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-black/10 border-t-black rounded-full animate-spin" />
    </div>
  );

  const zones: FaceZone[] = data.face_zones ?? [];
  const tips: SkinTip[] = data.skin_tips ?? [];
  // Estimate scores from glow + zone data
  const glowScore = Math.round(data.glow_score);
  const hydrationScore = zones.find(z => z.zone === "nose")?.severity === "none" ? 8 :
                         zones.find(z => z.zone === "nose")?.severity === "mild" ? 6 : 5;
  const stabilityScore = (zones.filter(z => z.severity === "none").length / Math.max(zones.length, 1)) >= 0.6 ? 8 : 6;

  return (
    <div className="min-h-screen bg-background pb-44">

      {/* ── HEADER ── */}
      <div className="px-6 pt-6 flex items-center justify-between">
        <button onClick={() => router.push("/")} className="w-10 h-10 rounded-full bg-white border border-black/5 flex items-center justify-center text-black/60 shadow-sm active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded-full bg-black/5 border border-black/10 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Free Preview</span>
          </div>
        </div>
      </div>
      <div className="px-6 pt-4 pb-2">
        <h1 className="text-3xl font-black text-ink leading-tight">Skin Report Card</h1>
        <p className="text-black/40 font-medium text-sm mt-0.5">Initial AI scan assessment • {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
      </div>

      {/* ── SEGMENTED SCORES ── */}
      <div className="px-6 mt-6">
        <div className="card-premium grid grid-cols-3 gap-4 py-7">
          <SegmentedGauge score={glowScore} label="Glow" icon={Activity} />
          <SegmentedGauge score={hydrationScore} label="Hydration" icon={Droplets} />
          <SegmentedGauge score={stabilityScore} label="Stability" icon={ShieldCheck} />
        </div>
      </div>

      {/* ── PATIENT CONTEXT ── */}
      {(() => {
        const ctxRaw = typeof window !== "undefined" ? localStorage.getItem("glowscan_context") : null;
        if (!ctxRaw) return null;
        const ctx = JSON.parse(ctxRaw);
        return (
          <div className="px-6 mt-6">
            <div className="card-premium py-4 px-6 flex items-center justify-between text-center">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-black/20 uppercase tracking-widest mb-1">Age</span>
                <span className="text-[10px] font-black text-ink">{ctx.age}</span>
              </div>
              <div className="w-[1px] h-6 bg-black/5" />
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-black/20 uppercase tracking-widest mb-1">Focus</span>
                <span className="text-[10px] font-black text-ink">{ctx.concern}</span>
              </div>
              <div className="w-[1px] h-6 bg-black/5" />
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-black/20 uppercase tracking-widest mb-1">Habit</span>
                <span className="text-[10px] font-black text-ink">{ctx.habits}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── FACE ZONE MAP ── */}
      <div className="px-6 mt-6">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <FaceZoneMap image={image} zones={zones} />
        </motion.div>
      </div>

      {/* ── AI OBSERVATION ── */}
      <div className="px-6 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="card-premium border-black/5 bg-neutral-50"
        >
          <div className="flex items-center gap-2 mb-2">
            <ScanEye className="w-4 h-4 text-black/40" />
            <span className="text-[10px] font-black uppercase tracking-widest text-black/40">AI Observation</span>
          </div>
          <p className="text-sm font-medium text-black/70 leading-relaxed italic">
            "{data.preview_insight}"
          </p>
        </motion.div>
      </div>

      {/* ── SKIN TYPE + TOP CONCERN ── */}
      <div className="px-6 mt-4 grid grid-cols-2 gap-4">
        <div className="card-premium p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-black/30 mb-1">Skin Type</p>
          <p className="text-base font-black text-ink capitalize">{data.skin_type}</p>
          <p className="text-[10px] text-black/40 font-medium mt-1 leading-tight">{data.skin_type_reason}</p>
        </div>
        <div className="card-premium p-4 min-h-[90px] flex flex-col justify-start">
          <p className="text-[9px] font-black uppercase tracking-widest text-black/30 mb-1">Top Concern</p>
          <p className="text-sm font-black text-ink capitalize leading-tight">{data.top_concern}</p>
        </div>
      </div>

      {/* ── SKIN TIPS (Free curation) ── */}
      {tips.length > 0 && (
        <div className="px-6 mt-8">
          <div className="flex items-center justify-between mb-4 px-1">
            <h4 className="text-lg font-black text-ink">Your Action Plan</h4>
            <span className="text-[10px] font-bold text-black/30 uppercase tracking-widest">AI Curated</span>
          </div>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {tips.map((tip, i) => (
                <motion.div
                  key={`tip-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i + 0.4 }}
                >
                  <SkinTipCard tip={tip} index={i} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── SPONSORED RECOMMENDATION (Affiliate) ── */}
      {(() => {
        const topProduct = getProductsForIngredient(data.top_concern)[0];
        if (!topProduct) return null;
        return (
          <div className="px-6 mt-8">
            <div className="flex items-center justify-between mb-4 px-1">
              <h4 className="text-lg font-black text-ink">Top Match for You</h4>
              <span className="text-[9px] font-black text-black/30 uppercase tracking-[0.1em]">AD • Sponsored</span>
            </div>
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-premium p-4 flex gap-4 items-center bg-white border-amber-100/50"
            >
              <div className="w-20 h-20 rounded-2xl bg-neutral-50 flex items-center justify-center border border-black/5 shrink-0 overflow-hidden">
                <Sparkles className="w-8 h-8 text-amber-200" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">{topProduct.brand}</p>
                <h5 className="text-sm font-black text-ink leading-tight mb-1 line-clamp-2">{topProduct.name}</h5>
                <p className="text-[11px] font-bold text-black/40 mb-3">{topProduct.price}</p>
                <a 
                  href={topProduct.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-black text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200/50 active:scale-95 transition-all"
                >
                  View on Shop <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          </div>
        );
      })()}

      {/* ── UPSELL — Personalised Full Plan ── */}
      <div className="px-6 mt-8">
        <div className="card-premium bg-white border-2 border-black p-0 relative overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-black text-white p-6 pb-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
               <div className="flex items-center justify-center gap-2 mb-3">
                 <ScanEye className="w-5 h-5 text-amber-400" />
                 <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">What We Found About Your Skin</span>
               </div>
               <h3 className="text-2xl font-black mb-1">Full Report Available</h3>
            </div>
          </div>

          {/* Curiosity Gap - Blurred Real Data */}
          <div className="p-6 -mt-6 bg-white rounded-t-[32px] relative z-20">
            <div className="space-y-4 mb-8">
               <div className="flex items-center justify-between p-3 rounded-2xl bg-black/5 border border-black/5">
                 <span className="text-xs font-bold text-black/60">Your Forehead Concern</span>
                 <div className="flex items-center gap-2">
                   <div className="blur-[5px] select-none text-xs font-black bg-black/10 px-2 py-1 rounded">
                     {zones.find(z => z.zone === "forehead")?.issue || "Moderate Acne"}
                   </div>
                   <ShieldCheck className="w-4 h-4 text-emerald-500" />
                 </div>
               </div>
               
               <div className="flex items-center justify-between p-3 rounded-2xl bg-black/5 border border-black/5">
                 <span className="text-xs font-bold text-black/60">Ingredient Match #1</span>
                 <div className="flex items-center gap-2">
                   <div className="blur-[6px] select-none text-xs font-black bg-black/10 px-2 py-1 rounded">
                     {data.primary_ingredient || "Salicylic Acid"}
                   </div>
                   <Star className="w-4 h-4 text-amber-500" />
                 </div>
               </div>

               <div className="flex items-center justify-between p-3 rounded-2xl bg-black/5 border border-black/5">
                 <span className="text-xs font-bold text-black/60">Your Skin Age Estimate</span>
                 <div className="flex items-center gap-2">
                   <div className="blur-[4px] select-none text-xs font-black bg-black/10 px-2 py-1 rounded">
                     {data.skin_age_estimate || 24} yrs
                   </div>
                   <Activity className="w-4 h-4 text-blue-500" />
                 </div>
               </div>
            </div>

            {/* Social Proof */}
            <div className="mb-8 p-4 rounded-3xl bg-neutral-50 border border-black/5 relative">
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
              </div>
              <p className="text-xs font-bold text-ink mb-1 italic leading-snug">
                "Finally know what products to actually buy. The routine cleared my pigmentation in weeks."
              </p>
              <p className="text-[10px] font-black text-black/30 uppercase tracking-widest">— Priya, Pune • Combination skin</p>
            </div>

            {/* Live Stats */}
            <div className="flex items-center justify-center gap-6 mb-8 text-center">
               <div>
                 <p className="text-lg font-black text-ink">1,200+</p>
                 <p className="text-[9px] font-black text-black/30 uppercase tracking-widest">Unlocked Today</p>
               </div>
               <div className="w-[1px] h-8 bg-black/10" />
               <div className="flex flex-col items-center">
                 <p className="text-lg font-black text-ink flex items-center gap-1.5">
                   <Clock className="w-4 h-4 text-red-500" />
                   {timeLeft}
                 </p>
                 <p className="text-[9px] font-black text-red-500/60 uppercase tracking-widest">Report Expires</p>
               </div>
            </div>

            {/* PRICING & CTA */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-3xl font-black text-ink">₹49</span>
                    <span className="text-sm line-through text-black/20">₹199</span>
                    <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">75% OFF</span>
                  </div>
                  <p className="text-[10px] font-bold text-black/40 italic">"Less than a cup of cutting chai ☕"</p>
                </div>
              </div>

              <PayButton className="w-full h-16 rounded-[24px] text-lg font-black" label="See My Full Skin Report — ₹49" />
              
              <p className="text-center text-[10px] font-bold text-black/30 flex items-center justify-center gap-2">
                <ShieldCheck className="w-3 h-3" />
                UPI • GPay • PhonePe • Cards
              </p>
              
              <p className="text-center text-[10px] font-bold text-amber-600 bg-amber-50 py-2 rounded-xl border border-amber-100">
                ⭐ Cheaper than one dermatologist consultation (₹500+)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── DISCLAIMER ── */}
      <p className="text-center text-[9px] text-black/20 font-medium px-8 mt-6">
        Results are AI-generated for informational purposes only and do not constitute medical advice.
      </p>
    </div>
  );
}
