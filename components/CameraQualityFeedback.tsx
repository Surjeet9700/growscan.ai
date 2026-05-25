"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Move, ZoomIn, CheckCircle } from "lucide-react";

interface QualityCheck {
  id: string;
  label: string;
  status: "good" | "warning" | "bad";
  icon: React.ElementType;
}

interface CameraQualityFeedbackProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  onQualityChange?: (isGood: boolean) => void;
}

export function CameraQualityFeedback({ videoRef, isActive, onQualityChange }: CameraQualityFeedbackProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [checks, setChecks] = useState<QualityCheck[]>([]);
  const prevBrightnessRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);

  const analyzeFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(analyzeFrame);
      return;
    }

    canvas.width = 160;
    canvas.height = 120;
    ctx.drawImage(video, 0, 0, 160, 120);

    const imageData = ctx.getImageData(0, 0, 160, 120);
    const data = imageData.data;

    let totalBrightness = 0;
    const pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    const avgBrightness = totalBrightness / pixelCount;

    const brightnessDiff = Math.abs(avgBrightness - prevBrightnessRef.current);
    prevBrightnessRef.current = avgBrightness;

    const newChecks: QualityCheck[] = [];

    if (avgBrightness < 40) {
      newChecks.push({ id: "light", label: "Too dark — find better lighting", status: "bad", icon: Sun });
    } else if (avgBrightness < 70) {
      newChecks.push({ id: "light", label: "Lighting could be better", status: "warning", icon: Sun });
    } else if (avgBrightness > 220) {
      newChecks.push({ id: "light", label: "Too bright — reduce lighting", status: "warning", icon: Sun });
    } else {
      newChecks.push({ id: "light", label: "Good lighting", status: "good", icon: Sun });
    }

    if (brightnessDiff > 15) {
      newChecks.push({ id: "stable", label: "Hold steady", status: "warning", icon: Move });
    } else {
      newChecks.push({ id: "stable", label: "Stable", status: "good", icon: Move });
    }

    const centerRegionBrightness = getCenterBrightness(data, 160, 120);
    if (centerRegionBrightness < 30) {
      newChecks.push({ id: "face", label: "Center your face in the frame", status: "bad", icon: ZoomIn });
    } else {
      newChecks.push({ id: "face", label: "Face detected", status: "good", icon: CheckCircle });
    }

    setChecks(newChecks);

    const hasBad = newChecks.some((c) => c.status === "bad");
    onQualityChange?.(!hasBad);

    animFrameRef.current = requestAnimationFrame(analyzeFrame);
  }, [videoRef, isActive, onQualityChange]);

  useEffect(() => {
    if (isActive) {
      animFrameRef.current = requestAnimationFrame(analyzeFrame);
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isActive, analyzeFrame]);

  if (!isActive || checks.length === 0) return null;

  const overallStatus = checks.some((c) => c.status === "bad")
    ? "bad"
    : checks.some((c) => c.status === "warning")
    ? "warning"
    : "good";

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute bottom-4 left-4 right-4 z-40"
        >
          <div
            className={`rounded-[16px] px-4 py-3 backdrop-blur-md border transition-colors ${
              overallStatus === "good"
                ? "bg-emerald-500/10 border-emerald-500/20"
                : overallStatus === "warning"
                ? "bg-amber-500/10 border-amber-500/20"
                : "bg-red-500/10 border-red-500/20"
            }`}
          >
            <div className="flex items-center gap-3">
              {checks.map((check) => {
                const Icon = check.icon;
                return (
                  <div key={check.id} className="flex items-center gap-1.5">
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        check.status === "good"
                          ? "text-emerald-500"
                          : check.status === "warning"
                          ? "text-amber-500"
                          : "text-red-500"
                      }`}
                    />
                    <span
                      className={`text-[11px] font-medium ${
                        check.status === "good"
                          ? "text-emerald-700"
                          : check.status === "warning"
                          ? "text-amber-700"
                          : "text-red-700"
                      }`}
                    >
                      {check.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

function getCenterBrightness(data: Uint8ClampedArray, width: number, height: number): number {
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const radius = 30;
  let totalBrightness = 0;
  let pixelCount = 0;

  for (let y = centerY - radius; y < centerY + radius; y++) {
    for (let x = centerX - radius; x < centerX + radius; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        totalBrightness += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        pixelCount++;
      }
    }
  }

  return pixelCount > 0 ? totalBrightness / pixelCount : 0;
}
