"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Bookmark, ChevronRight, ShoppingBag, Heart } from "lucide-react";

interface LastScan {
  glow_score: number;
  skin_type: string;
  top_concern: string;
  timestamp: number;
}

// ── Circular progress ring ────────────────────────────────────────────────────
function ProgressRing({
  pct,
  size = 56,
  stroke = 5,
  color = "#A377D2",
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
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

// ── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({
  name,
  brand,
  price,
  delay,
}: {
  name: string;
  brand: string;
  price: string;
  delay: number;
}) {
  const [liked, setLiked] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex-shrink-0 w-36 bg-white rounded-[20px] p-3 shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
    >
      {/* Product Image Placeholder */}
      <div className="w-full h-28 bg-[#F3EEFB] rounded-[14px] mb-3 relative overflow-hidden flex items-center justify-center">
        <ShoppingBag className="w-8 h-8 text-[#A377D2]/30" />
        <button
          onClick={() => setLiked(!liked)}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm"
        >
          <Heart
            className="w-3.5 h-3.5"
            fill={liked ? "#A377D2" : "none"}
            stroke={liked ? "#A377D2" : "#BBBBBB"}
          />
        </button>
      </div>
      <p className="text-[11px] text-[#9A9A9A] font-medium leading-none mb-0.5">{brand}</p>
      <p className="text-[13px] font-bold text-[#1A1A1A] leading-tight line-clamp-1">{name}</p>
      <p className="text-[13px] font-black text-[#A377D2] mt-1.5">{price}</p>
    </motion.div>
  );
}

// ── Watchlist Item ────────────────────────────────────────────────────────────
function WatchlistItem({
  title,
  subtitle,
  pct,
  delay,
}: {
  title: string;
  subtitle: string;
  pct: number;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ease: "easeOut" }}
      className="flex items-center gap-4 py-3.5 border-b border-black/[0.04] last:border-none"
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 bg-[#F3EEFB] rounded-[14px] flex items-center justify-center shrink-0">
        <Heart className="w-5 h-5 text-[#A377D2]/60" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[#1A1A1A] leading-tight">{title}</p>
        <p className="text-[11px] text-[#9A9A9A] mt-0.5">{subtitle}</p>
        {/* Mini progress */}
        <div className="mt-2 h-1 bg-black/[0.06] rounded-full overflow-hidden w-24">
          <motion.div
            className="h-full bg-[#A377D2] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ delay: delay + 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>
      <div className="w-7 h-7 rounded-full bg-[#F3EEFB] flex items-center justify-center shrink-0">
        <ChevronRight className="w-4 h-4 text-[#A377D2]" />
      </div>
    </motion.div>
  );
}

