"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Camera, ChevronRight, Clock, TrendingUp, TrendingDown, Sparkles } from "lucide-react";

interface HistoryEntry {
  id: string;
  timestamp: number;
  glow_score: number;
  skin_type: string;
  top_concern: string;
  skin_type_reason?: string;
  preview_insight?: string;
}

function ScorePill({ score }: { score: number }) {
  const styles =
    score >= 7
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : score >= 5
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-red-100 text-red-700 border-red-200";
  return (
    <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${styles}`}>
      {score}/10
    </span>
  );
}

function MiniTrend({ entries }: { entries: HistoryEntry[] }) {
  if (entries.length < 2) return null;
  const diff = entries[0].glow_score - entries[1].glow_score;
  if (diff === 0) return <span className="text-xs font-bold text-black/40">No change</span>;
  const up = diff > 0;
  return (
    <div className={`flex items-center gap-1 text-xs font-bold ${up ? "text-emerald-600" : "text-red-500"}`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? "+" : ""}{diff.toFixed(1)} from last scan
    </div>
  );
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("glowscan_history");
      if (raw) setEntries(JSON.parse(raw));
    } catch { /* no-op */ }
  }, []);

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-background pb-32">

      {/* ── HEADER ── */}
      <div className="px-6 pt-8 pb-2">
        <h1 className="text-3xl font-black text-ink">History</h1>
        <p className="text-sm text-black/40 font-medium mt-0.5">Your skin journey over time</p>
      </div>

      {entries.length === 0 ? (
        /* ── EMPTY STATE ── */
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center px-8 py-20 text-center gap-5"
        >
          <div className="w-20 h-20 rounded-full bg-black/5 flex items-center justify-center">
            <Clock className="w-9 h-9 text-black/20" />
          </div>
          <div>
            <p className="text-base font-black text-ink">No scans yet</p>
            <p className="text-sm text-black/40 mt-1 max-w-[220px]">
              Your results will appear here after your first skin scan
            </p>
          </div>
          <Link href="/scan">
            <button className="btn-black gap-2">
              <Camera className="w-4 h-4" />
              Start First Scan
            </button>
          </Link>
        </motion.div>
      ) : (
        <div className="px-6 mt-4 space-y-4">

          {/* ── TREND BANNER ── */}
          {entries.length >= 2 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="card-premium flex items-center justify-between px-4 py-3"
            >
              <span className="text-xs text-black/40 font-bold">Progress since last scan</span>
              <MiniTrend entries={entries} />
            </motion.div>
          )}

          {/* ── ENTRY LIST ── */}
          {entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="card-premium p-4 space-y-3"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-ink capitalize">{entry.skin_type} skin</span>
                    {i === 0 && (
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                        Latest
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="w-3 h-3 text-black/25" />
                    <span className="text-[10px] text-black/35 font-medium">
                      {formatDate(entry.timestamp)} · {formatTime(entry.timestamp)}
                    </span>
                  </div>
                </div>
                <ScorePill score={entry.glow_score} />
              </div>

              {/* Top concern */}
              {entry.top_concern && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-black/30 font-bold uppercase tracking-widest">Top concern:</span>
                  <span className="text-xs font-black text-rose-600 capitalize truncate">{entry.top_concern}</span>
                </div>
              )}

              {/* Insight excerpt */}
              {entry.preview_insight && (
                <p className="text-xs text-black/50 leading-relaxed line-clamp-2 italic">
                  "{entry.preview_insight}"
                </p>
              )}

              {/* CTA for latest */}
              {i === 0 && (
                <Link href="/result/free" className="block">
                  <button className="w-full mt-1 flex items-center justify-center gap-1.5 text-xs font-black text-ink py-2.5 rounded-2xl bg-black/5 hover:bg-black/8 active:scale-[0.98] transition-all">
                    View full results <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              )}
            </motion.div>
          ))}

          {/* ── RESCAN CTA ── */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="pt-2 pb-4"
          >
            <Link href="/scan">
              <button className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-black/8 bg-white text-sm text-black/50 font-bold hover:bg-black/3 active:scale-[0.98] transition-all">
                <Camera className="w-4 h-4" />
                Scan again to track progress
              </button>
            </Link>
          </motion.div>

        </div>
      )}
    </div>
  );
}
