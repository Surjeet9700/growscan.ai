"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Lotus Leaf SVG — matches the Behance splash screen exactly
function LotusIcon({ size = 80 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Center petal */}
      <path
        d="M50 80 C50 60 35 40 50 20 C65 40 50 60 50 80Z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Left petal */}
      <path
        d="M50 70 C40 60 20 58 15 42 C30 38 45 52 50 70Z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Right petal */}
      <path
        d="M50 70 C60 60 80 58 85 42 C70 38 55 52 50 70Z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Far left petal */}
      <path
        d="M30 65 C25 50 10 48 8 35 C20 32 32 45 30 65Z"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.7"
      />
      {/* Far right petal */}
      <path
        d="M70 65 C75 50 90 48 92 35 C80 32 68 45 70 65Z"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.7"
      />
      {/* Stem */}
      <path
        d="M50 80 C50 88 48 92 50 96"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
}

export function WelcomeScreen() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem("glowscan_welcome_seen");
    if (!hasSeenWelcome) {
      setIsVisible(true);
      sessionStorage.setItem("glowscan_welcome_seen", "true");
      const timer = setTimeout(() => setIsVisible(false), 2800);
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
            transition: { duration: 0.6, ease: "easeInOut" },
          }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{
            background: "linear-gradient(160deg, #C39FE4 0%, #A377D2 45%, #8B5FC7 100%)",
          }}
        >
          {/* Background soft blur blob */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(139,95,199,0.4) 0%, transparent 50%)",
            }}
          />

          {/* Content */}
          <div className="relative flex flex-col items-center gap-6">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <LotusIcon size={88} />
            </motion.div>

            {/* App Name */}
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
              className="flex flex-col items-center gap-1"
            >
              <h1
                className="text-[28px] font-black text-white tracking-[0.12em] uppercase"
                style={{ fontFamily: "var(--font-poppins), sans-serif" }}
              >
                GlowScan
              </h1>
              <p
                className="text-[12px] text-white/70 tracking-[0.25em] uppercase font-medium"
                style={{ fontFamily: "var(--font-poppins), sans-serif" }}
              >
                AI Skin Intelligence
              </p>
            </motion.div>
          </div>

          {/* Bottom progress line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 2, ease: "easeInOut" }}
            className="absolute bottom-20 h-[2px] w-16 rounded-full bg-white/40 origin-left"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
