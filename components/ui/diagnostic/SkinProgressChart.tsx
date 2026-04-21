"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressData {
  label: string;
  delta: number;
  color: string;
  bgColor: string;
}

const SAMPLE_PROGRESS: ProgressData[] = [
  { label: "Dryness", delta: -15, color: "#E8956D", bgColor: "#FDEEE7" },
  { label: "Spots", delta: -10, color: "#FBBF24", bgColor: "#FFFBEB" },
  { label: "Acne", delta: -8, color: "#A377D2", bgColor: "#F6F1FB" },
  { label: "Moisture", delta: 5, color: "#0EA5E9", bgColor: "#F0F9FF" },
];

export function SkinProgressChart() {
  return (
    <div className="bg-white rounded-[24px] p-5 shadow-sm border border-black/[0.02]">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-full bg-[#F6F6F6] flex items-center justify-center">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black/40"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
        </div>
        <h3 className="text-[12px] font-bold text-[#2F2F30] uppercase tracking-widest">Your Skin Progress</h3>
      </div>

      <div className="text-center mb-6">
        <span className="text-4xl font-black text-[#2F2F30]">+20%</span>
        <p className="text-[10px] font-bold text-black/20 uppercase tracking-[0.2em] mt-1">Last Scan: 7 Days Ago</p>
      </div>

      <div className="grid grid-cols-4 gap-3 items-end h-28">
        {SAMPLE_PROGRESS.map((item, i) => {
          const isNegative = item.delta < 0;
          return (
            <div key={item.label} className="flex flex-col items-center gap-2 h-full justify-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.abs(item.delta) * 4}px` }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                style={{ backgroundColor: item.bgColor }}
                className="w-full rounded-xl flex flex-col items-center justify-center min-h-[40px]"
              >
                <span style={{ color: item.color }} className="text-[10px] font-black">
                  {isNegative ? "" : "+"}{item.delta}%
                </span>
              </motion.div>
              <span className="text-[9px] font-bold text-black/30 uppercase">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
