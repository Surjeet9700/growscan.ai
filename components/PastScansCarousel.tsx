"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, ScanSearch } from "lucide-react";

interface PastScan {
  id: string;
  glow_score: number;
  skin_type: string;
  timestamp: number;
}

function timeAgo(ts: number) {
  const d = Math.floor((Date.now() - ts) / 86_400_000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d} days ago`;
}

function ScoreRing({ score }: { score: number }) {
  const size = 48;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - (score * 10) / 100);

  return (
    <div className="relative w-12 h-12">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#A377D2"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-black text-[#A377D2]">{Math.round(score * 10)}</span>
      </div>
    </div>
  );
}

export function PastScansCarousel() {
  const [scans, setScans] = useState<PastScan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/history?limit=5", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.scans) {
          setScans(
            data.scans.map((s: Record<string, unknown>) => ({
              id: (s.id as string) || (s._id as string),
              glow_score: (s.glow_score as number) ?? 0,
              skin_type: (s.skin_type as string) ?? "Unknown",
              timestamp: new Date(s.createdAt as string).getTime(),
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  if (loading || scans.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="mb-5"
    >
      <div className="px-5 flex items-center justify-between mb-3">
        <p className="text-[16px] font-black text-[#1A1A1A]">Past Scans</p>
        <Link href="/history">
          <span className="text-[12px] font-semibold text-[#A377D2]">See all</span>
        </Link>
      </div>
      <div className="flex gap-3 px-5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {scans.map((scan, i) => (
          <motion.div
            key={scan.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link href="/result/free">
              <div className="flex-shrink-0 w-36 bg-white rounded-[20px] p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] active:scale-[0.97] transition-transform">
                <div className="flex items-center justify-between mb-2">
                  <ScoreRing score={scan.glow_score} />
                  <ChevronRight className="w-4 h-4 text-[#BBBBBB]" />
                </div>
                <p className="text-[12px] font-bold text-[#1A1A1A] capitalize">{scan.skin_type}</p>
                <p className="text-[10px] text-[#9A9A9A] mt-0.5">{timeAgo(scan.timestamp)}</p>
              </div>
            </Link>
          </motion.div>
        ))}

        {/* "New Scan" card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 + scans.length * 0.06, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link href="/scan">
            <div className="flex-shrink-0 w-36 bg-[#F3EEFB] rounded-[20px] p-3.5 flex flex-col items-center justify-center gap-2 active:scale-[0.97] transition-transform" style={{ minHeight: "110px" }}>
              <div className="w-10 h-10 rounded-full bg-[#A377D2]/20 flex items-center justify-center">
                <ScanSearch className="w-5 h-5 text-[#A377D2]" />
              </div>
              <p className="text-[12px] font-bold text-[#A377D2]">New Scan</p>
            </div>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
