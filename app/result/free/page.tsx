"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PayButton } from "@/components/PayButton";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  ShoppingBag,
  TrendingUp,
  Sparkles,
  Lock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import type { FreeAnalysisResult } from "@/lib/types";
import { fetchUserState } from "@/lib/user-state";
import { FEATURES } from "@/lib/features";

// ── Amazon product card type ──────────────────────────────────────────────────
interface AmazonCard {
  asin: string;
  title: string;
  brand: string;
  image: string | null;
  price: string | null;
  url?: string;
}

// Static fallback cards (shown before Amazon API loads)
const FALLBACK_PRODUCTS: AmazonCard[] = [
  { asin: "f1", title: "Minimalist Niacinamide 10% Face Serum", brand: "Minimalist", image: null, price: "₹599", url: "https://www.minimalistcare.com/products/niacinamide" },
  { asin: "f2", title: "Mamaearth Skin Illuminate Vitamin C Serum", brand: "Mamaearth", image: null, price: "₹399", url: "https://mamaearth.in/product/skin-illuminate-vitamin-c-serum" },
  { asin: "f3", title: "mCaffeine Naked & Raw Coffee Face Wash", brand: "mCaffeine", image: null, price: "₹249", url: "https://www.mcaffeine.com/products/coffee-face-wash" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function getSkinHealthPct(score: number) {
  return Math.round(score * 10);
}

// ── Circular progress ring ────────────────────────────────────────────────────
function SmallRing({
  value,
  color,
  size = 52,
}: {
  value: number;
  color: string;
  size?: number;
}) {
  const stroke = 4.5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
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
  );
}

// ── Metric tile (4-grid) ───────────────────────────────────────────────────────
function MetricTile({
  label, value, color, trend, delay,
}: {
  label: string; value: number; color: string; trend: "high" | "low" | "ok"; delay: number;
}) {
  const trendLabel = trend === "high" ? "High↑" : trend === "low" ? "Low↓" : "Normal";
  const trendColor = trend === "high" ? "#F87171" : trend === "low" ? "#34D399" : "#A377D2";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ease: "easeOut" }}
      className="bg-white rounded-[20px] p-4 flex flex-col items-center gap-2 shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
    >
      <div className="relative">
        <SmallRing value={value} color={color} size={52} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-black" style={{ color }}>
            {value}%
          </span>
        </div>
      </div>
      <p className="text-[12px] font-semibold text-[#1A1A1A] text-center">{label}</p>
      <span className="text-[10px] font-bold" style={{ color: trendColor }}>{trendLabel}</span>
    </motion.div>
  );
}

