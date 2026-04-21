"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GlowLogoProps {
  className?: string;
  size?: number;
  animate?: boolean;
}

export function GlowLogo({ className, size = 48, animate = false }: GlowLogoProps) {
  const pathVariants = {
    initial: { pathLength: 0, opacity: 0 },
    animate: { 
      pathLength: 1, 
      opacity: 1,
      transition: {
        duration: 1.5,
        ease: "easeInOut" as any,
      }
    }
  };

  return (
    <motion.svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-[#A377D2]", className)}
      initial={animate ? "initial" : undefined}
      animate={animate ? "animate" : undefined}
    >
      <motion.path 
        d="M50 50C50 50 70 30 85 30C100 30 100 50 85 65C70 80 50 50 50 50ZM50 50C50 50 30 70 15 70C0 70 0 50 15 35C30 20 50 50 50 50ZM50 50C50 50 50 80 65 95C80 110 100 110 85 85C70 60 50 50 50 50Z" 
        stroke="currentColor" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        variants={pathVariants}
      />
    </motion.svg>
  );
}
