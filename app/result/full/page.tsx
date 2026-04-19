"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Clock, Droplets, Leaf, Share, Sparkles,
  Sun, Moon, CheckCircle, MapPin, ScanEye, Activity,
  ShieldCheck, Star, Zap, ChevronRight, MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { FaceZone } from "@/lib/types";
import { CONFIG } from "@/lib/constants";
import { getProductsForIngredient } from "@/lib/affiliateProducts";

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Zone overlay positions on the face SVG (% of container)
const ZONE_POSITIONS: Record<string, { top: string; left: string; label: string }> = {
  forehead:    { top: "15%",  left: "50%", label: "Forehead" },
  nose:        { top: "48%",  left: "50%", label: "Nose" },
  left_cheek:  { top: "52%",  left: "25%", label: "L. Cheek" },
  right_cheek: { top: "52%",  left: "75%", label: "R. Cheek" },
  chin:        { top: "78%",  left: "50%", label: "Chin" },
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
  significant: "High",
  severe: "Severe",
};

// Derive a rough score from severity for progress bars
const severityToScore: Record<string, number> = {
  none: 100, mild: 72, moderate: 40, significant: 25, severe: 10
};

const concernIcons: Record<string, any> = {
  pigmentation: Sparkles,
  acne_or_breakouts: Zap,
  dark_circles: Moon,
  pores: ScanEye,
  texture: Activity,
  hydration: Droplets,
  oiliness: ShieldCheck,
};

const concernLabels: Record<string, string> = {
  pigmentation: "Pigmentation",
  acne_or_breakouts: "Acne / Breakouts",
  dark_circles: "Dark Circles",
  pores: "Pore Visibility",
  texture: "Texture",
  hydration: "Hydration",
  oiliness: "Oiliness",
};

