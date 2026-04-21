"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PayButton } from "@/components/PayButton";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { getProductsForIngredient } from "@/lib/affiliateProducts";
import {
  Activity, Droplets, ShieldCheck, ScanEye, Star,
  Sparkles, CheckCircle, Sun, Repeat2, Leaf,
  ArrowRight, ArrowLeft, MapPin, AlertCircle,
  Clock, MessageCircle, Target, Zap
} from "lucide-react";
import type { FaceZone, SkinTip, FreeAnalysisResult } from "@/lib/types";
import { GlowLogo } from "@/components/ui/branding/GlowLogo";

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
    <div className="glass-ios p-6">
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
            <GlowLogo size={64} className="opacity-10" />
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
                    style={{ borderColor: severityBorder[z.severity] }}
                  />
                  <div
                    className="w-3 h-3 rounded-full border-2 border-white shadow-lg relative z-20"
                    style={{ backgroundColor: severityBorder[z.severity] }}
                  />
                  
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: -45, scale: 1 }}
                      transition={{ type: "spring", damping: 12 }}
                      className="absolute z-50 bg-[#2F2F30] backdrop-blur-xl text-white text-[10px] font-bold rounded-2xl px-4 py-3 min-w-[140px] text-center leading-tight shadow-2xl border border-white/10 shrink-0"
                    >
                      {z.issue}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[100%] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#2F2F30]" />
                    </motion.div>
                  )}
                </div>
                <span className="text-[7px] font-black tracking-[0.2em] uppercase text-white drop-shadow-lg bg-[#A377D2]/80 px-2 py-0.5 rounded-full shrink-0">
                  {label}
                </span>
              </div>
            </button>
          )
        })}
        
        {/* Tracking GlowPulse */}
        <motion.div 
           animate={{ 
             opacity: [0.05, 0.2, 0.05],
             scale: [1, 1.3, 1],
             x: ["-10%", "10%", "-10%"],
             y: ["-10%", "10%", "-10%"]
           }}
           transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
           className="absolute inset-0 bg-gradient-[radial] from-[#A377D2]/20 to-transparent pointer-events-none"
        />
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
    <div className={`glass-ios flex gap-3 p-4 ${colors[tip.urgency]}`}>
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
  const [isDiscounted, setIsDiscounted] = useState(false);
  const [showFlashSale, setShowFlashSale] = useState(false);
  const [saleCountdown, setSaleCountdown] = useState(180); // 3 minutes
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

    // ── EXIT INTENT & FLASH SALE ──
    const hasSeenSale = localStorage.getItem("glowscan_flash_sale_seen");
    if (localStorage.getItem("glowscan_discount_active") === "true") {
      setIsDiscounted(true);
    }

    const triggerSale = () => {
      if (localStorage.getItem("glowscan_flash_sale_seen")) return;
      localStorage.setItem("glowscan_flash_sale_seen", "true");
      setShowFlashSale(true);
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) triggerSale();
    };

    // Mobile fallback: trigger after 15s of no interaction
    const mobileTimer = setTimeout(triggerSale, 15000);

    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      clearInterval(timer);
      clearTimeout(mobileTimer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [router]);

  // Flash Sale Countdown
  useEffect(() => {
    if (!showFlashSale || saleCountdown <= 0) return;
    const interval = setInterval(() => setSaleCountdown(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [showFlashSale, saleCountdown]);

  const activateDiscount = () => {
    setIsDiscounted(true);
    setShowFlashSale(false);
    localStorage.setItem("glowscan_discount_active", "true");
    toast.success("Discount Activated!", {
      description: "You have 3 minutes to claim your ₹29 report.",
    });
  };

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
    <div className="min-h-screen bg-forensic pb-44">

      {/* ── HEADER ── */}
      <div className="px-6 pt-6 flex items-center justify-between">
        <button onClick={() => router.push("/")} className="w-10 h-10 rounded-2xl bg-white border border-black/[0.05] flex items-center justify-center text-black/60 shadow-sm active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <GlowLogo size={20} />
          <div className="px-3 py-1 rounded-full bg-[#A377D2]/10 border border-[#A377D2]/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A377D2] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#A377D2]">Authorized Preview</span>
          </div>
        </div>
      </div>
      <div className="px-6 pt-4 pb-2">
        <h1 className="text-3xl font-black text-ink leading-tight">Dermal Assessment</h1>
        <p className="text-black/40 font-bold text-[11px] uppercase tracking-[0.1em] mt-0.5">Clinical Preview • {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
      </div>

      {/* ── SEGMENTED SCORES ── */}
      <div className="px-6 mt-6">
        <div className="glass-ios border-black/[0.03] rounded-[32px] grid grid-cols-3 gap-4 py-7">
          <SegmentedGauge score={glowScore} label="Luminance" icon={Activity} />
          <SegmentedGauge score={hydrationScore} label="Hydration" icon={Droplets} />
          <SegmentedGauge score={stabilityScore} label="Barrier" icon={ShieldCheck} />
        </div>
      </div>

      {/* ── PATIENT CONTEXT ── */}
      {(() => {
        const ctxRaw = typeof window !== "undefined" ? localStorage.getItem("glowscan_context") : null;
        if (!ctxRaw) return null;
        const ctx = JSON.parse(ctxRaw);
        return (
          <div className="px-6 mt-6">
          <div className="glass-ios py-5 px-6 flex items-center justify-between text-center border-black/[0.02]">
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
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
          transition={{ type: "spring", damping: 25, stiffness: 200, delay: 0.3 }}
          className="glass-ios p-6 rounded-[32px] border-black/5"
        >
          <div className="flex items-center gap-2 mb-2">
            <GlowLogo size={16} className="opacity-40" />
            <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Skin Intelligence Agent</span>
          </div>
          <p className="text-sm font-medium text-black/70 leading-relaxed italic">
            "{data.preview_insight}"
          </p>
        </motion.div>
      </div>

      {/* ── SKIN TYPE + TOP CONCERN ── */}
      <div className="px-6 mt-4 grid grid-cols-2 gap-4">
        <div className="glass-ios p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-black/30 mb-1">Skin Type</p>
          <p className="text-base font-black text-ink capitalize">{data.skin_type}</p>
          <p className="text-[10px] text-black/40 font-medium mt-1 leading-tight">{data.skin_type_reason}</p>
        </div>
        <div className="glass-ios p-4 min-h-[90px] flex flex-col justify-start">
          <p className="text-[9px] font-black uppercase tracking-widest text-black/30 mb-1">Top Concern</p>
          <p className="text-sm font-black text-ink capitalize leading-tight">{data.top_concern}</p>
        </div>
      </div>

      {/* ── SKIN TIPS (Free curation) ── */}
      {tips.length > 0 && (
        <div className="px-6 mt-8">
          <div className="flex items-center justify-between mb-4 px-1">
            <h4 className="text-lg font-black text-ink">Action Items</h4>
            <span className="text-[10px] font-bold text-black/30 uppercase tracking-widest">Dermatometric Guide</span>
          </div>
          <div className="space-y-4">
            <motion.div
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1, delayChildren: 0.2 }
                }
              }}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="space-y-4"
            >
              {tips.map((tip, i) => (
                <motion.div
                  key={`tip-${i}`}
                  variants={{
                    hidden: { opacity: 0, y: 15, scale: 0.98 },
                    show: { opacity: 1, y: 0, scale: 1 }
                  }}
                >
                  <SkinTipCard tip={tip} index={i} />
                </motion.div>
              ))}
            </motion.div>
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
              className="glass-ios p-5 flex gap-4 items-center border-[#A377D2]/10"
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
        <div className="glass-ios p-0 relative overflow-hidden shadow-2xl border-2 border-black/5">
          {/* Header */}
          <div className="glass-midnight text-white p-6 pb-8 text-center relative overflow-hidden rounded-t-[32px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
               <div className="flex items-center justify-center gap-2 mb-3">
                 <ShieldCheck className="w-5 h-5 text-amber-400" />
                 <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">Bio-Mapping Diagnostic</span>
               </div>
               <h3 className="text-2xl font-black mb-1">Personalized Dermal Plan</h3>
            </div>
          </div>

          {/* Curiosity Gap - Diagnostic Delta */}
          <div className="p-6 -mt-6 bg-white/40 backdrop-blur-2xl rounded-t-[32px] relative z-20 border-t border-white/20">
            <div className="space-y-4 mb-8">
              {/* Best vs Worst Zone Comparison */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-black/5 border border-black/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-black/5 shadow-sm">
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-black/40 uppercase tracking-widest leading-none mb-1">Priority Concern</p>
                    <p className="text-xs font-black text-ink">
                      {(() => {
                         const worst = [...zones].sort((a, b) => (a.score || 10) - (b.score || 10))[0];
                         return worst ? worst.zone.replace("_", " ") : "Cheek Area";
                      })()}
                    </p>
                  </div>
                </div>
                <div className="blur-[5px] select-none text-[10px] font-black bg-black/10 px-2 py-1 rounded">
                  {(() => {
                     const worst = [...zones].sort((a, b) => (a.score || 10) - (b.score || 10))[0];
                     return worst ? `Health Index: ${worst.score}/10` : "Critical Delta";
                  })()}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-black/5 border border-black/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-black/5 shadow-sm">
                    <Zap className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-black/40 uppercase tracking-widest leading-none mb-1">Resilient Area</p>
                    <p className="text-xs font-black text-ink">
                      {(() => {
                         const best = [...zones].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
                         return best ? best.zone.replace("_", " ") : "Forehead";
                      })()}
                    </p>
                  </div>
                </div>
                <div className="blur-[5px] select-none text-[10px] font-black bg-black/10 px-2 py-1 rounded">
                  {(() => {
                     const best = [...zones].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
                     return best ? `Health Index: ${best.score}/10` : "Optimal";
                  })()}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-black/5 border border-black/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-black/5 shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-black/40 uppercase tracking-widest leading-none mb-1">Barrier Analysis</p>
                    <p className="text-xs font-black text-ink">Biological Stability Index</p>
                  </div>
                </div>
                <div className="blur-[5px] select-none text-[10px] font-black bg-primary/20 text-primary-dark px-2 py-1 rounded">
                  {Math.round((data.glow_score || 7) * 9.5)}% Strength
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
                    <span className="text-3xl font-black text-ink">₹{isDiscounted ? "29" : "49"}</span>
                    <span className="text-sm line-through text-black/20">₹199</span>
                    <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {isDiscounted ? "85% OFF" : "75% OFF"}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-black/40 italic">
                    {isDiscounted ? "🔥 ONE-TIME FLASH DEAL" : "\"Less than a cup of cutting chai ☕\""}
                  </p>
                </div>
              </div>

              <PayButton 
                isDiscounted={isDiscounted}
                className="w-full h-16 rounded-[24px] text-lg font-black" 
                label={isDiscounted ? "Secure My Plan — ₹29" : "Get My Personalized Plan — ₹49"} 
              />
              
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

      {/* ── FLASH SALE MODAL ── */}
      <AnimatePresence>
        {showFlashSale && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm glass-ios rounded-[40px] overflow-hidden shadow-2xl border-2 border-black/10"
            >
              <div className="bg-black text-white p-8 text-center relative overflow-hidden">
                <motion.div 
                  animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-primary rounded-full blur-[60px] opacity-20 -translate-y-1/2"
                />
                
                <div className="relative z-10">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-3xl bg-primary/20 flex items-center justify-center border-2 border-primary/30">
                      <Zap className="w-8 h-8 text-primary fill-primary" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-black mb-2 italic">WAIT!</h2>
                  <p className="text-sm font-bold text-white/60 uppercase tracking-widest leading-tight">Don't leave your skin's <br/>future to chance.</p>
                </div>
              </div>

              <div className="p-8 text-center bg-white">
                <div className="mb-6">
                  <p className="text-xs font-black text-black/40 uppercase tracking-[0.2em] mb-4">Special Recapture Offer</p>
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <span className="text-2xl line-through text-black/20 font-black">₹49</span>
                    <ArrowLeft className="w-6 h-6 text-black/10 rotate-180" />
                    <span className="text-6xl font-black text-ink tracking-tighter">₹29</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-100 rounded-full text-[10px] font-black text-red-500 uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    Valid for {Math.floor(saleCountdown / 60)}:{(saleCountdown % 60).toString().padStart(2, "0")}s
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={activateDiscount}
                    className="w-full h-16 bg-primary text-white rounded-[24px] font-black text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all flex flex-col items-center justify-center leading-none"
                  >
                    <span>SECURE ₹29 DEAL</span>
                    <span className="text-[10px] mt-1 opacity-60">Expires in 3 minutes</span>
                  </button>
                  <button 
                    onClick={() => setShowFlashSale(false)}
                    className="w-full py-4 text-[10px] font-black text-black/30 uppercase tracking-widest hover:text-black/60 transition-colors"
                  >
                    No thanks, I'll pay full price later
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
