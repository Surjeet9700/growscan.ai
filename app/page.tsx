"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Camera, ChevronRight, Sparkles, CheckCircle, ScanFace, 
  HelpCircle, ChevronDown, ShieldCheck, Mail, Activity, Eye, Info,
  LineChart, PlusCircle
} from "lucide-react";
import { GlowLogo } from "@/components/ui/branding/GlowLogo";

interface LastScan {
  glow_score: number;
  skin_type: string;
  top_concern: string;
  timestamp: number;
}

const DAILY_TIPS = [
  { 
    title: "Apply SPF 50+ Daily", 
    desc: "UV exposure causes 80% of visible skin aging and pigmentation clusters." 
  },
  { 
    title: "Double Cleanse at Night", 
    desc: "Essential to remove lipid-soluble pollutants and sunscreen buildup for clear pores." 
  },
  { 
    title: "Hydration is Key", 
    desc: "Drink 2L+ water to maintain the skin's moisture barrier and prevent transepidermal water loss." 
  },
];

const FAQS = [
  { 
    q: "How accurate is the AI?", 
    a: "GlowScan uses high-fidelity vision models with 95% detection accuracy in balanced lighting. It is optimized for tracking skin health trends over time."
  },
  { 
    q: "Is my data private?", 
    a: "Absolutely. Images are processed in server-memory and instantly deleted. Your face biometric data is never stored on any persistent server."
  },
  { 
    q: "What is in the Full Plan?", 
    a: "You unlock clinical-grade metrics for 5 facial zones, ingredient-based routine mapping, and active progress tracking of your dermal health index."
  }
];