// ── PAGE ─────────────────────────────────────────────────────────────────────
export default function FreeResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<FreeAnalysisResult | null>(null);
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [amazonProducts, setAmazonProducts] = useState<AmazonCard[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    fetchUserState(controller.signal)
      .then((state) => {
        const freeScan = state?.freeScan;
        if (!freeScan?.skin_type) {
          toast.error("No Scan Found", { description: "Please take a scan to see your results." });
          router.push("/scan");
          return;
        }

        setResult(freeScan);
        if (freeScan.scan_image) setScanImage(freeScan.scan_image);
      })
      .catch(() => {
        toast.error("Result Unavailable", { description: "The latest free scan could not be loaded." });
        router.push("/scan");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [router]);

  useEffect(() => {
    if (!result || !FEATURES.commerce) {
      setAmazonProducts([]);
      return;
    }

    const query = `${result.skin_type ?? "combination"} skin serum`;

    fetch(`/api/products?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data: AmazonCard[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setAmazonProducts(data.slice(0, 3));
        } else {
          setAmazonProducts(FALLBACK_PRODUCTS);
        }
      })
      .catch(() => setAmazonProducts(FALLBACK_PRODUCTS));
  }, [result]);

  if (loading || !result) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#A377D2] border-t-transparent animate-spin" />
      </div>
    );
  }

  const healthPct  = getSkinHealthPct(result.glow_score ?? 6);
  const skinAge    = result.skin_age_estimate ?? 29;
  // ── Derived metric scores (0–100, from API or sane defaults) ──────────────
  const METRICS = [
    {
      label: "Acne",
      value: result.acne_score ?? Math.round((result.glow_score < 5 ? 50 : 20)),
      color: "#F87171",
      trend: ((result.acne_score ?? 20) >= 40 ? "high" : "ok") as "high" | "low" | "ok",
    },
    {
      label: "Dryness",
      value: result.dryness_score ?? 30,
      color: "#FBBF24",
      trend: ((result.dryness_score ?? 30) >= 50 ? "high" : "ok") as "high" | "low" | "ok",
    },
    {
      label: "Spots",
      value: result.spots_score ?? 25,
      color: "#A377D2",
      trend: ((result.spots_score ?? 25) >= 45 ? "high" : "ok") as "high" | "low" | "ok",
    },
    {
      label: "Moisture",
      value: result.moisture_score ?? 65,
      color: "#34D399",
      trend: ((result.moisture_score ?? 65) >= 50 ? "ok" : "low") as "high" | "low" | "ok",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-32 font-[var(--font-poppins)]">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-14 pb-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex items-center justify-center active:scale-90 transition-transform"
        >
          <ArrowLeft className="w-4 h-4 text-[#1A1A1A]" strokeWidth={2} />
        </button>
        <h1 className="text-[17px] font-black text-[#1A1A1A]">Scan result</h1>
        {/* Model badge */}
        {result._meta?.model_used && (
          <div className="px-2.5 py-1 bg-[#F3EEFB] rounded-full">
            <span className="text-[9px] font-bold text-[#A377D2] uppercase tracking-wider">AI</span>
          </div>
        )}
      </div>

      {/* ── LOCKED FACE ZONE OVERLAY (Hero section) ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="px-5 mb-4"
      >
        <div className="relative overflow-hidden rounded-[28px] shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[linear-gradient(180deg,rgba(21,14,30,0.12)_0%,rgba(21,14,30,0.55)_100%)] backdrop-blur-[2px] shadow-inner">
             <Lock className="w-8 h-8 text-white drop-shadow-md mb-2" />
             <p className="text-[14px] font-black text-white drop-shadow-md tracking-wide">Unlock 5-Zone Mapping</p>
             <p className="text-[10px] font-semibold text-white/90 drop-shadow-md mt-1">Visible in the full report</p>
          </div>
          {scanImage ? (
            <img src={scanImage} alt="Scan" className="w-full aspect-[3/4] object-cover opacity-45 pointer-events-none select-none" />
          ) : (
            <div className="w-full h-64 bg-gradient-to-br from-[#F3EEFB] to-[#EDE0FF] flex items-center justify-center">
               <span className="text-[40px]">✨</span>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-[18px] bg-white px-4 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-[12px] text-[#666666] leading-relaxed">
            Upgrade to see facial zone callouts, ingredient rationale, and a routine designed for Indian weather conditions.
          </p>
        </div>
      </motion.div>

      {/* ── SKIN AGE + HEALTH ROW ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-5 mb-4"
      >
        <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between">
            {/* Skin Age */}
            <div>
              <p className="text-[11px] text-[#9A9A9A] font-medium uppercase tracking-wide">Skin Age</p>
              <p className="text-[40px] font-black text-[#1A1A1A] leading-none mt-0.5">{skinAge}</p>
            </div>
            <div className="w-px h-16 bg-black/[0.06]" />
            {/* Skin Health Bar */}
            <div className="flex-1 ml-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[12px] font-semibold text-[#1A1A1A]">Skin Health</p>
                <span className="text-[13px] font-black text-[#A377D2]">{healthPct}%</span>
              </div>
              <div className="h-2 bg-black/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#A377D2] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${healthPct}%` }}
                  transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {scanImage ? (
                  <img src={scanImage} className="w-5 h-5 rounded-full object-cover ring-1 ring-white" alt="avatar" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#A377D2]/20" />
                )}
                <span className="text-[11px] text-[#9A9A9A] capitalize">{result.skin_type}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── LOCKED 4 METRIC GRID ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="px-5 mb-4 relative"
      >
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/40 backdrop-blur-sm rounded-[24px] mx-5 mt-[1px]">
           <Lock className="w-5 h-5 text-[#A377D2] mb-1" />
           <p className="text-[11px] font-black text-[#A377D2] uppercase tracking-wider">Unlock Clinical Metrics</p>
        </div>
        <div className="grid grid-cols-4 gap-2 opacity-30 pointer-events-none select-none blur-[2px]">
          <MetricTile label="Acne" value={60} color="#F87171" trend="ok" delay={0} />
          <MetricTile label="Dryness" value={45} color="#FBBF24" trend="ok" delay={0} />
          <MetricTile label="Spots" value={30} color="#A377D2" trend="ok" delay={0} />
          <MetricTile label="Moisture" value={80} color="#34D399" trend="ok" delay={0} />
        </div>
      </motion.div>

      {/* ── AI RECOMMENDATION ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="px-5 mb-4"
      >
        <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[10px] bg-[#F3EEFB] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#A377D2]" strokeWidth={1.75} />
              </div>
              <p className="text-[14px] font-black text-[#1A1A1A]">AI Insight</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#BBBBBB]" />
          </div>
          <p className="text-[13px] text-[#666666] leading-relaxed">
            {result.preview_insight ??
              `Based on your ${result.skin_type} skin and current concerns, focus on hydration and sun protection daily.`}
          </p>
          {result.top_concern && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F3EEFB] rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-[#A377D2]" />
              <span className="text-[11px] font-semibold text-[#A377D2] capitalize">
                {result.top_concern}
              </span>
            </div>
          )}
          {/* Primary ingredient teaser (locked) */}
          {result.primary_ingredient && (
            <div className="mt-3 flex items-center justify-between p-3 bg-[#1A1A1A]/[0.03] rounded-[14px]">
              <span className="text-[12px] text-[#9A9A9A]">Key ingredient for your skin</span>
              <div className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-[#A377D2]" />
                <span className="text-[12px] font-black text-[#A377D2]">Unlock</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── SKIN PROGRESS ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.27 }}
        className="px-5 mb-5"
      >
        <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[14px] font-black text-[#1A1A1A]">Your Skin Progress</p>
            <div className="flex items-center gap-1 text-emerald-500">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[13px] font-bold">+20%</span>
            </div>
          </div>
          <p className="text-[11px] text-[#9A9A9A]">
            Last Scan:{" "}
            {new Date(result.timestamp ?? Date.now()).toLocaleDateString("en-IN", {
              day: "numeric", month: "short",
            })}
          </p>
          {/* Mini bar chart */}
          <div className="flex items-end gap-1.5 mt-4 h-14">
            {[-15, -10, -8, 5, 0, 0, 20].map((v, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${Math.abs(v) * 2 + 18}px` }}
                transition={{ delay: 0.3 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className={`flex-1 rounded-t-[6px] ${
                  i === 6 ? "bg-[#A377D2]" : v < 0 ? "bg-red-200" : "bg-[#F3EEFB]"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {["Mo","Tu","We","Th","Fr","Sa","Su"].map((d, i) => (
              <span key={i} className="text-[9px] text-[#BBBBBB] flex-1 text-center">{d}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {FEATURES.commerce ? (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="mb-5"
        >
          <div className="px-5 flex items-center justify-between mb-3">
            <p className="text-[15px] font-black text-[#1A1A1A]">Best solution products</p>
            <Link href="/shop">
              <span className="text-[12px] font-semibold text-[#A377D2]">See all</span>
            </Link>
          </div>
          <div className="flex gap-3 px-5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {(amazonProducts.length > 0 ? amazonProducts : FALLBACK_PRODUCTS).map((p, i) => (
              <motion.div
                key={p.asin}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.34 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="flex-shrink-0 w-36 bg-white rounded-[20px] p-3 shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
              >
                <div className="w-full h-28 bg-[#F3EEFB] rounded-[14px] mb-3 flex items-center justify-center overflow-hidden">
                  {p.image ? (
                    <img src={p.image} alt={p.title} className="w-full h-full object-contain p-2" />
                  ) : (
                    <ShoppingBag className="w-7 h-7 text-[#A377D2]/30" />
                  )}
                </div>
                <p className="text-[10px] text-[#9A9A9A]">{p.brand}</p>
                <p className="text-[13px] font-bold text-[#1A1A1A] leading-tight line-clamp-1">{p.title}</p>
                <p className="text-[13px] font-black text-[#A377D2] mt-1">{p.price ?? "—"}</p>
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1 text-[10px] font-bold text-[#A377D2]"
                  >
                    View <ArrowRight className="w-3 h-3" />
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : null}

      {/* ── UPGRADE TO FULL REPORT ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-5"
      >
        <div className="bg-gradient-to-br from-[#A377D2] to-[#7B4FC2] rounded-[24px] p-5 shadow-[0_6px_24px_rgba(163,119,210,0.35)]">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-white/80" />
            <span className="text-[11px] font-bold text-white/80 uppercase tracking-wide">
              Full Clinical Report
            </span>
          </div>
          <h3 className="text-[18px] font-black text-white leading-tight mb-2">
            Unlock Your Complete<br />Skin Analysis
          </h3>
          <p className="text-[12px] text-white/70 mb-4 leading-relaxed">
            5-zone facial mapping, ingredient-based routine, dermal health index, and 30-day tracking.
          </p>
          <div className="flex flex-wrap gap-2 mb-5">
            {["5-Zone Map", "Ingredient Guide", "Progress Tracking"].map((f) => (
              <span key={f} className="px-2.5 py-1 bg-white/20 rounded-full text-[10px] font-semibold text-white">
                {f}
              </span>
            ))}
          </div>
          <PayButton className="w-full h-13 bg-white text-[#A377D2] font-black text-[14px] rounded-full hover:bg-white/90 active:scale-[0.97] transition-all" />
        </div>
      </motion.div>

    </div>
  );
}
