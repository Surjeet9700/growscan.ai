"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Share2, Download, Check } from "lucide-react";
import { toast } from "sonner";

interface ShareScoreCardProps {
  score: number;
  skinType: string;
  topConcern: string;
  imageBase64?: string | null;
}

export function ShareScoreCard({ score, skinType, topConcern, imageBase64 }: ShareScoreCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: `My GlowScan Skin Score: ${score}/100`,
          text: `I just got my skin analyzed! My score is ${score}/100 with ${skinType} skin. Check your skin health with GlowScan.`,
          url: window.location.origin,
        });
      } else {
        await navigator.clipboard.writeText(
          `My GlowScan Skin Score: ${score}/100 — ${skinType} skin. Check yours at ${window.location.origin}`
        );
        toast.success("Copied to clipboard!");
      }
    } catch {
      // User cancelled share
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `glowscan-score-${score}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Score card saved!");
    } catch {
      toast.error("Could not generate image");
    }
  };

  return (
    <div className="space-y-3">
      {/* Shareable card */}
      <div
        ref={cardRef}
        className="rounded-[28px] p-6 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #1B1722 0%, #2C233A 42%, #A377D2 100%)",
        }}
      >
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#A377D2]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#7B4FC2]/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white" />
              </svg>
            </div>
            <span className="text-[13px] font-bold tracking-wide">GlowScan</span>
          </div>

          {/* Score */}
          <div className="flex items-center gap-6 mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mb-1">Skin Score</p>
              <div className="flex items-end gap-1">
                <span className="text-[48px] font-black leading-none">{score}</span>
                <span className="text-[18px] font-bold text-white/50 pb-2">/100</span>
              </div>
            </div>
            {imageBase64 && (
              <div className="w-20 h-20 rounded-[16px] overflow-hidden border-2 border-white/20">
                <img src={imageBase64} alt="Scan" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-white/15 text-[11px] font-bold capitalize">
              {skinType}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/15 text-[11px] font-bold">
              {topConcern}
            </span>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <p className="text-[10px] text-white/40">AI-powered skin analysis</p>
            <p className="text-[10px] text-white/40">glowscans-ai.vercel.app</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => void handleShare()}
          disabled={sharing}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-[#A377D2] text-white text-[13px] font-bold shadow-[0_4px_16px_rgba(163,119,210,0.3)] active:scale-[0.98] transition-transform"
        >
          {sharing ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          Share Score
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => void handleDownload()}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white text-[#1A1A1A] text-[13px] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-black/[0.04] active:scale-[0.98] transition-transform"
        >
          <Download className="w-4 h-4" />
          Save
        </motion.button>
      </div>
    </div>
  );
}
