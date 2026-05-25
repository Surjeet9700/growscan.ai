"use client";

import { motion } from "framer-motion";
import { PALM_LINE_COLORS, PALM_LINE_LABELS, type PalmLine, type PalmCoordinate } from "@/lib/palm-types";

interface PalmLineOverlayProps {
  lines: {
    heart_line: PalmLine;
    head_line: PalmLine;
    life_line: PalmLine;
    fate_line: PalmLine;
  };
  activeLine?: string | null;
  onLineClick?: (lineName: string) => void;
}

function coordsToPath(coords: PalmCoordinate[]): string {
  if (coords.length < 2) return "";

  const points = coords.map((c) => ({ x: c.x, y: c.y }));

  let d = `M ${points[0].x} ${points[0].y}`;

  if (points.length === 2) {
    d += ` L ${points[1].x} ${points[1].y}`;
  } else {
    for (let i = 1; i < points.length - 1; i++) {
      const cp1x = points[i].x;
      const cp1y = points[i].y;
      const cp2x = (points[i].x + points[i + 1].x) / 2;
      const cp2y = (points[i].y + points[i + 1].y) / 2;
      d += ` Q ${cp1x} ${cp1y} ${cp2x} ${cp2y}`;
    }
    const last = points[points.length - 1];
    d += ` L ${last.x} ${last.y}`;
  }

  return d;
}

function LinePath({
  lineName,
  line,
  isActive,
  onClick,
}: {
  lineName: string;
  line: PalmLine;
  isActive: boolean;
  onClick?: () => void;
}) {
  const color = PALM_LINE_COLORS[lineName as keyof typeof PALM_LINE_COLORS] || "#A377D2";
  const label = PALM_LINE_LABELS[lineName as keyof typeof PALM_LINE_LABELS] || lineName;
  const pathD = coordsToPath(line.coordinates);

  if (!pathD) return null;

  const firstCoord = line.coordinates[0];
  const lastCoord = line.coordinates[line.coordinates.length - 1];

  return (
    <g onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      {/* Glow effect */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={isActive ? 6 : 3}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.3}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1, opacity: isActive ? 0.5 : 0.2 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        filter="blur(4px)"
      />

      {/* Main line */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={isActive ? 3 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      {/* Start dot */}
      <motion.circle
        cx={firstCoord.x}
        cy={firstCoord.y}
        r={isActive ? 4 : 3}
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
      />

      {/* End dot */}
      <motion.circle
        cx={lastCoord.x}
        cy={lastCoord.y}
        r={isActive ? 4 : 3}
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.2, type: "spring" }}
      />

      {/* Label at midpoint */}
      {isActive && line.coordinates.length >= 2 && (
        <motion.g
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <rect
            x={(firstCoord.x + lastCoord.x) / 2 - 30}
            y={(firstCoord.y + lastCoord.y) / 2 - 20}
            width="60"
            height="18"
            rx="9"
            fill={color}
            opacity={0.9}
          />
          <text
            x={(firstCoord.x + lastCoord.x) / 2}
            y={(firstCoord.y + lastCoord.y) / 2 - 9}
            textAnchor="middle"
            fill="white"
            fontSize="7"
            fontWeight="bold"
            fontFamily="var(--font-poppins)"
          >
            {label}
          </text>
        </motion.g>
      )}
    </g>
  );
}

export function PalmLineOverlay({ lines, activeLine, onLineClick }: PalmLineOverlayProps) {
  const lineEntries = Object.entries(lines) as [string, PalmLine][];

  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: "auto" }}
    >
      {lineEntries.map(([name, line]) => (
        <LinePath
          key={name}
          lineName={name}
          line={line}
          isActive={activeLine === name}
          onClick={() => onLineClick?.(name)}
        />
      ))}
    </svg>
  );
}
