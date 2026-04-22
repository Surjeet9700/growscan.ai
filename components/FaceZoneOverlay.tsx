"use client";

/**
 * FaceZoneOverlay — Neon glow SVG zone highlights drawn over a face photo.
 *
 * Inspired by the Behance reference showing glowing zone outlines 
 * (purple forehead lines, yellow cheek/nose mask, pink spots).
 *
 * Usage:
 *   <FaceZoneOverlay imageBase64={image} zones={result.face_zones} />
 */

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FaceZone, FaceZoneSeverity } from "@/lib/types";

// ── Zone color palette (neon, severity-based) ─────────────────────────────────
const SEVERITY_COLORS: Record<FaceZoneSeverity, { stroke: string; fill: string; label: string }> = {
  none:     { stroke: "#4ade80", fill: "rgba(74, 222, 128, 0.08)",  label: "Healthy" },
  mild:     { stroke: "#fbbf24", fill: "rgba(251, 191, 36, 0.08)",  label: "Mild" },
  moderate: { stroke: "#fb923c", fill: "rgba(251, 146, 60, 0.10)",  label: "Moderate" },
  severe:   { stroke: "#f472b6", fill: "rgba(244, 114, 182, 0.12)", label: "Attention" },
};

// ── Static zone geometry (% of container width/height) ──────────────────────
// These are tuned for a standard portrait/selfie face proportion (3:4 aspect)
const ZONE_GEOMETRY: Record<string, {
  type: "ellipse" | "path";
  cx?: number; cy?: number; rx?: number; ry?: number;  // ellipse
  d?: string;                                            // path (viewBox 100×100)
  labelX: number; labelY: number;
}> = {
  forehead: {
    type: "path",
    // A wide arch over the top of the face
    d: "M 25 18 Q 50 8 75 18 Q 72 34 50 36 Q 28 34 25 18 Z",
    labelX: 50, labelY: 10,
  },
  nose: {
    type: "ellipse",
    cx: 50, cy: 52, rx: 10, ry: 13,
    labelX: 63, labelY: 52,
  },
  left_cheek: {
    type: "ellipse",
    cx: 24, cy: 57, rx: 13, ry: 15,
    labelX: 11, labelY: 57,
  },
  right_cheek: {
    type: "ellipse",
    cx: 76, cy: 57, rx: 13, ry: 15,
    labelX: 89, labelY: 57,
  },
  chin: {
    type: "ellipse",
    cx: 50, cy: 78, rx: 16, ry: 9,
    labelX: 50, labelY: 90,
  },
};

// ── Helper: get zone color, with fallback ─────────────────────────────────────
function getZoneColor(severity: FaceZoneSeverity) {
  return SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.mild;
}