const concernColors: Record<string, string> = {
  pigmentation: "#8B5CF6",
  acne_or_breakouts: "#EF4444",
  dark_circles: "#6366F1",
  pores: "#F59E0B",
  texture: "#14B8A6",
  hydration: "#3B82F6",
  oiliness: "#10B981",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function FaceZoneMap({ image, zones }: { image: string | null; zones: FaceZone[] }) {
  const [activeZone, setActiveZone] = useState<string | null>(null);

  return (
    <div className="card-premium p-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-black/40" />
        <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Your Face Map</span>
        <span className="ml-auto text-[9px] font-bold text-black/30">Tap zones to inspect</span>
      </div>

      {/* Face container — FIXED INDUSTRY STANDARD POSITIONS */}
      <div className="relative mx-auto w-56 aspect-[3/4] rounded-3xl overflow-hidden bg-neutral-100 shadow-inner">
        {image ? (
          <img src={image} alt="Skin scan" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ScanEye className="w-16 h-16 text-black/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/10" />

        {/* Zone dots — Fixed anatomical locations (Industry Standard) */}
        {zones.map((z) => {
          const pos = ZONE_POSITIONS[z.zone];
          if (!pos) return null;
          const isActive = activeZone === z.zone;
          return (
            <button
              key={z.zone}
              onClick={() => setActiveZone(isActive ? null : z.zone)}
              style={{ top: pos.top, left: pos.left }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 transition-all group"
            >
              <div className="flex flex-col items-center gap-0.5">
                <div className="relative w-7 h-7 flex items-center justify-center">
                  {/* Pulsing diagnostic rings */}
                  <motion.div
                    animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border-2"
                    style={{ borderColor: severityColor[z.severity] }}
                  />
                  <div
                    className="w-3 h-3 rounded-full border-2 border-white shadow-lg relative z-20"
                    style={{ backgroundColor: severityColor[z.severity] }}
                  />
                  
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: -40 }}
                      className="absolute z-50 bg-black/90 backdrop-blur-md text-white text-[9px] font-bold rounded-lg px-2.5 py-2 min-w-[140px] text-center leading-tight shadow-2xl border border-white/10"
                    >
                      {z.issue}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[100%] w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-black/90" />
                    </motion.div>
                  )}
                </div>
                <span className="text-[7px] font-black tracking-widest uppercase text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)] bg-black/30 px-1 rounded-sm">
                  {pos.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-5 gap-1">
        {zones.map((z) => {
          const pos = ZONE_POSITIONS[z.zone];
          return (
            <button
              key={z.zone}
              onClick={() => setActiveZone(activeZone === z.zone ? null : z.zone)}
              className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${activeZone === z.zone ? "bg-black/5" : ""}`}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: severityBorder[z.severity] }} />
              <span className="text-[8px] font-bold text-black/40 leading-none text-center">{pos?.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ConcernBar({ name, value }: { name: string; value: string }) {
  const Icon = concernIcons[name] || Activity;
  const color = concernColors[name] || "#000";
  const score = severityToScore[value] ?? 60;
  const label = severityLabel[value] ?? value;

  return (
    <div className="card-premium p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-black text-ink truncate">{concernLabels[name] ?? name}</p>
            <span
              className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: `${color}18`, color }}
            >
              {label}
            </span>
          </div>
          {/* Progress bar — Enhanced 8px height */}
          <div className="h-2 bg-black/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FullResultPage() {
  const [data, setData] = useState<any>(null);
  const [image, setImage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem("glowscan_report");
    const img = localStorage.getItem("glowscan_image");
    if (!raw) { router.push("/"); return; }
    try {
      const parsed = JSON.parse(raw);
      setData(parsed.report);
      setImage(img);
    } catch {
      router.push("/");
    }
  }, [router]);

  if (!data) return (
    <div className="h-screen bg-background flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-2 border-black/10 border-t-black rounded-full animate-spin" />
      <p className="text-xs font-black uppercase tracking-widest text-black/40 mt-4">Loading Your Report...</p>
    </div>
  );

  const handleShare = () => {
    const scoreRaw = localStorage.getItem("glowscan_free");
    let score = "";
    if (scoreRaw) {
      try { score = JSON.parse(scoreRaw).glow_score; } catch {}
    }
    const shareText = `I just got my skin analysed on GlowScan!\nSkin type: ${data.skin_type}\n${score ? `Glow Score: ${score}/10\n` : ""}Try it: ${window.location.origin}`;
    if (navigator.share) {
      navigator.share({
        title: 'GlowScan Report',
        text: shareText,
        url: window.location.origin,
      }).catch((err) => console.error('Share failed', err));
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
    }
  };

  // Build face_zones from free data if missing in full report
  const freeRaw = typeof window !== "undefined" ? localStorage.getItem("glowscan_free") : null;
  let faceZones: FaceZone[] = [];
  if (freeRaw) {
    try { faceZones = JSON.parse(freeRaw).face_zones ?? []; } catch {}
  }

  const concerns = data.concerns ?? {};

  return (
    <div className="min-h-screen bg-background pb-40">

      {/* ── HEADER ── */}
      <div className="px-6 pt-6 flex items-center justify-between">
        <Link href="/">
          <button className="w-10 h-10 rounded-full bg-white border border-black/5 flex items-center justify-center text-black/60 shadow-sm active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <button onClick={handleShare} className="pill-status flex items-center gap-1.5 active:bg-black/5">
          <Share className="w-3.5 h-3.5" />
          <span>Share Report</span>
        </button>
      </div>

      <div className="px-6 pt-6 pb-2 text-center">
        <h1 className="text-3xl font-black text-ink">Skin Report Card</h1>
        <p className="text-black/40 font-medium mt-1 text-sm uppercase tracking-widest font-black">Full Analysis Unlocked</p>
      </div>

      {/* ── PATIENT CONTEXT ── */}
      {(() => {
        const ctxRaw = typeof window !== "undefined" ? localStorage.getItem("glowscan_context") : null;
        if (!ctxRaw) return null;
        const ctx = JSON.parse(ctxRaw);
        return (
          <div className="px-6 mt-6">
            <div className="card-premium py-4 px-6 flex items-center justify-between overflow-x-auto whitespace-nowrap scrollbar-hide">
              <div className="shrink-0 flex items-center gap-2">
                <span className="text-[10px] font-black text-black/20 uppercase tracking-widest">Age</span>
                <span className="text-xs font-black text-ink">{ctx.age}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-black/5 shrink-0" />
              <div className="shrink-0 flex items-center gap-2">
                <span className="text-[10px] font-black text-black/20 uppercase tracking-widest">Main</span>
                <span className="text-xs font-black text-ink">{ctx.concern}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-black/5 shrink-0" />
              <div className="shrink-0 flex items-center gap-2">
                <span className="text-[10px] font-black text-black/20 uppercase tracking-widest">Habit</span>
                <span className="text-xs font-black text-ink">{ctx.habits}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── FACE ZONE MAP ── */}
      {faceZones.length > 0 && (
        <div className="px-6 mt-4">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <FaceZoneMap image={image} zones={faceZones} />
          </motion.div>
        </div>
      )}

      {/* ── SUMMARY ── */}
      <div className="px-6 mt-6">
        <div className="card-premium bg-black text-white p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Sparkles className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Expert Analysis</span>
          </div>
          <p className="text-base font-medium leading-relaxed italic relative z-10 text-white/90">
            "{data.summary}"
          </p>
        </div>
      </div>

      {/* ── SKIN TYPE + AGE ── */}
      <div className="px-6 mt-5 grid grid-cols-2 gap-4">
        <div className="card-premium p-4 flex flex-col gap-1">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
            <Droplets className="w-4 h-4" />
          </div>
          <p className="text-[9px] font-black uppercase tracking-widest text-black/30">Skin Type</p>
          <p className="text-base font-black text-ink capitalize">{data.skin_type}</p>
        </div>
        <div className="card-premium p-4 flex flex-col gap-1">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mb-2">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-[9px] font-black uppercase tracking-widest text-black/30">Skin Age Est.</p>
          <p className="text-sm font-black text-ink">{data.skin_age_estimate}</p>
        </div>
      </div>

      {/* ── CONDITION BREAKDOWN (visual bars) ── */}
      <div className="px-6 mt-10">
        <div className="flex items-center justify-between mb-4 px-1">
          <h4 className="text-lg font-black text-ink">Condition Breakdown</h4>
          <span className="text-[10px] font-bold text-black/30 uppercase tracking-widest">Live Scan Data</span>
        </div>
        <div className="space-y-3">
          {Object.entries(concerns).map(([key, val]) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * Object.keys(concerns).indexOf(key) + 0.2 }}
            >
              <ConcernBar name={key} value={val as string} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── SKIN STRENGTHS ── */}
      {data.strengths?.length > 0 && (
        <div className="px-6 mt-8">
          <div className="card-premium bg-emerald-50 border-emerald-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-black text-ink">Your Skin Strengths</h4>
            </div>
            <div className="space-y-2">
              {data.strengths.map((s: string, i: number) => (
                <div key={i} className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-black/70">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── DAILY PROTOCOL ── */}
      <div className="px-6 mt-10">
        <h4 className="text-lg font-black text-ink mb-4 px-1">Your Daily Protocol</h4>
        <div className="space-y-4">

          {/* Morning */}
          <div className="card-premium border-amber-200 bg-amber-50/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-ink uppercase tracking-tight">Morning Routine</h3>
                <p className="text-[10px] text-black/30 font-bold">Apply in order shown</p>
              </div>
            </div>
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {data.morning_routine_order?.map((step: string, i: number) => (
                  <motion.div 
                    key={`am-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="flex gap-3 items-start"
                  >
                    <span className="text-xs font-black text-amber-500 bg-amber-100 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-center mt-0.5">{i + 1}</span>
                    <p className="text-sm font-medium text-black/70 leading-snug">{step}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Night */}
          <div className="card-premium border-indigo-200 bg-indigo-50/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-ink uppercase tracking-tight">Night Routine</h3>
                <p className="text-[10px] text-black/30 font-bold">Repair + Restore</p>
              </div>
            </div>
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {data.night_routine_order?.map((step: string, i: number) => (
                  <motion.div 
                    key={`pm-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="flex gap-3 items-start"
                  >
                    <span className="text-xs font-black text-indigo-500 bg-indigo-100 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-center mt-0.5">{i + 1}</span>
                    <p className="text-sm font-medium text-black/70 leading-snug">{step}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ──Matched Ingredients Section ── */}
      <div className="px-6 mt-10">
        <div className="flex items-center justify-between mb-4 px-1">
          <h4 className="text-lg font-black text-ink">Science: Matched Ingredients</h4>
          <span className="text-[10px] font-bold text-black/30 uppercase tracking-widest">Targeted Care</span>
        </div>
        <div className="space-y-3">
          {data.priority_ingredients?.map((item: any, i: number) => (
            <div key={i} className="card-premium p-5 flex items-start gap-4 ring-1 ring-black/5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-ink mb-1">{item.ingredient}</h4>
                <p className="text-xs text-black/50 leading-relaxed font-medium">{item.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SHOP YOUR ROUTINE (Affiliate products) ── */}
      <div className="px-6 mt-12">
        <div className="flex items-center justify-between mb-5 px-1">
          <h4 className="text-xl font-black text-ink">Shop Your Routine</h4>
          <span className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">AD • Sponsored</span>
        </div>
        
        <div className="space-y-4">
          {data.priority_ingredients?.map((item: any, i: number) => {
            const products = getProductsForIngredient(item.ingredient);
            if (!products || products.length === 0) return null;
            const product = products[0];

            return (
              <motion.div
                key={`prod-${i}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i + 0.3 }}
                className="card-premium p-5 bg-white border-amber-100 flex gap-4 items-center group active:scale-[0.99] transition-all"
              >
                <div className="w-20 h-20 rounded-2xl bg-neutral-50 flex items-center justify-center border border-black/5 shrink-0 overflow-hidden relative">
                   <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   <Sparkles className="w-8 h-8 text-amber-100 group-hover:text-amber-200 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">{product.brand}</p>
                  <h5 className="text-sm font-black text-ink leading-tight mb-1 line-clamp-2">{product.name}</h5>
                  <p className="text-[11px] font-bold text-black/40 mb-3">{product.price}</p>
                  <a 
                    href={product.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[11px] font-black text-white bg-black px-4 py-2 rounded-full active:scale-95 transition-all shadow-md shadow-black/10"
                  >
                    Buy Now <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── LIFESTYLE TIPS ── */}
      <div className="px-6 mt-10">
        <div className="card-premium bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100 p-6">
          <h4 className="text-base font-black text-ink mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Expert Wisdom For You
          </h4>
          <div className="space-y-4">
            {data.lifestyle_tips?.map((tip: string, i: number) => (
              <div key={i} className="flex gap-3">
                <CheckCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm font-bold text-black/70 leading-snug">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── NEXT SCAN GOAL (Retention) ── */}
      <div className="px-6 mt-12 mb-8">
        <div className="card-premium p-8 bg-black text-white relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(232,149,109,0.15),transparent)] opacity-50" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center text-white mb-6 border border-white/5">
              <MessageCircle className="w-8 h-8" />
            </div>
            
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Next Milestone</p>
            <h3 className="text-2xl font-black text-white mb-3">Goal: Visible Results</h3>
            <p className="text-sm text-white/40 mb-8 max-w-[240px] leading-relaxed">
              We'll remind you in <strong>{data.recheck_in_weeks} weeks</strong> to see how your skin has improved.
            </p>
            
            <a 
              href={`https://wa.me/${CONFIG.SUPPORT_WHATSAPP}?text=${encodeURIComponent(`Hi GlowScan! Remind me to scan again in ${data.recheck_in_weeks} weeks regarding my ${data.top_concern || 'skin care'}.`)}`}
              target="_blank"
              className="btn-white w-full py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-black font-black"
            >
              <Activity className="w-4 h-4" />
              Set WhatsApp Reminder
            </a>
            
            <p className="mt-4 text-[9px] font-bold text-white/20 uppercase tracking-widest">
              Secured Subscription · Auto-Reminder
            </p>
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
