"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";

interface BeforeAfterComparisonProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function BeforeAfterComparison({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "Now",
}: BeforeAfterComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = useCallback(() => setIsDragging(true), []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      updatePosition(e.clientX);
    },
    [isDragging, updatePosition]
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleTouchStart = useCallback(() => setIsDragging(true), []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      updatePosition(e.touches[0].clientX);
    },
    [isDragging, updatePosition]
  );

  const handleTouchEnd = useCallback(() => setIsDragging(false), []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative select-none"
    >
      <div
        ref={containerRef}
        className="relative w-full aspect-[3/4] rounded-[24px] overflow-hidden cursor-col-resize shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* After image (full width) */}
        <div className="absolute inset-0">
          <img src={afterImage} alt="After" className="w-full h-full object-cover" />
        </div>

        {/* Before image (clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeImage}
            alt="Before"
            className="w-full h-full object-cover"
            style={{ width: `${containerRef.current?.offsetWidth || 100}px`, maxWidth: "none" }}
          />
        </div>

        {/* Slider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.3)] z-10"
          style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
        >
          {/* Slider handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.2)] flex items-center justify-center">
            <div className="flex items-center gap-0.5">
              <svg width="6" height="12" viewBox="0 0 6 12" fill="none">
                <path d="M5 1L1 6L5 11" stroke="#A377D2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <svg width="6" height="12" viewBox="0 0 6 12" fill="none">
                <path d="M1 1L5 6L1 11" stroke="#A377D2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-4 left-4 z-20">
          <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-[11px] font-bold">
            {beforeLabel}
          </span>
        </div>
        <div className="absolute top-4 right-4 z-20">
          <span className="px-3 py-1 rounded-full bg-[#A377D2]/80 backdrop-blur-sm text-white text-[11px] font-bold">
            {afterLabel}
          </span>
        </div>
      </div>

      <p className="text-center text-[11px] text-[#9A9A9A] mt-2">
        Drag to compare
      </p>
    </motion.div>
  );
}
