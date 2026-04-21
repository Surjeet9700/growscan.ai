"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassResultCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function GlassResultCard({ children, className, delay = 0 }: GlassResultCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "bg-white/60 backdrop-blur-3xl border border-white/40 shadow-[0_8px_32px_0_rgba(163,119,210,0.08)] rounded-[32px] overflow-hidden",
        className
      )}
    >
      {/* Visual Grab Handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-[#2F2F30]/10" />
      </div>
      
      <div className="p-5 pt-2">
        {children}
      </div>
    </motion.div>
  );
}
