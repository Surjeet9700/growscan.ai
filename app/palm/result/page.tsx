"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Share2, Heart, Brain, Zap, Eye, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { PalmReadingResult } from "@/lib/palm-types";
import { PALM_LINE_COLORS, PALM_LINE_LABELS } from "@/lib/palm-types";
import { PalmLineOverlay } from "@/components/PalmLineOverlay";
import { useTypewriter } from "@/lib/use-typewriter";

function ScoreRing({ value, color, label, icon: Icon }: { value: number; color: string; label: string; icon: React.ElementType }) {
  const size = 64;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-16 h-16">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="w-3.5 h-3.5 mb-0.5" style={{ color }} />
          <span className="text-[14px] font-black text-white">{value}</span>
        </div>
      </div>
      <span className="text-[10px] font-semibold text-white/60 text-center leading-tight">{label}</span>
    </div>
  );
}

function TypewriterBlock({ text, delay = 0 }: { text: string; delay?: number }) {
  const { displayedText, isTyping } = useTypewriter(text, { speed: 20, delay });
  return (
    <span>
      {displayedText}
      {isTyping && <span className="animate-pulse text-[#A377D2]">|</span>}
    </span>
  );
}

export default function PalmResultPage() {
  const [data, setData] = useState<PalmReadingResult | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [activeLine, setActiveLine] = useState<string | null>(null);
  const [showReading, setShowReading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedResult = sessionStorage.getItem("palm_result");
    const storedImage = sessionStorage.getItem("palm_image");

    if (storedResult) {
      try {
        setData(JSON.parse(storedResult));
        setImage(storedImage);
        setTimeout(() => setShowReading(true), 500);
      } catch {
        toast.error("Could not load palm reading. Please try again.");
        router.push("/palm");
      }
    } else {
      toast.info("No palm reading found. Please scan your palm first.");
      router.push("/palm");
    }
  }, [router]);

  const handleShare = useCallback(async () => {
    if (!data) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "My AI Palm Reading",
          text: `${data.summary} My hidden trait: ${data.hidden_trait} Get your palm read at GlowScan!`,
          url: window.location.origin,
        });
      } else {
        await navigator.clipboard.writeText(
          `My AI Palm Reading: ${data.summary} Hidden trait: ${data.hidden_trait} ${window.location.origin}`
        );
        toast.success("Copied to clipboard!");
      }
    } catch {}
  }, [data]);

  if (!data || !image) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#A377D2]" />
      </div>
    );
  }

  const lineEntries = Object.entries(data.lines) as [string, { reading: string; coordinates: Array<{ x: number; y: number }> }][];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1B1722_0%,#2C233A_38%,#1A1A1A_100%)] font-[var(--font-poppins)] text-white pb-32">

      {/* Header */}
      <div className="px-5 pt-14 pb-3 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
        >
          <ArrowLeft className="w-[18px] h-[18px] text-white" strokeWidth={2} />
        </button>
        <h1 className="text-[17px] font-black text-white">Your Palm Reading</h1>
        <button
          onClick={() => void handleShare()}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
        >
          <Share2 className="w-[18px] h-[18px] text-white" />
        </button>
      </div>

      {/* Palm image with SVG overlay */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="px-5 mb-6"
      >
        <div className="relative rounded-[28px] overflow-hidden bg-black/50 aspect-[3/4] max-w-[360px] mx-auto">
          <img
            src={image}
            alt="Your palm"
            className="w-full h-full object-cover"
          />
          <PalmLineOverlay
            lines={data.lines}
            activeLine={activeLine}
            onLineClick={(name) => setActiveLine(activeLine === name ? null : name)}
          />

          {/* Tap hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="absolute bottom-4 left-0 right-0 flex justify-center"
          >
            <span className="px-3 py-1 rounded-full bg-black/50 text-white/60 text-[10px] font-medium">
              Tap a line to read more
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Summary */}
      <AnimatePresence>
        {showReading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="px-5 mb-6"
          >
            <div className="rounded-[24px] bg-white/[0.06] border border-white/[0.08] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A377D2] mb-2">Your Reading</p>
              <p className="text-[15px] font-semibold text-white/90 leading-relaxed">
                <TypewriterBlock text={data.summary} delay={500} />
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scores */}
      <AnimatePresence>
        {showReading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="px-5 mb-6"
          >
            <div className="rounded-[24px] bg-white/[0.06] border border-white/[0.08] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-4">Your Scores</p>
              <div className="flex items-center justify-around">
                <ScoreRing value={data.scores.emotional_strength} color="#FF6B8A" label="Emotional Strength" icon={Heart} />
                <ScoreRing value={data.scores.intellectual_drive} color="#7B68EE" label="Intellectual Drive" icon={Brain} />
                <ScoreRing value={data.scores.vitality} color="#FF8C42" label="Vitality" icon={Zap} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Line readings */}
      <AnimatePresence>
        {showReading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="px-5 mb-6"
          >
            <div className="rounded-[24px] bg-white/[0.06] border border-white/[0.08] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-4">Line Readings</p>
              <div className="space-y-4">
                {lineEntries.map(([name, line], i) => {
                  const color = PALM_LINE_COLORS[name as keyof typeof PALM_LINE_COLORS];
                  const label = PALM_LINE_LABELS[name as keyof typeof PALM_LINE_LABELS];
                  const isActive = activeLine === name;

                  return (
                    <motion.button
                      key={name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + i * 0.15 }}
                      onClick={() => setActiveLine(isActive ? null : name)}
                      className={`w-full text-left rounded-[18px] p-4 transition-all ${
                        isActive ? "bg-white/[0.08] border border-white/[0.12]" : "bg-white/[0.03] border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-[13px] font-bold text-white">{label}</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-white/40 ml-auto transition-transform ${isActive ? "rotate-180" : ""}`} />
                      </div>
                      <AnimatePresence>
                        {isActive && (
                          <motion.p
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="text-[12px] text-white/70 leading-relaxed overflow-hidden"
                          >
                            <TypewriterBlock text={line.reading} />
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Trait — viral hook */}
      <AnimatePresence>
        {showReading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="px-5 mb-6"
          >
            <div className="rounded-[28px] p-6 relative overflow-hidden" style={{
              background: "linear-gradient(135deg, #A377D2 0%, #7B4FC2 50%, #5B3A9E 100%)",
            }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-white/80" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Hidden Trait</span>
                </div>
                <p className="text-[15px] font-bold text-white leading-relaxed mb-4">
                  <TypewriterBlock text={data.hidden_trait} delay={2000} />
                </p>
                <button
                  onClick={() => void handleShare()}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[#7B4FC2] text-[12px] font-bold active:scale-[0.97] transition-transform"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share this discovery
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disclaimer */}
      <div className="px-5 mt-8">
        <p className="text-[10px] text-white/30 text-center leading-relaxed">
          {data.disclaimer || "This reading is generated by AI for entertainment purposes and self-reflection."}
        </p>
      </div>
    </div>
  );
}