// ── PAGE ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user } = useUser();
  const [lastScan, setLastScan] = useState<LastScan | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("glowscan_free");
    if (raw) {
      try { setLastScan(JSON.parse(raw)); } catch {}
    }
  }, []);

  const firstName = user?.firstName ?? "Friend";
  const today = new Date().toLocaleDateString("en-US", {
    day: "numeric", month: "long",
  });

  const routinePct = lastScan ? 40 : 0;
  const scanAgo = lastScan
    ? (() => {
        const d = Math.floor((Date.now() - lastScan.timestamp) / 86_400_000);
        return d === 0 ? "Today" : `${d} day${d > 1 ? "s" : ""} ago`;
      })()
    : "No analysis yet";

  const PRODUCTS = [
    { name: "Tarte Serum",   brand: "Tarte",  price: "₹2,400" },
    { name: "Anua Serum",    brand: "Anua",   price: "₹1,280" },
    { name: "Skin Moisturizer", brand: "Klairs", price: "₹1,800" },
    { name: "SPF 50+ Serum", brand: "Round Lab", price: "₹950" },
  ];

  const WATCHLIST = [
    { title: "Morning Routine",   subtitle: "Cleanser → Toner → Serum → SPF", pct: 60 },
    { title: "Evening Routine",   subtitle: "Oil cleanse → Retinol → Moisturizer", pct: 35 },
    { title: "Weekly Treatment",  subtitle: "Exfoliate → Sheet Mask → Gua Sha", pct: 20 },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-36 font-[var(--font-poppins)]">

      {/* ── TOP HEADER ──────────────────────────────────────────────────── */}
      <div className="px-5 pt-14 pb-3 flex items-center justify-between">
        {/* Avatar + Greeting */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full overflow-hidden bg-[#F3EEFB] ring-2 ring-white shadow-sm shrink-0">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#A377D2] text-white font-bold text-sm">
                {firstName[0]}
              </div>
            )}
          </div>
          <div>
            <p className="text-[11px] text-[#9A9A9A] font-medium">Hi, {firstName} 👋</p>
            <p className="text-[13px] font-semibold text-[#1A1A1A] leading-tight">
              {today}
            </p>
          </div>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <Bookmark className="w-4.5 h-4.5 text-[#1A1A1A]" strokeWidth={1.75} />
          </button>
          <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <Bell className="w-4.5 h-4.5 text-[#1A1A1A]" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* ── TAGLINE ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="px-5 mt-1 mb-5"
      >
        <p className="text-[22px] font-black text-[#1A1A1A] leading-[1.2] tracking-tight">
          AI Beauty always<br />
          <span className="text-[#A377D2]">here for your skin</span>
        </p>
      </motion.div>

      {/* ── DAILY ROUTINE + SCAN RESULT CARD ROW ─────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-5 grid grid-cols-2 gap-3 mb-5"
      >
        {/* Daily Routine Card */}
        <div className="bg-white rounded-[24px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <p className="text-[10px] text-[#9A9A9A] font-medium uppercase tracking-wide mb-0.5">
            {today}
          </p>
          <p className="text-[14px] font-black text-[#1A1A1A] leading-tight mb-1">
            Daily Routine
          </p>
          <p className="text-[10px] text-[#9A9A9A]">
            Last analysis {scanAgo}
          </p>
          {/* Circle progress */}
          <div className="flex items-center justify-between mt-3">
            <p className="text-[11px] text-[#9A9A9A] font-medium">Progress</p>
            <div className="relative">
              <ProgressRing pct={routinePct} size={48} stroke={4.5} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-black text-[#A377D2]">
                  {routinePct}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scan Result Shortcut */}
        <Link href={lastScan ? "/result/free" : "/scan"}>
          <div className="bg-white rounded-[24px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] h-full flex flex-col justify-between active:scale-[0.97] transition-transform">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-black text-[#1A1A1A]">
                {lastScan ? "Scan result" : "Start scan"}
              </p>
              <div className="w-7 h-7 rounded-full bg-[#F3EEFB] flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-[#A377D2]" />
              </div>
            </div>
            {lastScan ? (
              <>
                <div className="mt-3">
                  <p className="text-[11px] text-[#9A9A9A]">Skin Health</p>
                  <div className="mt-1.5 h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#A377D2] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${lastScan.glow_score * 10}%` }}
                      transition={{ delay: 0.4, duration: 0.8, ease: [0.16,1,0.3,1] }}
                    />
                  </div>
                  <p className="text-[20px] font-black text-[#1A1A1A] mt-2">
                    {lastScan.glow_score * 10}
                    <span className="text-[12px] text-[#9A9A9A] font-medium">%</span>
                  </p>
                </div>
                <div className="mt-2">
                  <span className="tag-purple capitalize">{lastScan.skin_type}</span>
                </div>
              </>
            ) : (
              <div className="mt-4 flex flex-col items-center justify-center flex-1 gap-2">
                <div className="w-12 h-12 rounded-full bg-[#F3EEFB] flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#A377D2" strokeWidth="1.5" />
                    <path d="M12 8v4l3 2" stroke="#A377D2" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-[11px] text-[#9A9A9A] text-center">Scan to see your skin health</p>
              </div>
            )}
          </div>
        </Link>
      </motion.div>

      {/* ── BEST SOLUTION PRODUCTS ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-5"
      >
        <div className="px-5 flex items-center justify-between mb-3">
          <p className="text-[16px] font-black text-[#1A1A1A]">Best solution product</p>
          <Link href="/shop">
            <span className="text-[12px] font-semibold text-[#A377D2]">See all</span>
          </Link>
        </div>
        {/* Horizontal scroll */}
        <div className="flex gap-3 px-5 overflow-x-auto pb-1 scrollbar-none"
          style={{ scrollbarWidth: "none" }}>
          {PRODUCTS.map((p, i) => (
            <ProductCard key={i} {...p} delay={0.18 + i * 0.06} />
          ))}
        </div>
      </motion.div>

      {/* ── TODAY'S SELF-CARE WATCHLIST ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="px-5 mb-5"
      >
        <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[16px] font-black text-[#1A1A1A]">
              Today's Self-Care Watchlist
            </p>
            <Link href="/history">
              <span className="text-[12px] font-semibold text-[#A377D2]">See all</span>
            </Link>
          </div>

          <div>
            {WATCHLIST.map((item, i) => (
              <WatchlistItem key={i} {...item} delay={0.28 + i * 0.07} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── PRICING SECTION ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-5 mb-5"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[16px] font-black text-[#1A1A1A]">Upgrade to Pro</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Monthly Subscription */}
          <div className="bg-gradient-to-br from-[#A377D2] to-[#7B4FC2] rounded-[24px] p-5 shadow-[0_4px_20px_rgba(163,119,210,0.3)]">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-bold text-white">GlowScan Pro</p>
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-bold text-white tracking-wide">BEST VALUE</span>
            </div>
            <div className="flex items-end gap-1 mt-1 mb-3">
              <span className="text-[32px] font-black text-white leading-none">₹299</span>
              <span className="text-[12px] text-white/80 font-medium pb-1">/ month</span>
            </div>
            <ul className="space-y-2.5 mb-5">
              <li className="flex items-center gap-2 text-[13px] font-medium text-white/95">
                <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
                Unlimited full clinical scans
              </li>
              <li className="flex items-center gap-2 text-[13px] font-medium text-white/95">
                <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
                30-day progress tracking
              </li>
              <li className="flex items-center gap-2 text-[13px] font-medium text-white/95">
                <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
                Personalized product matching
              </li>
            </ul>
            <button className="w-full py-3.5 rounded-full bg-white text-[#A377D2] font-black text-[14px] shadow-sm active:scale-[0.98] transition-transform">
              Subscribe Now
            </button>
          </div>

          {/* Pay Per Report */}
          <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-black/[0.04]">
            <p className="text-[14px] font-bold text-[#1A1A1A]">Single Scan</p>
            <div className="flex items-end gap-1 mt-1 mb-3">
              <span className="text-[28px] font-black text-[#1A1A1A] leading-none">₹29</span>
              <span className="text-[12px] text-[#9A9A9A] font-medium pb-1">/ report</span>
            </div>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center gap-2 text-[12px] text-[#666]">
                <div className="w-3.5 h-3.5 rounded-full bg-[#F3EEFB] flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 bg-[#A377D2] rounded-full" />
                </div>
                Full clinical breakdown
              </li>
              <li className="flex items-center gap-2 text-[12px] text-[#666]">
                <div className="w-3.5 h-3.5 rounded-full bg-[#F3EEFB] flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 bg-[#A377D2] rounded-full" />
                </div>
                5-Zone face mapping
              </li>
            </ul>
            <Link href="/scan">
              <button className="w-full py-3 rounded-full bg-[#F3EEFB] text-[#A377D2] font-black text-[13px] active:scale-[0.98] transition-transform">
                Get Single Report
              </button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── CTA Banner (if no scan yet) ─────────────────────────────── */}
      {!lastScan && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="px-5 mt-5"
        >
          <Link href="/scan">
            <div className="bg-gradient-to-r from-[#A377D2] to-[#8B5FC7] rounded-[24px] p-5 flex items-center justify-between shadow-[0_4px_20px_rgba(163,119,210,0.3)] active:scale-[0.97] transition-transform">
              <div>
                <p className="text-white font-black text-[17px] leading-tight">
                  Scan Your Skin
                </p>
                <p className="text-white/80 text-[12px] mt-1">
                  Get your personalized skin report in 30s
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.75" />
                  <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </Link>
        </motion.div>
      )}

    </div>
  );
}
