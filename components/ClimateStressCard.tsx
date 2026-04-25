"use client";

import { CloudSun, MapPin, RefreshCw, ShieldCheck } from "lucide-react";
import type { ClimateContext } from "@/lib/climate";

function levelClasses(level: ClimateContext["level"]) {
  switch (level) {
    case "low":
      return "bg-emerald-500/15 text-emerald-100 border border-emerald-300/20";
    case "moderate":
      return "bg-amber-400/15 text-amber-50 border border-amber-200/20";
    case "high":
      return "bg-orange-400/15 text-orange-50 border border-orange-200/20";
    case "extreme":
      return "bg-rose-400/15 text-rose-50 border border-rose-200/20";
    default:
      return "bg-white/10 text-white/80 border border-white/10";
  }
}

function metricValue(value: number | null, suffix = "") {
  if (value === null || Number.isNaN(value)) return "—";
  return `${value}${suffix}`;
}

export function ClimateStressCard({
  climate,
  title = "Skin Stress Today",
  subtitle = "Live local conditions",
  loading = false,
  error = null,
  onRetry,
  className = "",
}: {
  climate: ClimateContext | null;
  title?: string;
  subtitle?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}) {
  if (loading) {
    return (
      <div className={`rounded-[28px] bg-[linear-gradient(145deg,#1B1722_0%,#2C233A_42%,#A377D2_100%)] p-5 text-white shadow-[0_18px_50px_rgba(72,41,109,0.2)] ${className}`}>
        <div className="animate-pulse">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="h-3 w-28 rounded-full bg-white/20" />
              <div className="mt-2 h-5 w-36 rounded-full bg-white/15" />
            </div>
            <div className="h-9 w-16 rounded-full bg-white/15" />
          </div>
          <div className="mb-4 h-12 w-24 rounded-[20px] bg-white/15" />
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-16 rounded-[18px] bg-white/10" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!climate) {
    return (
      <div className={`rounded-[24px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] ${className}`}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F3EEFB]">
            <MapPin className="h-4 w-4 text-[#A377D2]" />
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-black text-[#1A1A1A]">{title}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#6C6678]">
              {error || "Enable location to read UV, humidity, heat, and pollution against your skin routine."}
            </p>
          </div>
        </div>
        {onRetry ? (
          <button
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#F3EEFB] px-4 py-2 text-[12px] font-bold text-[#A377D2] active:scale-[0.98] transition-transform"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`rounded-[28px] bg-[linear-gradient(145deg,#1B1722_0%,#2C233A_42%,#A377D2_100%)] p-5 text-white shadow-[0_18px_50px_rgba(72,41,109,0.2)] ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/65">
            <CloudSun className="h-3.5 w-3.5" />
            {subtitle}
          </div>
          <p className="mt-2 text-[18px] font-black leading-tight text-white">{title}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${levelClasses(climate.level)}`}>
          {climate.level}
        </span>
      </div>

      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[36px] font-black leading-none text-white">{climate.score}</p>
          <p className="mt-1 text-[11px] text-white/65">out of 100 skin-stress load</p>
        </div>
        <div className="max-w-[190px] rounded-[18px] bg-white/10 px-4 py-3 text-[12px] font-medium leading-relaxed text-white/85 backdrop-blur-sm">
          {climate.summary}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-[18px] bg-white/10 p-3">
          <p className="text-[10px] text-white/55">UV</p>
          <p className="mt-1 text-[15px] font-black">{metricValue(climate.signals.uv_index)}</p>
        </div>
        <div className="rounded-[18px] bg-white/10 p-3">
          <p className="text-[10px] text-white/55">Humidity</p>
          <p className="mt-1 text-[15px] font-black">{metricValue(climate.signals.humidity, "%")}</p>
        </div>
        <div className="rounded-[18px] bg-white/10 p-3">
          <p className="text-[10px] text-white/55">PM2.5</p>
          <p className="mt-1 text-[15px] font-black">{metricValue(climate.signals.pm25)}</p>
        </div>
        <div className="rounded-[18px] bg-white/10 p-3">
          <p className="text-[10px] text-white/55">Temp</p>
          <p className="mt-1 text-[15px] font-black">{metricValue(climate.signals.temperature_c, "°")}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {climate.drivers.map((driver) => (
          <span key={driver} className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/80">
            {driver}
          </span>
        ))}
      </div>

      <div className="mt-4 rounded-[20px] bg-white/8 p-4 backdrop-blur-sm">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
          <ShieldCheck className="h-3.5 w-3.5" />
          What to do today
        </div>
        <div className="space-y-2">
          {climate.actions.slice(0, 2).map((action) => (
            <p key={action} className="text-[12px] leading-relaxed text-white/88">
              {action}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
