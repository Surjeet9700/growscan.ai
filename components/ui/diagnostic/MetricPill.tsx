"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MetricPillProps {
  label: string;
  value: number;
  status?: "Elevated" | "Stable" | "Low" | "High";
  className?: string;
  delay?: number;
}

export function MetricPill({ label, value, status, className, delay = 0 }: MetricPillProps) {
  // Circular Ring Calc
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const getStatusColor = (s?: string) => {
    switch (s) {
      case "High":
      case "Elevated":
        return "text-[#FF4B4B]";
      case "Low":
        return "text-[#F59E0B]";
      default:
        return "text-[#A377D2]";
    }
  };

  const getRingColor = (s?: string) => {
    switch (s) {
      case "High":
      case "Elevated":
        return "#FF4B4B";
      case "Low":
        return "#F59E0B";
      default:
        return "#A377D2";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex flex-col items-center justify-between bg-white rounded-[32px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-black/[0.02] h-[180px] w-full",
        className
      )}
    >
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#2F2F30]/40">
          {label}
        </span>
        {status && (
          <span className={cn("text-[9px] font-black uppercase flex items-center gap-0.5", getStatusColor(status))}>
            {status} {status === "High" || status === "Elevated" ? "↑" : "↓"}
          </span>
        )}
      </div>

      <div className="relative flex items-center justify-center w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background Ring */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-[#F6F1FB]"
          />
          {/* Progress Ring */}
          <motion.circle
            cx="48"
            cy="48"
            r={radius}
            stroke={getRingColor(status)}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, delay: delay + 0.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-[#2F2F30]">{value}%</span>
        </div>
      </div>
    </motion.div>
  );
}