// ── Individual zone shape ─────────────────────────────────────────────────────
function ZoneShape({
  zone,
  isActive,
  onClick,
}: {
  zone: FaceZone;
  isActive: boolean;
  onClick: () => void;
}) {
  const geo = ZONE_GEOMETRY[zone.zone];
  if (!geo) return null;

  const color = getZoneColor(zone.severity);
  const strokeWidth = isActive ? 2 : 1.5;
  const opacity = zone.severity === "none" ? 0.4 : 1;

  const shapeProps = {
    fill: color.fill,
    stroke: color.stroke,
    strokeWidth,
    opacity,
    style: {
      filter: `drop-shadow(0 0 ${isActive ? "6px" : "3px"} ${color.stroke})`,
      cursor: "pointer",
    },
    onClick,
  };

  return (
    <g>
      {/* Animated outer pulse ring (active only) */}
      {isActive && (
        <motion.g
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: [0.95, 1.08, 0.95], opacity: [0.4, 0.1, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: `${geo.cx ?? 50}% ${geo.cy ?? 50}%` }}
        >
          {geo.type === "ellipse" ? (
            <ellipse
              cx={geo.cx} cy={geo.cy}
              rx={(geo.rx ?? 10) + 3} ry={(geo.ry ?? 10) + 3}
              fill="none"
              stroke={color.stroke}
              strokeWidth={0.8}
              opacity={0.3}
            />
          ) : (
            <path d={geo.d} fill="none" stroke={color.stroke} strokeWidth={0.8} opacity={0.3} />
          )}
        </motion.g>
      )}

      {/* Main zone shape */}
      {geo.type === "ellipse" ? (
        <motion.ellipse
          cx={geo.cx} cy={geo.cy}
          rx={geo.rx} ry={geo.ry}
          strokeDasharray={zone.severity === "none" ? "none" : "4 2"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          {...shapeProps}
        />
      ) : (
        <motion.path
          d={geo.d}
          strokeDasharray={zone.severity === "none" ? "none" : "5 2"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          {...shapeProps}
        />
      )}

      {/* Severity dot indicator */}
      {zone.severity !== "none" && (
        <motion.circle
          cx={geo.labelX}
          cy={geo.labelY}
          r={3}
          fill={color.stroke}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          style={{ filter: `drop-shadow(0 0 4px ${color.stroke})` }}
          onClick={onClick}
        />
      )}
    </g>
  );
}

// ── Zone info tooltip ─────────────────────────────────────────────────────────
function ZoneTooltip({ zone }: { zone: FaceZone }) {
  const color = getZoneColor(zone.severity);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.95 }}
      transition={{ type: "spring", damping: 20, stiffness: 400 }}
      className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none"
    >
      <div
        className="rounded-[16px] px-4 py-3 backdrop-blur-md border"
        style={{
          background: "rgba(255,255,255,0.92)",
          borderColor: color.stroke + "40",
          boxShadow: `0 4px 20px ${color.stroke}20`,
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: color.stroke, boxShadow: `0 0 6px ${color.stroke}` }}
            />
            <span className="text-[12px] font-black text-[#1A1A1A] capitalize">
              {zone.zone.replace("_", " ")}
            </span>
          </div>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: color.stroke + "20", color: color.stroke }}
          >
            {color.label}
          </span>
        </div>
        <p className="text-[11px] text-[#666666] leading-relaxed">{zone.issue}</p>
        {/* Health score bar */}
        <div className="mt-2 h-1 bg-black/[0.06] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: color.stroke }}
            initial={{ width: 0 }}
            animate={{ width: `${zone.score * 10}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-[#BBBBBB]">Zone Health</span>
          <span className="text-[9px] font-bold" style={{ color: color.stroke }}>
            {zone.score}/10
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface FaceZoneOverlayProps {
  imageBase64: string;
  zones: FaceZone[];
  className?: string;
}

export function FaceZoneOverlay({ imageBase64, zones, className = "" }: FaceZoneOverlayProps) {
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  const activeZoneData = zones.find((z) => z.zone === activeZone);

  const handleZoneClick = (zoneName: string) => {
    setActiveZone((prev) => (prev === zoneName ? null : zoneName));
  };

  return (
    <div className={`relative w-full overflow-hidden rounded-[28px] bg-black ${className}`}>
      {/* Face photo */}
      <img
        src={imageBase64}
        onLoad={() => setImgLoaded(true)}
        alt="Your scan"
        className="w-full object-cover"
        style={{ maxHeight: "380px", objectPosition: "center top" }}
      />

      {/* SVG overlay — full coverage, viewBox 100×100 */}
      {imgLoaded && (
        <motion.svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 w-full h-full"
          style={{ mixBlendMode: "normal" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* SVG glow filter */}
          <defs>
            <filter id="glow-soft" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g filter={activeZone ? "url(#glow-strong)" : "url(#glow-soft)"}>
            {zones.map((zone) => (
              <ZoneShape
                key={zone.zone}
                zone={zone}
                isActive={activeZone === zone.zone}
                onClick={() => handleZoneClick(zone.zone)}
              />
            ))}
          </g>
        </motion.svg>
      )}

      {/* Tap to dismiss overlay hint */}
      {imgLoaded && !activeZone && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="absolute top-3 right-3 px-2.5 py-1.5 rounded-full backdrop-blur-md"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <span className="text-[10px] font-semibold text-white/80">Tap zone to explore</span>
        </motion.div>
      )}

      {/* Zone tooltip */}
      <AnimatePresence>
        {activeZone && activeZoneData && (
          <ZoneTooltip zone={activeZoneData} />
        )}
      </AnimatePresence>

      {/* Loading shimmer */}
      {!imgLoaded && (
        <div className="absolute inset-0 bg-black/20 animate-pulse rounded-[28px]" />
      )}
    </div>
  );
}

// ── Zone legend row (for use below the overlay) ───────────────────────────────
export function ZoneLegend({ zones }: { zones: FaceZone[] }) {
  const concernZones = zones.filter((z) => z.severity !== "none");
  if (concernZones.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {concernZones.map((zone) => {
        const color = getZoneColor(zone.severity);
        return (
          <div
            key={zone.zone}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
            style={{ background: color.stroke + "18" }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: color.stroke, boxShadow: `0 0 4px ${color.stroke}` }}
            />
            <span className="text-[11px] font-semibold capitalize" style={{ color: color.stroke }}>
              {zone.zone.replace("_", " ")}
            </span>
          </div>
        );
      })}
    </div>
  );
}
