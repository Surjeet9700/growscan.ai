"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Clock, Droplets, Leaf, Share, Sparkles,
  Sun, Moon, CheckCircle, MapPin, ScanEye, Activity,
  ShieldCheck, Star, Zap, ChevronRight, MessageCircle,
  ArrowRight, RotateCcw
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { FaceZone } from "@/lib/types";
import { CONFIG } from "@/lib/constants";
import { getProductsForIngredient } from "@/lib/affiliateProducts";
import { MetricPill } from "@/components/ui/diagnostic/MetricPill";
import { SkinHealthBar } from "@/components/ui/diagnostic/SkinHealthBar";
import { GlassResultCard } from "@/components/ui/diagnostic/GlassResultCard";
import { SkinProgressChart } from "@/components/ui/diagnostic/SkinProgressChart";
import { GlowLogo } from "@/components/ui/branding/GlowLogo";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const severityBorder: Record<string, string> = {
  none: "#10B981",
  mild: "#FBBF24",
  moderate: "#F97316",
  severe: "#EF4444",
};

const SAMPLE_REPORT = {
  report: {
    skin_type: "Combination",
    skin_age_estimate: "24-26 years",
    summary: "Your skin shows strong resilience with high hydration levels in the U-zone. We detected mild follicular congestion in the T-zone and early-stage oxidative stress markers around the orbital region. Overall health is optimal but requires targeted sebum control.",
    concerns: {
      pigmentation: "none",
      acne_or_breakouts: "mild",
      dark_circles: "mild",
      pores: "moderate",
      texture: "none",
      hydration: "none",
      oiliness: "moderate"
    },
    priority_ingredients: [
      { ingredient: "Niacinamide (5%)", reason: "Effectively regulates sebum production in the T-zone while strengthening the lipid barrier." },
      { ingredient: "Salicylic Acid (BHA)", reason: "Lipophilic action penetrates pores to dissolve keratin plugs and prevent future breakouts." },
      { ingredient: "Hyaluronic Acid", reason: "Maintains transepidermal water levels and plumps fine lines in the dehydration-prone cheek zones." }
    ],
    morning_routine_order: [
      "Gently cleanse with a pH-balanced foaming wash",
      "Apply 2 drops of Niacinamide serum to T-zone",
      "Layer a lightweight gel moisturizer",
      "MANDATORY: Broad-spectrum SPF 50+"
    ],
    night_routine_order: [
      "Double cleanse starting with a cleansing oil",
      "Apply BHA exfoliant (3x per week)",
      "Niacinamide serum (all over)",
      "Soothing ceramide night cream"
    ],
    lifestyle_tips: [
      "Increase dietary antioxidants (Vitamin C, E)",
      "Sleep 7+ hours for optimal cellular repair",
      "Wash pillowcases weekly to reduce bacterial load"
    ],
    strengths: [
      "High elastic collagen density",
      "Uniform melanin distribution",
      "Robust skin barrier function"
    ],
    recheck_in_weeks: 4
  }
} as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FullResultPage() {
  const [data, setData] = useState<any>(null);
  const [image, setImage] = useState<string | null>(null);
  const router = useRouter();

  const searchParams = useSearchParams();
  const isSample = searchParams.get("sample") === "true";

  useEffect(() => {
    if (isSample) {
      setData(SAMPLE_REPORT.report);
      setImage("/hero.png");
      return;
    }

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
  }, [router, isSample]);

  if (!data) return (
    <div className="h-screen bg-[#F6F6F6] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-2 border-black/10 border-t-[#A377D2] rounded-full animate-spin" />
      <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mt-4">Analyzing Face Map...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-forensic pb-40 font-poppins text-[#2F2F30]">

      {/* ── HEADER ── */}
      <div className="px-5 pt-8 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-black/[0.05]">
            <GlowLogo size={20} />
          </div>
          <div>
            <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A377D2]">System Verified</h1>
            <p className="text-[12px] text-black/30 font-medium">Full AI Report</p>
          </div>
        </div>
        <button onClick={() => router.push("/")} className="w-10 h-10 rounded-2xl bg-white border border-black/[0.05] flex items-center justify-center text-black/60 shadow-sm active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5 stroke-[1.5px]" />
        </button>
      </div>

      {/* ── FACE SCAN VISUAL ── */}
      <div className="relative mt-6 px-5 h-[340px]">
         <div className="relative w-full h-full rounded-[40px] overflow-hidden bg-neutral-200">
            {image ? (
              <img src={image} alt="Face Scan" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ScanEye className="w-16 h-16 text-black/10" />
              </div>
            )}
            
            {/* Geometric Mesh Overlay (Forensic Blueprint) */}
            <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 100 100" preserveAspectRatio="none">
              <motion.path 
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                d="M20,20 L50,15 L80,20 M20,50 L50,45 L80,50 M20,80 L50,85 L80,80 M50,15 L50,85 M20,20 L20,80 M80,20 L80,80" 
                fill="none" stroke="#A377D2" strokeWidth="0.4" strokeDasharray="3,3" 
              />
              <motion.circle cx="20" cy="20" r="1.2" fill="#A377D2" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
              <motion.circle cx="50" cy="15" r="1.2" fill="#A377D2" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} />
              <motion.circle cx="80" cy="20" r="1.2" fill="#A377D2" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }} />
              <motion.circle cx="20" cy="80" r="1.2" fill="#A377D2" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: 0.9 }} />
              <motion.circle cx="50" cy="85" r="1.2" fill="#A377D2" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: 1.2 }} />
              <motion.circle cx="80" cy="80" r="1.2" fill="#A377D2" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: 1.5 }} />
            </svg>
            
            {/* Tracking GlowPulse */}
            <motion.div 
               animate={{ 
                 opacity: [0.1, 0.3, 0.1],
                 scale: [1, 1.2, 1],
                 x: [0, 20, -20, 0],
                 y: [0, -20, 20, 0]
               }}
               transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
               className="absolute inset-0 bg-gradient-[radial] from-[#A377D2]/10 to-transparent pointer-events-none"
            />
         </div>

         {/* Floating Age Pill */}
         <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/50 shadow-sm">
            <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Skin Age: </span>
            <span className="text-[10px] font-black text-[#2F2F30]">{data.skin_age_estimate.replace(" years", "")}</span>
         </div>
      </div>

      {/* ── GLASS RESULTS OVERLAY ── */}
      <div className="px-5 -mt-20 relative z-10 space-y-5">
        <GlassResultCard>
          <SkinHealthBar label="Your Skin Health" value={72} className="mb-8" />
          
          <div className="lux-grid">
            <MetricPill label="Dryness" value={40} status="High" delay={0.1} />
            <MetricPill label="Spots" value={20} status="Low" delay={0.2} />
            <MetricPill label="Acne" value={10} status="Elevated" delay={0.3} />
            <MetricPill label="Moisture" value={60} status="Stable" delay={0.4} />
          </div>

          <button className="w-full mt-6 flex items-center justify-between bg-white rounded-3xl p-4 border border-[#F6F1FB] shadow-sm active:scale-[0.98] transition-all">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2F2F30] flex items-center justify-center text-white">
                  <Sparkles className="w-5 h-5 stroke-[1.5px]" />
                </div>
                <span className="text-sm font-bold text-[#2F2F30]">AI Recommendation</span>
             </div>
             <ChevronRight className="w-5 h-5 text-black/20" />
          </button>
        </GlassResultCard>

        <SkinProgressChart />
      </div>

      {/* ── SUMMARY ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="px-5 mt-10"
      >
        <div className="glass-ios p-6 border-black/[0.02]">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-[#A377D2] fill-[#A377D2]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-black/20">Clinical Summary</span>
          </div>
          <p className="text-base font-medium leading-relaxed text-[#2F2F30]/70 italic">
            "{data.summary}"
          </p>
        </div>
      </motion.div>

      {/* ── SKIN STRENGTHS ── */}
      {data.strengths?.length > 0 && (
        <div className="px-5 mt-10">
          <div className="glass-ios p-6 border-black/[0.02]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] text-[#10B981] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 stroke-[1.5px]" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#2F2F30]">Skin Strengths</h4>
                <p className="text-[10px] font-black text-black/30 uppercase tracking-widest">Natural Resilience</p>
              </div>
            </div>
            <div className="space-y-4">
              {data.strengths.map((s: string, i: number) => (
                <div key={i} className="flex gap-4">
                  <CheckCircle className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-[#2F2F30]/70 leading-snug">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── DAILY PROTOCOL ── */}
      <div className="px-5 mt-12">
        <div className="flex items-center justify-between mb-6 px-1">
          <h4 className="text-xl font-bold text-[#2F2F30]">Your Daily Protocol</h4>
          <span className="text-[10px] font-bold text-black/20 uppercase tracking-widest leading-none">AM/PM Routine</span>
        </div>
        <div className="space-y-5">
          {/* Morning */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="glass-ios p-6 relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
               <Sun className="w-20 h-20" />
             </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#FFFBEB] text-[#F59E0B] flex items-center justify-center border border-amber-100/50">
                <Sun className="w-6 h-6 stroke-[1.5px]" />
              </div>
              <div>
                <h3 className="text-base font-black text-ink">Morning Protocol</h3>
                <p className="text-[10px] text-black/30 font-black uppercase tracking-widest leading-tight">Focus: Protection</p>
              </div>
            </div>
            <div className="space-y-4">
              <motion.div
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.12, delayChildren: 0.2 }
                  }
                }}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="space-y-3"
              >
                {data.morning_routine_order?.map((step: string, i: number) => (
                  <motion.div 
                    key={`am-${i}`}
                    variants={{
                      hidden: { opacity: 0, x: -12, scale: 0.98 },
                      show: { opacity: 1, x: 0, scale: 1 }
                    }}
                    className="flex gap-4 items-start group"
                  >
                    <span className="text-[10px] font-black text-black/15 pt-1">0{i + 1}</span>
                    <p className="text-[13px] font-bold text-ink leading-snug group-hover:text-[#A377D2] transition-colors">{step}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* Night */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="glass-midnight p-6 relative overflow-hidden group"
          >
             <div className="absolute top-0 right-0 p-6 opacity-[0.1] group-hover:opacity-[0.15] transition-opacity">
               <Moon className="w-20 h-20 text-indigo-200" />
             </div>
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-sm">
                <Moon className="w-6 h-6 stroke-[1.5px] text-indigo-300" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Night Protocol</h3>
                <p className="text-[10px] text-white/30 font-black uppercase tracking-widest leading-tight">Focus: Repair</p>
              </div>
            </div>
            <div className="space-y-4 relative z-10">
              <motion.div
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.12, delayChildren: 0.2 }
                  }
                }}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="space-y-3"
              >
                {data.night_routine_order?.map((step: string, i: number) => (
                  <motion.div 
                    key={`pm-${i}`}
                    variants={{
                      hidden: { opacity: 0, x: -12, scale: 0.98 },
                      show: { opacity: 1, x: 0, scale: 1 }
                    }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="flex gap-4 items-start group"
                  >
                    <span className="text-[10px] font-black text-white/10 pt-1">0{i + 1}</span>
                    <p className="text-[13px] font-bold text-white/80 leading-snug group-hover:text-indigo-200 transition-colors">{step}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── MATCHED INGREDIENTS ── */}
      <div className="px-5 mt-14">
        <div className="flex items-center justify-between mb-6 px-1">
          <h4 className="text-xl font-bold text-[#2F2F30]">Science: Matched Ingredients</h4>
          <span className="text-[10px] font-bold text-black/20 uppercase tracking-widest leading-none">Targeted Care</span>
        </div>
        <div className="space-y-4">
          {data.priority_ingredients?.map((item: any, i: number) => (
            <div key={i} className="glass-ios p-6 flex items-start gap-5 border-black/[0.02]">
              <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center shrink-0 border border-[#D1FAE5]/50">
                <Leaf className="w-6 h-6 stroke-[1.5px]" />
              </div>
              <div>
                <h4 className="text-base font-black text-ink mb-1">{item.ingredient}</h4>
                <p className="text-[13px] text-black/50 leading-relaxed font-bold tracking-tight">{item.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SHOP YOUR ROUTINE ── */}
      <div className="px-5 mt-14">
        <div className="flex items-center justify-between mb-6 px-1">
          <h4 className="text-xl font-bold text-[#2F2F30]">Shop Your Routine</h4>
          <span className="text-[9px] font-bold text-black/20 uppercase tracking-[0.2em]">Affiliate Powered</span>
        </div>
        
        <div className="space-y-5">
          {data.priority_ingredients?.map((item: any, i: number) => {
            const products = getProductsForIngredient(item.ingredient);
            if (!products || products.length === 0) return null;
            const product = products[0];

            return (
              <motion.div
                key={`prod-${i}`}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-white rounded-[40px] p-6 border border-[#F6F1FB] flex gap-5 items-center shadow-sm"
              >
                <div className="w-24 h-24 rounded-[32px] bg-[#F6F6F6] flex items-center justify-center border border-black/5 shrink-0 overflow-hidden text-[#A377D2]">
                   <Sparkles className="w-8 h-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-[#A377D2] uppercase tracking-widest mb-1">{product.brand}</p>
                  <h5 className="text-sm font-bold text-[#2F2F30] leading-tight mb-1 line-clamp-2">{product.name}</h5>
                  <p className="text-xs font-bold text-black/20 mb-4">{product.price}</p>
                  <a 
                    href={product.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[11px] font-black text-white bg-[#A377D2] px-5 py-2.5 rounded-full active:scale-95 transition-all shadow-md shadow-[#A377D2]/20"
                  >
                    View Product <ArrowRight className="w-3.5 h-3.5 stroke-[2px]" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── LIFESTYLE TIPS ── */}
      <div className="px-5 mt-14">
        <div className="glass-midnight rounded-[40px] p-8 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-[0.05]">
             <Activity className="w-32 h-32" />
           </div>
          <h4 className="text-lg font-black mb-6 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-indigo-300" />
            Expert Wisdom
          </h4>
          <div className="space-y-6">
            {data.lifestyle_tips?.map((tip: string, i: number) => (
              <div key={i} className="flex gap-4 group">
                <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 shrink-0 animate-pulse" />
                <p className="text-[15px] font-bold text-white/80 leading-relaxed group-hover:text-white transition-colors">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RETENTION REMINDER ── */}
      <div className="px-5 mt-14 mb-8">
        <div className="bg-white rounded-[40px] p-8 text-center border border-[#F6F1FB] shadow-sm">
            <div className="w-16 h-16 rounded-[24px] bg-[#F6F1FB] flex items-center justify-center text-[#A377D2] mb-6 mx-auto">
              <MessageCircle className="w-8 h-8" />
            </div>
            
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/20 mb-2">Next Milestone</p>
            <h3 className="text-2xl font-bold text-[#2F2F30] mb-3">Goal: Visible Results</h3>
            <p className="text-sm text-[#2F2F30]/50 mb-8 max-w-[240px] mx-auto leading-relaxed font-medium">
              We'll remind you in <strong>{data.recheck_in_weeks} weeks</strong> to see how your skin has improved.
            </p>
            
            <a 
              href={`https://wa.me/${CONFIG.SUPPORT_WHATSAPP}?text=${encodeURIComponent(`Hi GlowScan! Remind me to scan again in ${data.recheck_in_weeks} weeks.`)}`}
              target="_blank"
              className="w-full py-5 rounded-[24px] flex items-center justify-center gap-3 active:scale-95 transition-all text-white bg-[#2F2F30] font-bold text-sm shadow-xl shadow-[#2F2F30]/20"
            >
              <Activity className="w-4 h-4" />
              Set WhatsApp Reminder
            </a>
        </div>
      </div>

      {/* ── DISCLAIMER ── */}
      <p className="text-center text-[10px] text-black/20 font-bold px-10 mt-10 uppercase tracking-widest">
        Digital Analysis · Non-Medical Information
      </p>
    </div>
  );
}
