"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlowLogo } from "./GlowLogo";

export function WelcomeScreen() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if this is the first load of the session
    const hasSeenWelcome = sessionStorage.getItem("glowscan_welcome_seen");
    
    if (!hasSeenWelcome) {
      setIsVisible(true);
      sessionStorage.setItem("glowscan_welcome_seen", "true");
      
      // Auto-hide after animation sequence
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 2800);
      
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
           initial={{ opacity: 1 }}
           exit={{ 
             opacity: 0,
             transition: { duration: 0.8, ease: "easeInOut" }
           }}
           className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FBFBFD] bg-noise"
        >
          {/* Clinical Gradient Pulse */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative flex flex-col items-center"
          >
            <div className="absolute inset-0 bg-[#A377D2]/10 blur-[100px] rounded-full scale-150" />
            
            <GlowLogo size={120} animate className="relative z-10 mb-8" />
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex flex-col items-center"
            >
              <h1 className="text-2xl font-bold tracking-tight text-black/80 font-poppins">
                GLOW<span className="text-[#A377D2]">SCAN</span>
              </h1>
              <p className="text-xs font-medium text-black/40 mt-1 tracking-widest uppercase">
                Skin Intelligence Portal
              </p>
            </motion.div>
          </motion.div>

          {/* Forensic Progress bar line */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "120px" }}
            transition={{ delay: 0.5, duration: 2, ease: "easeInOut" }}
            className="absolute bottom-12 h-[1px] bg-[#A377D2]/30"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
