"use client";

import { motion } from "framer-motion";
import { TrendingUp, Target, Calendar } from "lucide-react";

interface WeekData {
  week: number;
  predictedScore: number;
  milestone: string;
}

interface SkinRoadmapProps {
  currentScore: number;
  targetScore?: number;
  weeks?: number;
}

function generateRoadmap(currentScore: number, targetScore: number, weeks: number): WeekData[] {
  const data: WeekData[] = [];
  const scoreDiff = targetScore - currentScore;

  const milestones = [
    "Baseline established",
    "Barrier repair begins",
    "Hydration improving",
    "Texture smoothing",
    "Pigmentation fading",
    "Visible clarity",
    "Radiance boost",
    "Consistency pays off",
    "Skin balancing",
    "Near optimal",
    "Peak condition",
    "Goal achieved",
  ];

  for (let i = 0; i < weeks; i++) {
    const progress = (i + 1) / weeks;
    const easedProgress = 1 - Math.pow(1 - progress, 2);
    const score = Math.round(currentScore + scoreDiff * easedProgress);

    data.push({
      week: i + 1,
      predictedScore: Math.min(score, 100),
      milestone: milestones[Math.min(i, milestones.length - 1)],
    });
  }

  return data;
}

export function SkinRoadmap({ currentScore, targetScore, weeks = 12 }: SkinRoadmapProps) {
  const computedTarget = targetScore ?? Math.min(currentScore + 12, 95);
  const roadmap = generateRoadmap(currentScore, computedTarget, weeks);

  return (
    <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[10px] bg-[#F3EEFB] flex items-center justify-center">
            <Target className="w-4 h-4 text-[#A377D2]" />
          </div>
          <p className="text-[14px] font-black text-[#1A1A1A]">{weeks}-Week Roadmap</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-bold text-[#9A9A9A]">{currentScore}</span>
          <TrendingUp className="w-3.5 h-3.5 text-[#A377D2]" />
          <span className="text-[12px] font-black text-[#A377D2]">{computedTarget}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-32 mb-4">
        <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={100 - y}
              x2="300"
              y2={100 - y}
              stroke="rgba(0,0,0,0.04)"
              strokeWidth="0.5"
            />
          ))}

          {/* Prediction curve */}
          <motion.path
            d={`M ${roadmap
              .map(
                (d, i) =>
                  `${(i / (roadmap.length - 1)) * 300},${100 - d.predictedScore}`
              )
              .join(" L ")}`}
            fill="none"
            stroke="#A377D2"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />

          {/* Area under curve */}
          <motion.path
            d={`M 0,100 L ${roadmap
              .map(
                (d, i) =>
                  `${(i / (roadmap.length - 1)) * 300},${100 - d.predictedScore}`
              )
              .join(" L ")} L 300,100 Z`}
            fill="url(#roadmapGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          />

          <defs>
            <linearGradient id="roadmapGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A377D2" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#A377D2" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Current marker */}
        <div
          className="absolute w-3 h-3 rounded-full bg-[#A377D2] border-2 border-white shadow-sm"
          style={{
            left: "0%",
            bottom: `${currentScore}%`,
            transform: "translate(-50%, 50%)",
          }}
        />

        {/* Target marker */}
        <div
          className="absolute w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow-sm"
          style={{
            left: "100%",
            bottom: `${computedTarget}%`,
            transform: "translate(-50%, 50%)",
          }}
        />
      </div>

      {/* Milestones */}
      <div className="flex items-center justify-between">
        {[roadmap[0], roadmap[Math.floor(weeks / 4)], roadmap[Math.floor(weeks / 2)], roadmap[weeks - 1]].map(
          (d, i) => (
            <div key={i} className="text-center flex-1">
              <p className="text-[10px] font-bold text-[#A377D2]">W{d.week}</p>
              <p className="text-[9px] text-[#9A9A9A] mt-0.5 leading-tight">{d.milestone}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
