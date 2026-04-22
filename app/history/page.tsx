"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Camera, ChevronRight, TrendingUp, TrendingDown, ShoppingBag } from "lucide-react";

interface HistoryEntry {
  id: string;
  timestamp: number;
  glow_score: number;
  skin_type: string;
  top_concern: string;
  preview_insight?: string;
}

// ── Small metric progress circle ─────────────────────────────────────────────
function MetricCircle({
  label,
  value,
  color,
  trend,
}: {
  label: string;
  value: number;
  color: string;
  trend: "high" | "low";
}) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-14 h-14">
        <svg viewBox="0 0 48 48" className="-rotate-90 w-full h-full">
          <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="4" />
          <motion.circle
            cx="24" cy="24" r={r} fill="none"
            stroke={color} strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-black" style={{ color }}>
            {value}%
          </span>
        </div>
      </div>
      <div>
        <p className="text-[11px] font-semibold text-[#1A1A1A] text-center">{label}</p>
        <div className="flex items-center justify-center gap-0.5 mt-0.5">
          {trend === "high" ? (
            <TrendingUp className="w-3 h-3 text-red-500" />
          ) : (
            <TrendingDown className="w-3 h-3 text-emerald-500" />
          )}
          <span
            className={`text-[10px] font-semibold ${
              trend === "high" ? "text-red-500" : "text-emerald-500"
            }`}
          >
            {trend === "high" ? "High↑" : "Low↓"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Date Strip ────────────────────────────────────────────────────────────────
function DateStrip() {
  const days = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
  const today = new Date().getDay(); // 0 = Sun
  const dayMap = [1, 2, 3, 4, 5, 6, 0]; // map Sat=0 to ...
  const activeIdx = dayMap.indexOf(today % 7) === -1 ? 1 : dayMap.indexOf(today % 7);
  const dates: number[] = [];
  const now = new Date();
  // Compute start of this Sat
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - activeIdx);
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    dates.push(d.getDate());
  }

  return (
    <div className="flex items-center justify-between px-1 mt-3">
      {days.map((day, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] text-[#9A9A9A] font-medium">{day}</span>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-all ${
              i === activeIdx
                ? "bg-[#A377D2] text-white shadow-[0_3px_10px_rgba(163,119,210,0.35)]"
                : "text-[#1A1A1A]"
            }`}
          >
            {dates[i]}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Routine Item ─────────────────────────────────────────────────────────────
function RoutineItem({
  name,
  pct,
  done,
}: {
  name: string;
  pct: number;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-black/[0.04] last:border-none">
      {/* Checkbox */}
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
          done ? "border-[#A377D2] bg-[#A377D2]" : "border-black/20"
        }`}
      >
        {done && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div className="flex-1">
        <p className="text-[13px] font-semibold text-[#1A1A1A]">{name}</p>
        <div className="mt-1.5 h-1 bg-black/[0.06] rounded-full overflow-hidden w-24">
          <motion.div
            className="h-full bg-[#A377D2] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>
      <span className="text-[11px] font-bold text-[#A377D2]">{pct}%</span>
    </div>
  );
}

// ── PAGE ─────────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/history");
        const data = await res.json();
        if (data.scans && data.scans.length > 0) {
          setEntries(
            data.scans.map((s: any) => ({
              id: s._id,
              timestamp: new Date(s.createdAt).getTime(),
              glow_score: s.result.glow_score,
              skin_type: s.result.skin_type,
              top_concern: s.result.top_concern,
              preview_insight: s.result.preview_insight,
            }))
          );
          return;
        }
        const raw = localStorage.getItem("glowscan_history");
        if (raw) setEntries(JSON.parse(raw));
      } catch {
        const raw = localStorage.getItem("glowscan_history");
        if (raw) setEntries(JSON.parse(raw));
      }
    }
    loadHistory();
  }, []);

  const latest = entries[0] ?? null;

  const METRICS = [
    { label: "Acne",          value: 63, color: "#F87171", trend: "high" as const },
    { label: "Oily",          value: 20, color: "#34D399", trend: "low"  as const },
    { label: "Wrinkles",      value: 45, color: "#34D399", trend: "low"  as const },
    { label: "Dryness",       value: 80, color: "#F87171", trend: "high" as const },
  ];

  const ROUTINE = [
    { name: "Moisturizer",  pct: 56, done: true  },
    { name: "Serum",        pct: 80, done: false },
    { name: "Sunscreen",    pct: 30, done: false },
    { name: "Night Cream",  pct: 0,  done: false },
  ];

  const SUGGEST_PRODUCTS = [
    { name: "Skin Moisturizer", brand: "Klairs" },
    { name: "Maracuja Serum",   brand: "Tarte"  },
    { name: "SPF Sunscreen",    brand: "Round Lab" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-36 font-[var(--font-poppins)]">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="px-5 pt-14 pb-4 flex items-center justify-between">
        <h1 className="text-[22px] font-black text-[#1A1A1A]">Checklist</h1>
      </div>

      {/* ── SKIN HEALTH BANNER ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="px-5 mb-4"
      >
        <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#F3EEFB] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="#A377D2" strokeWidth="1.75" />
                  <path d="M12 7v4l3 2" stroke="#A377D2" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-[13px] font-bold text-[#1A1A1A]">Scanning Your Skin Health</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9A9A9A]" />
          </div>
          {/* Progress */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex-1 h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#A377D2] rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${latest ? latest.glow_score * 10 : 0}%` }}
                transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Dot indicator */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#A377D2] border-2 border-white shadow-sm translate-x-1/2">
                  <div className="w-full h-full rounded-full bg-[#A377D2]" />
                </div>
              </motion.div>
            </div>
            <span className="text-[12px] font-bold text-[#A377D2]">
              {latest ? `${latest.glow_score * 10}%` : "0%"}
            </span>
          </div>
          <p className="text-[11px] text-[#9A9A9A] mt-2">
            You Finished {latest ? `${latest.glow_score * 10}%` : "0%"} Routines for Today.
            Keep it up!
          </p>
        </div>
      </motion.div>

      {/* ── DATE STRIP ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-5 mb-5"
      >
        <div className="bg-white rounded-[24px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3 mb-3">
            <button className="text-[12px] font-bold text-[#A377D2] bg-[#F3EEFB] px-4 py-1.5 rounded-full">
              Daily Progress
            </button>
            <button className="text-[12px] font-bold text-[#9A9A9A] px-4 py-1.5 rounded-full">
              Monthly Progress
            </button>
          </div>
          <DateStrip />
        </div>
      </motion.div>

      {/* ── METRICS GRID ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="px-5 mb-5"
      >
        <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <div className="grid grid-cols-4 gap-2">
            {METRICS.map((m, i) => (
              <MetricCircle key={i} {...m} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── YOUR DAILY ROUTINE ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-5 mb-5"
      >
        <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <p className="text-[15px] font-black text-[#1A1A1A] mb-1">Your Daily Routine</p>
          {ROUTINE.map((r, i) => (
            <RoutineItem key={i} {...r} />
          ))}
        </div>
      </motion.div>

      {/* ── SUGGESTED PRODUCTS ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="px-5 mb-5"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[15px] font-black text-[#1A1A1A]">Suggested products</p>
          <Link href="/shop">
            <span className="text-[12px] font-semibold text-[#A377D2]">See all</span>
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {SUGGEST_PRODUCTS.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.28 + i * 0.07 }}
              className="flex-shrink-0 w-32 bg-white rounded-[20px] p-3 shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
            >
              <div className="w-full h-24 bg-[#F3EEFB] rounded-[14px] mb-2 flex items-center justify-center">
                <ShoppingBag className="w-7 h-7 text-[#A377D2]/40" />
              </div>
              <p className="text-[10px] text-[#9A9A9A]">{p.brand}</p>
              <p className="text-[12px] font-bold text-[#1A1A1A] leading-tight">{p.name}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── EMPTY STATE (no scan yet) ────────────────────────────────── */}
      {entries.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="px-5 text-center mt-4"
        >
          <Link href="/scan">
            <button className="btn-purple w-full">
              <Camera className="w-5 h-5" />
              Start Your First Scan
            </button>
          </Link>
        </motion.div>
      )}
    </div>
  );
}
