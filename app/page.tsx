"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Camera, ChevronRight, Sparkles, CheckCircle, ScanFace, 
  HelpCircle, ChevronDown, ShieldCheck, Mail, Activity, Eye, Info,
} from "lucide-react";

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
    q: "How accurate is the AI scan?",
    a: "GlowScan uses computer vision models with 95% detection accuracy in natural lighting. It's designed for educational screening and tracking, not clinical diagnosis."
  },
  {
    q: "Are my photos stored privately?",
    a: "We prioritize your privacy. Images are processed in server memory for 30s and then permanently deleted. We do not store your face photos on our servers."
  },
  {
    q: "What's in the Full Report?",
    a: "You get a deep-dive into 5 face zones, clinical severity metrics (Acne, Pores, Texture), and a routine mapped to specific ingredients like Retinol & Niacinamide."
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
      <div className="card-premium flex items-center gap-5 py-6">
        <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center shrink-0">
          <ScanFace className="w-8 h-8 text-black/15" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-black/30 mb-1">
            Skin Health Score
          </p>
          <p className="text-base font-black text-ink">No scan yet</p>
          <p className="text-xs text-black/35 font-medium mt-0.5">
            Use the banner below to get started
          </p>
        </div>
      </div>
    );
  }

  const pct = Math.round(lastScan.glow_score * 10);
  const color = pct >= 70 ? "#EAB308" : pct >= 50 ? "#F97316" : "#EF4444";

  return (
    <Link href="/result/free">
      <div className="card-premium flex items-center justify-between gap-4 active:scale-[0.99] transition-transform cursor-pointer">
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-black/35 mb-1">
            Skin Health Score
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-5xl font-black text-ink">{pct}</span>
            <span className="text-lg font-black text-black/30">%</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-black/30">
              {lastScan.skin_type} skin
            </span>
            <span className="text-black/15">·</span>
            <span className="text-[9px] font-bold text-black/30">{scanAgo}</span>
          </div>
        </div>

        {/* Ring gauge */}
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 100 100" className="rotate-[-90deg] w-full h-full">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="10" />
            <motion.circle
              cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="10"
              strokeLinecap="round" strokeDasharray="264"
              initial={{ strokeDashoffset: 264 }}
              animate={{ strokeDashoffset: 264 * (1 - pct / 100) }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <ChevronRight className="w-5 h-5 text-black/20" />
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
    <div className="min-h-screen bg-background pb-32">

      {/* ── GREETING ────────────────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            className="flex-shrink-0 rounded-full bg-slate-200 overflow-hidden ring-2 ring-white shadow-sm relative"
            style={{ width: "44px", height: "44px" }}
          >
            <img
              src={user?.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${firstName}`}
              alt="User"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-[10px] text-black/35 font-black uppercase tracking-widest leading-none mb-1">
              Welcome back
            </p>
            <h2 className="text-lg font-black text-ink leading-tight truncate">{firstName}</h2>
          </div>
        </div>

        {/* Status pill — passive info only */}
        <div className="pill-status flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${hasScan ? "bg-emerald-500 animate-pulse" : "bg-black/20"}`} />
          <span>{hasScan ? `${Math.round(lastScan!.glow_score * 10)}%` : "No scan"}</span>
        </div>
      </div>

      {/* ── HEALTH SCORE (passive card) ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
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
            <div className="card-premium bg-black text-white flex items-center justify-between p-4 cursor-pointer active:scale-[0.99] transition-transform">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/35">Unlocked</p>
                  <p className="text-sm font-black">View Full Report</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30" />
            </div>
          </Link>
        </motion.div>
      )}

      {/* ── PRIMARY CTA BANNER (THE single scan action) ──────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
        className="px-6 mt-5"
      >
        <Link href="/scan">
          <div className="relative h-[280px] rounded-[32px] overflow-hidden group shadow-xl cursor-pointer active:scale-[0.99] transition-transform duration-200">
            <Image
              src="/hero.png"
              alt="Start skin scan"
              fill
              priority
              sizes="(max-width: 480px) 100vw, 480px"
              className="object-cover object-[center_20%] group-active:scale-105 transition-transform duration-500"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between">
              <div className="text-white">
                <p className="text-[9px] font-black uppercase tracking-[0.15em] mb-1 opacity-50">
                  AI Skin Analysis
                </p>
                <h3 className="text-[22px] font-black leading-tight">
                  {hasScan ? "Scan Again" : "Start Your Scan"}
                </h3>
                <p className="text-xs text-white/50 font-medium mt-0.5">
                  {hasScan ? "Track your skin progress" : "Know your skin in 30 seconds"}
                </p>
              </div>

              {/* Camera FAB */}
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg shrink-0 group-active:scale-90 transition-transform">
                <Camera className="w-5 h-5 text-black" />
              </div>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* ── LAST SCAN SNAPSHOT (contextual info, only when scan exists) ──── */}
      {hasScan && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
          className="px-6 mt-5"
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <h4 className="text-sm font-black text-ink">Last Scan</h4>
            <Link href="/result/free">
              <span className="text-[10px] font-black text-black/35 flex items-center gap-0.5 uppercase tracking-widest">
                Details <ChevronRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="card-premium p-4">
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
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="px-6 mt-5"
      >
        <div className="flex items-center justify-between mb-3 px-1">
          <h4 className="text-sm font-black text-ink">Expert Insights</h4>
          <span className="text-[10px] font-black text-black/30 uppercase tracking-widest">Science based</span>
        </div>
        <div className="space-y-3">
          {DAILY_TIPS.map((tip, i) => (
            <div key={i} className="card-premium p-4 flex gap-4">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-black text-ink">{tip.title}</p>
                <p className="text-[11px] font-medium text-black/45 leading-relaxed mt-1">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── SAMPLE REPORT PREVIEW (Trust Builder) ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="px-6 mt-8"
      >
        <div className="card-premium bg-slate-900 text-white p-6 overflow-hidden relative">
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

        <h1 className="text-sm font-black tracking-tighter text-primary mb-3">GLOWSCAN</h1>
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
