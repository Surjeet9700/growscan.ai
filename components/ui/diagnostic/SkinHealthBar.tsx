"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkinHealthBarProps {
  label: string;
  value: number;
  className?: string;
}

export function SkinHealthBar({ label, value, className }: SkinHealthBarProps) {
  return (
    <div className={cn("w-full space-y-3 px-5", className)}>
      <div className="flex items-end justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#2F2F30]">
          {label}
        </h3>
        <span className="text-2xl font-black text-[#A377D2] leading-none">
          {value}%
        </span>
      </div>
      
      <div className="relative h-3 w-full bg-[#F6F1FB] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="h-full bg-gradient-to-r from-[#A377D2] to-[#D8B4FE] rounded-full"
        />
      </div>
    </div>
  );
}
