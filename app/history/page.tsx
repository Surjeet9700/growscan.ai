"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Camera, ChevronRight, TrendingUp, TrendingDown, ShoppingBag, BarChart3, Calendar as CalendarIcon, Loader2, Sparkles } from "lucide-react";
import { FEATURES } from "@/lib/features";
import { ClimateStressCard } from "@/components/ClimateStressCard";
import { useClimateContext } from "@/lib/use-climate-context";

interface HistoryEntry {
  id: string;
  timestamp: number;
  glow_score: number;
  skin_type: string;
  top_concern: string;
  preview_insight?: string;
  acne_score?: number;
  dryness_score?: number;
  spots_score?: number;
  moisture_score?: number;
}

interface RoutineData {
  dateString: string;
  items: {
    moisturizer: boolean;
    serum: boolean;
    sunscreen: boolean;
    nightCream: boolean;
  };
}

function toDateString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ── Metric Progress Circle ──────────────────────────────────────────────────
function MetricCircle({ label, value, color, trend }: { label: string; value: number; color: string; trend: "high" | "low" }) {
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
          <span className="text-[11px] font-black" style={{ color }}>{Math.round(value)}%</span>
        </div>
      </div>
      <div>
        <p className="text-[11px] font-semibold text-[#1A1A1A] text-center">{label}</p>
        {value > 0 && (
          <div className="flex items-center justify-center gap-0.5 mt-0.5">
            {trend === "high" ? <TrendingUp className="w-3 h-3 text-red-500" /> : <TrendingDown className="w-3 h-3 text-emerald-500" />}
            <span className={`text-[10px] font-semibold ${trend === "high" ? "text-red-500" : "text-emerald-500"}`}>
              {trend === "high" ? "High↑" : "Low↓"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Date Strip (Interactive) ────────────────────────────────────────────────
function DateStrip({ selectedDate, onSelect }: { selectedDate: Date, onSelect: (d: Date) => void }) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  const dates = useMemo(() => {
    const arr = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      arr.push(d);
    }
    return arr;
  }, []);

  return (
    <div className="flex items-center justify-between px-1 mt-3">
      {dates.map((d, i) => {
        const isSelected = toDateString(d) === toDateString(selectedDate);
        return (
          <button 
            key={i} 
            onClick={() => onSelect(d)}
            className="flex flex-col items-center gap-1.5 focus:outline-none"
          >
            <span className="text-[10px] text-[#9A9A9A] font-medium">{days[d.getDay()]}</span>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-all ${
                isSelected ? "bg-[#A377D2] text-white shadow-[0_3px_10px_rgba(163,119,210,0.35)]" : "text-[#1A1A1A]"
              }`}
            >
              {d.getDate()}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Monthly Chart ──────────────────────────────────────────────────────────
function MonthlyChart({ entries }: { entries: HistoryEntry[] }) {
  const dataPoints = useMemo(() => {
    const arr = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    const scoreMap = new Map<string, number>();
    
    entries.forEach(e => {
       const dStr = toDateString(new Date(e.timestamp));
       const current = scoreMap.get(dStr) || 0;
       if (e.glow_score > current) scoreMap.set(dStr, e.glow_score);
    });

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      arr.push({ date: d, score: scoreMap.get(toDateString(d)) || 0 });
    }
    return arr;
  }, [entries]);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
         <h3 className="text-[13px] font-bold text-[#1A1A1A] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#A377D2]" />
            30-Day Glow Trend
         </h3>
      </div>
      <div className="flex items-end justify-between h-32 gap-[2px]">
        {dataPoints.map((dp, i) => (
          <div key={i} className="flex flex-col justify-end w-full group relative">
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: `${dp.score > 0 ? Math.max(dp.score * 10, 5) : 0}%` }}
              transition={{ duration: 0.6, delay: i * 0.015 }}
              className={`w-full rounded-t-[2px] ${dp.score > 0 ? "bg-[#A377D2]" : "bg-black/[0.04]"}`}
              style={{ minHeight: '4px' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Routine Item ────────────────────────────────────────────────────────────
function RoutineItem({ name, fieldId, isDone, onToggle, isUpdating }: { name: string; fieldId: string; isDone: boolean; onToggle: (field: string, val: boolean) => void; isUpdating: boolean }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-black/[0.04] last:border-none">
      <button
        disabled={isUpdating}
        onClick={() => onToggle(fieldId, !isDone)}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors focus:outline-none ${
          isDone ? "border-[#A377D2] bg-[#A377D2]" : "border-black/20 bg-transparent"
        } ${isUpdating ? "opacity-50" : ""}`}
      >
        {isDone && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <div className="flex-1">
        <p className={`text-[14px] font-semibold transition-colors ${isDone ? "text-[#A377D2] line-through opacity-70" : "text-[#1A1A1A]"}`}>{name}</p>
      </div>
    </div>
  );
}

// ── PAGE ────────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [routines, setRoutines] = useState<RoutineData[]>([]);
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");
  const { climate, loading: climateLoading, error: climateError, refresh: refreshClimate } = useClimateContext();
  
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [updatingRoutine, setUpdatingRoutine] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch Scans
        const resHistory = await fetch("/api/history?limit=100");
        const dataHistory = await resHistory.json();
        if (dataHistory.scans) {
          setEntries(dataHistory.scans.map((s: any) => ({
            id: s.id || s._id,
            timestamp: new Date(s.createdAt).getTime(),
            glow_score: s.glow_score ?? s.result?.glow_score ?? 0,
            skin_type: s.skin_type ?? s.result?.skin_type ?? "Unknown",
            top_concern: s.top_concern ?? s.result?.top_concern ?? "None",
            preview_insight: s.preview_insight ?? s.result?.preview_insight,
            acne_score: s.acne_score ?? s.result?.acne_score,
            dryness_score: s.dryness_score ?? s.result?.dryness_score,
            spots_score: s.spots_score ?? s.result?.spots_score,
            moisture_score: s.moisture_score ?? s.result?.moisture_score,
          })));
        }

        // Fetch Routines (past 30 days)
        const dEnd = new Date();
        const dStart = new Date();
        dStart.setDate(dStart.getDate() - 30);
        
        const resRoutines = await fetch(`/api/routine?startDate=${toDateString(dStart)}&endDate=${toDateString(dEnd)}`);
        const dataRoutines = await resRoutines.json();
        if (dataRoutines.routines) {
           setRoutines(dataRoutines.routines);
        }
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleRoutineToggle = async (field: string, value: boolean) => {
    const dStr = toDateString(selectedDate);
    setUpdatingRoutine(field);
    try {
      const res = await fetch("/api/routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateString: dStr, field, value })
      });
      const data = await res.json();
      if (data.success && data.routine) {
        setRoutines(prev => {
           const existing = prev.findIndex(r => r.dateString === dStr);
           if (existing >= 0) {
             const newArr = [...prev];
             newArr[existing] = data.routine;
             return newArr;
           }
           return [...prev, data.routine];
        });
      }
    } catch (err) {
      console.error("Failed to update routine", err);
    } finally {
      setUpdatingRoutine(null);
    }
  };

  // Selectors for currently viewed data
  const dStrSelected = toDateString(selectedDate);
  const currentRoutine = routines.find(r => r.dateString === dStrSelected)?.items || {
    moisturizer: false, serum: false, sunscreen: false, nightCream: false
  };

  const selectedScans = entries.filter(e => toDateString(new Date(e.timestamp)) === dStrSelected);
  const selectedEntry = selectedScans.length > 0 ? selectedScans[0] : null;

  // Determine Monthly averages
  const avgGlow = entries.length > 0 ? Math.round(entries.reduce((acc, e) => acc + e.glow_score, 0) / entries.length) : 0;
  
  // Calculate routine completion % for the banner
  let routinesCompleted = 0;
  if (currentRoutine.moisturizer) routinesCompleted++;
  if (currentRoutine.serum) routinesCompleted++;
  if (currentRoutine.sunscreen) routinesCompleted++;
  if (currentRoutine.nightCream) routinesCompleted++;
  const routinePct = (routinesCompleted / 4) * 100;

  const METRICS = selectedEntry ? [
    { label: "Acne",     value: (selectedEntry.acne_score ?? 0) * 10,     color: "#F87171", trend: "high" as const },
    { label: "Spots",    value: (selectedEntry.spots_score ?? 0) * 10,    color: "#FBBF24", trend: "high" as const },
    { label: "Dryness",  value: (selectedEntry.dryness_score ?? 0) * 10,  color: "#F87171", trend: "high" as const },
    { label: "Moisture", value: (selectedEntry.moisture_score ?? 0) * 10, color: "#34D399", trend: "low"  as const },
  ] : [
    { label: "Acne",     value: 0, color: "#E5E5E5", trend: "high" as const },
    { label: "Spots",    value: 0, color: "#E5E5E5", trend: "high" as const },
    { label: "Dryness",  value: 0, color: "#E5E5E5", trend: "high" as const },
    { label: "Moisture", value: 0, color: "#E5E5E5", trend: "low"  as const },
  ];

  const ROUTINE_LIST = [
    { id: "moisturizer", name: "Apply Moisturizer" },
    { id: "serum",       name: "Vitamin C Serum" },
    { id: "sunscreen",   name: "SPF 50+ Sunscreen" },
    { id: "nightCream",  name: "Night Repair Cream" },
  ];

  const SUGGEST_PRODUCTS = [
    { name: "Skin Moisturizer", brand: "Klairs" },
    { name: "Maracuja Serum",   brand: "Tarte"  },
    { name: "SPF Sunscreen",    brand: "Round Lab" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-36 font-[var(--font-poppins)]">
      {/* ── HEADER ── */}
      <div className="px-5 pt-14 pb-4 flex items-center justify-between">
        <h1 className="text-[22px] font-black text-[#1A1A1A]">History & Progress</h1>
      </div>

      {/* ── BANNER ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="px-5 mb-4">
        <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#F3EEFB] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="#A377D2" strokeWidth="1.75" />
                  <path d="M12 7v4l3 2" stroke="#A377D2" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-[13px] font-bold text-[#1A1A1A]">
                {viewMode === "daily" ? "Daily Routine Completion" : "Overall Glow Score Average"}
              </p>
            </div>
            {isLoading && <Loader2 className="w-4 h-4 text-[#9A9A9A] animate-spin" />}
          </div>
          
          <div className="flex items-center gap-3 mt-3">
            <div className="flex-1 h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#A377D2] rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${viewMode === "daily" ? routinePct : avgGlow * 10}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#A377D2] border-2 border-white shadow-sm translate-x-1/2" />
              </motion.div>
            </div>
            <span className="text-[12px] font-bold text-[#A377D2]">
              {viewMode === "daily" ? `${routinePct}%` : `${avgGlow * 10}%`}
            </span>
          </div>
          <p className="text-[11px] text-[#9A9A9A] mt-2">
            {viewMode === "daily" 
               ? `You finished ${routinesCompleted} of 4 routines for ${dStrSelected}. Keep it up!`
               : `Your average skin score is ${avgGlow}/10 over all time.`}
          </p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="px-5 mb-4">
        <ClimateStressCard
          climate={climate}
          loading={climateLoading}
          error={climateError}
          onRetry={() => void refreshClimate()}
          title="Today’s Environment Pressure"
          subtitle="Live local conditions"
        />
      </motion.div>

      {/* ── TOGGLE & VIEWS ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="px-5 mb-5">
        <div className="bg-white rounded-[24px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3 mb-1">
            <button 
              onClick={() => setViewMode("daily")}
              className={`text-[12px] font-bold px-4 py-1.5 rounded-full transition-colors ${viewMode === "daily" ? "text-[#A377D2] bg-[#F3EEFB]" : "text-[#9A9A9A] hover:bg-black/5"}`}
            >
              Daily Progress
            </button>
            <button 
              onClick={() => setViewMode("monthly")}
              className={`text-[12px] font-bold px-4 py-1.5 rounded-full transition-colors ${viewMode === "monthly" ? "text-[#A377D2] bg-[#F3EEFB]" : "text-[#9A9A9A] hover:bg-black/5"}`}
            >
              Monthly Progress
            </button>
          </div>
          
          {viewMode === "daily" ? (
             <DateStrip selectedDate={selectedDate} onSelect={setSelectedDate} />
          ) : (
             <MonthlyChart entries={entries} />
          )}
        </div>
      </motion.div>

      {/* ── DAILY VIEW SPECIFIC CONTENT ── */}
      {viewMode === "daily" && (
        <>
          {/* METRICS GRID */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="px-5 mb-5">
            <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] relative overflow-hidden">
              {!selectedEntry && !isLoading && (
                 <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                    <p className="text-sm font-bold text-[#1A1A1A]">No scan for this day</p>
                    {toDateString(selectedDate) === toDateString(new Date()) && (
                      <Link href="/scan">
                        <button className="mt-2 text-xs font-bold text-white bg-[#A377D2] px-4 py-1.5 rounded-full shadow-md">Scan Now</button>
                      </Link>
                    )}
                 </div>
              )}
              <div className="grid grid-cols-4 gap-2">
                {METRICS.map((m, i) => (
                  <MetricCircle key={i} {...m} />
                ))}
              </div>
            </div>
          </motion.div>

          {/* ROUTINE LIST */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="px-5 mb-5">
            <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-2">
                 <p className="text-[15px] font-black text-[#1A1A1A]">Your Checklist</p>
                 <CalendarIcon className="w-4 h-4 text-[#A377D2]" />
              </div>
              {ROUTINE_LIST.map((r, i) => (
                <RoutineItem 
                   key={i} 
                   name={r.name} 
                   fieldId={r.id}
                   isDone={currentRoutine[r.id as keyof typeof currentRoutine]}
                   onToggle={handleRoutineToggle}
                   isUpdating={updatingRoutine === r.id}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}

      {FEATURES.commerce ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="px-5 mb-5">
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
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="px-5 mb-5">
          <div className="bg-[linear-gradient(145deg,#FFFFFF_0%,#FBF7FF_100%)] rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-[#F1E9FB]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-[14px] bg-[#F3EEFB] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#A377D2]" />
              </div>
              <div>
                <p className="text-[15px] font-black text-[#1A1A1A]">Progress journal</p>
                <p className="text-[11px] text-[#9A9A9A]">Public launch keeps the focus on scans and consistency.</p>
              </div>
            </div>
            <p className="text-[13px] leading-relaxed text-[#5D5766]">
              Use this screen as the habit layer: repeat scans weekly, mark daily routine completion, and watch the monthly glow trend stabilize before adding shopping.
            </p>
          </div>
        </motion.div>
      )}

    </div>
  );
}