// ── Health Score Gauge (passive — not a CTA itself) ──────────────────────────
function HealthCard({
  lastScan,
  scanAgo,
}: {
  lastScan: LastScan | null;
  scanAgo: string;
}) {
  if (!lastScan) {
    // Empty state — informational only, no button
    return (
      <div className="glass-ios flex items-center gap-5 py-6 px-6">
        <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center shrink-0">
          <ScanFace className="w-8 h-8 text-black/15" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-black/30 mb-1">
            Face Health Index
          </p>
          <p className="text-base font-black text-ink">No Data Available</p>
          <p className="text-[11px] text-black/35 font-medium mt-0.5">
            Initialize your first scan below
          </p>
        </div>
      </div>
    );
  }

  const pct = Math.round(lastScan.glow_score * 10);
  const color = "#A377D2"; // Skin Intelligence Purple

  return (
    <Link href="/result/free">
      <div className="glass-ios p-6 flex items-center justify-between gap-4 active:scale-[0.98] transition-all duration-300 cursor-pointer border border-black/[0.02]">
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#A377D2] mb-2 leading-none">
            Skin Health Index
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-black text-[#2F2F30]">{pct}</span>
            <span className="text-sm font-bold text-black/20 uppercase tracking-widest">%</span>
          </div>
          <div className="flex items-center gap-2 mt-3">
             <div className="px-2 py-0.5 rounded-full bg-[#F6F1FB] border border-[#A377D2]/10">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#A377D2]">
                  {lastScan.skin_type}
                </span>
             </div>
            <span className="text-black/10 text-[8px] uppercase font-bold tracking-widest">{scanAgo}</span>
          </div>
        </div>

        {/* Ring gauge */}
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 100 100" className="rotate-[-90deg] w-full h-full">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#F6F1FB" strokeWidth="8" />
            <motion.circle
              cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="8"
              strokeLinecap="round" strokeDasharray="264"
              initial={{ strokeDashoffset: 264 }}
              animate={{ strokeDashoffset: 264 * (1 - pct / 100) }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <LineChart className="w-5 h-5 text-[#A377D2]/40" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user } = useUser();
  const [lastScan, setLastScan] = useState<LastScan | null>(null);
  const [hasFullReport, setHasFullReport] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("glowscan_free");
    if (raw) {
      try { setLastScan(JSON.parse(raw)); } catch {}
    }
    setHasFullReport(!!localStorage.getItem("glowscan_report"));
  }, []);

  const firstName = user?.firstName ?? "Friend";
  const hasScan = lastScan !== null;

  const scanAgo = hasScan
    ? (() => {
        const ms = Date.now() - lastScan.timestamp;
        const h = Math.floor(ms / 3_600_000);
        const d = Math.floor(ms / 86_400_000);
        if (h < 1) return "Just now";
        if (h < 24) return `${h}h ago`;
        return `${d}d ago`;
      })()
    : "";

  return (
    <div className="min-h-screen bg-forensic pb-32 font-poppins text-[#2F2F30]">

      {/* ── GREETING ────────────────────────────────────────────────────── */}
      <div className="px-5 pt-8 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            className="flex-shrink-0 rounded-[22px] bg-white overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-black/[0.02] relative"
            style={{ width: "48px", height: "48px" }}
          >
            <img
              src={user?.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${firstName}`}
              alt="User"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-[9px] text-black/20 font-bold uppercase tracking-[0.2em] leading-none mb-1.5">
              Premium Account
            </p>
            <h2 className="text-xl font-black text-[#2F2F30] leading-tight truncate">Hi, {firstName}</h2>
          </div>
        </div>

        {/* Brand/Status Logo */}
        <div className="w-12 h-12 rounded-[22px] bg-white border border-black/[0.02] flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.03)] active:scale-95 transition-transform">
           <GlowLogo size={24} />
        </div>
      </div>

      {/* ── HEALTH SCORE (passive card) ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ type: "spring", damping: 25, stiffness: 300, delay: 0.08 }}
        className="px-6 mt-4"
      >
        <HealthCard lastScan={lastScan} scanAgo={scanAgo} />
      </motion.div>

      {/* ── FULL REPORT SHORTCUT (only when paid, not a scan CTA) ────────── */}
      {hasFullReport && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="px-6 mt-3"
        >
          <Link href="/result/full">
            <div className="glass-midnight text-white flex items-center justify-between p-4 cursor-pointer active:scale-[0.99] transition-transform">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/35">Authorized Access</p>
                  <p className="text-sm font-black">View Full Diagnostic Report</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30" />
            </div>
          </Link>
        </motion.div>
      )}

      {/* ── PRIMARY CTA BANNER (THE single scan action) ──────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.18, type: "spring", damping: 20 }}
        className="px-6 mt-5"
      >
        <Link href="/scan">
          <motion.div 
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.01 }}
            className="relative h-[320px] rounded-[48px] overflow-hidden group shadow-[0_32px_64px_rgba(163,119,210,0.18)] cursor-pointer transition-all duration-500 border border-black/[0.03]"
          >
            <Image
              src="/hero.png"
              alt="Start skin scan"
              fill
              priority
              sizes="(max-width: 480px) 100vw, 480px"
              className="object-cover object-[center_30%] group-hover:scale-110 transition-transform duration-[1.5s] ease-out"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

            {/* Glassmorphic Tag */}
            <div className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-lg">
               <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Live AI Global Diagnostic</span>
            </div>

            {/* Content Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-10 flex items-end justify-between">
              <div className="text-white">
                <motion.h3 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-4xl font-black leading-[0.9] mb-3 tracking-tighter"
                >
                  {hasScan ? "Relaunch\nForensics" : "Analyze\nMy Skin"}
                </motion.h3>
                <div className="flex items-center gap-2 text-[10px] text-white/60 font-bold uppercase tracking-[0.2em]">
                  <Sparkles className="w-3 h-3 text-[#A377D2]" />
                  <span>30s Clinical Assessment</span>
                </div>
              </div>

              {/* Action Circle */}
              <motion.div 
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9, rotate: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="w-16 h-16 rounded-[22px] bg-[#A377D2] flex items-center justify-center shadow-[0_12px_24px_rgba(163,119,210,0.4)] shrink-0 group-active:scale-90 transition-all border-4 border-white/20"
              >
                <Camera className="w-7 h-7 text-white" />
              </motion.div>
            </div>
          </motion.div>
        </Link>
      </motion.div>

      {/* ── LAST SCAN SNAPSHOT (contextual info, only when scan exists) ──── */}
      {hasScan && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
          className="px-6 mt-5"
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <h4 className="text-sm font-black text-ink">Recent Assessment</h4>
            <Link href="/result/free">
              <span className="text-[10px] font-black text-black/35 flex items-center gap-0.5 uppercase tracking-[0.15em]">
                Review Assessment <ChevronRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-ios p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-black/30 mb-1.5">Skin Type</p>
              <p className="text-base font-black text-ink capitalize">{lastScan!.skin_type}</p>
              <p className="text-[10px] text-black/25 mt-0.5">{scanAgo}</p>
            </div>
            <div className="card-premium p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-black/30 mb-1.5">Top Concern</p>
              <p className="text-sm font-black text-ink capitalize leading-tight line-clamp-2">{lastScan!.top_concern}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── DAILY TIPS (Enhanced with explanations) ────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="px-6 mt-10"
      >
        <div className="flex items-center justify-between mb-4 px-1">
          <h4 className="text-sm font-black text-ink">Clinical Glow Tips</h4>
          <span className="text-[10px] font-black text-black/30 uppercase tracking-[0.15em]">Evidence Based</span>
        </div>
        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="space-y-4"
        >
          {DAILY_TIPS.map((tip, i) => (
            <motion.div 
               key={i} 
               variants={{
                 hidden: { opacity: 0, x: -20 },
                 show: { opacity: 1, x: 0 }
               }}
               className="glass-ios p-5 flex gap-5 hover:bg-[#F6F1FB]/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#F6F1FB] border border-[#A377D2]/10 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-[#A377D2]" />
              </div>
              <div>
                <p className="text-sm font-black text-[#2F2F30]">{tip.title}</p>
                <p className="text-[11px] font-medium text-black/40 leading-relaxed mt-1.5">{tip.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── SAMPLE REPORT PREVIEW (Trust Builder) ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="px-6 mt-8"
      >
        <div className="glass-midnight text-white p-6 overflow-hidden relative">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Transparency</span>
            </div>
            <h3 className="text-lg font-black mb-2">See a Sample Report</h3>
            <p className="text-xs text-white/60 leading-relaxed mb-6">
              Curious about what you get? Preview a clinical skin assessment including zone mapping and routine planning.
            </p>
            <Link href="/result/full?sample=true">
              <button className="w-full py-3 bg-white text-black text-xs font-black rounded-full active:scale-95 transition-all">
                PREVIEW FULL REPORT
              </button>
            </Link>
          </div>
          {/* Abstract background blobs */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl -mr-16 -mt-16" />
        </div>
      </motion.div>

      {/* ── FAQ SECTION ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="px-6 mt-12"
      >
        <div className="text-center mb-8">
          <h4 className="text-sm font-black text-ink">Frequently Asked Questions</h4>
          <p className="text-[11px] font-medium text-black/40 mt-1 uppercase tracking-widest">Trust & Transparency</p>
        </div>
        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <details key={i} className="group card-premium p-0 border-none bg-transparent">
              <summary className="flex items-center justify-between p-4 cursor-pointer list-none card-premium">
                <span className="text-xs font-black text-ink pr-4">{faq.q}</span>
                <ChevronDown className="w-4 h-4 text-black/30 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="p-4 pt-1 text-xs font-medium text-black/50 leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </motion.div>

      {/* ── LEGAL FOOTER ────────────────────────────────────────────────── */}
      <footer className="px-6 mt-16 mb-24 pb-8 flex flex-col items-center justify-center text-center">
        {/* Affiliate Disclosure */}
        <div className="max-w-[280px] mb-8 p-3 rounded-2xl bg-slate-50 border border-slate-100 italic">
          <p className="text-[9px] leading-relaxed text-slate-400 font-medium">
            AD Disclosure: Recommendations may include affiliate links. GlowScan earns a small commission at no extra cost to you.
          </p>
        </div>

        {/* Brand Logo Anchor */}
        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm mb-4 border border-black/[0.05]">
           <GlowLogo size={20} />
        </div>
        <h1 className="text-xs font-bold tracking-[0.4em] text-[#A377D2] mb-4 uppercase">GLOWSCAN</h1>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] font-bold text-black/50 uppercase tracking-widest">
          <Link href="/privacy" className="hover:text-black">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-black">Terms of Service</Link>
          <Link href="/refunds" className="hover:text-black">Refunds</Link>
          <Link href="/contact" className="hover:text-black">Contact Us</Link>
        </div>
        <p className="text-[9px] text-black/40 mt-4 font-medium uppercase tracking-widest">
          © {new Date().getFullYear()} GlowScan AI. All rights reserved.
        </p>
      </footer>

    </div>
  );
}
