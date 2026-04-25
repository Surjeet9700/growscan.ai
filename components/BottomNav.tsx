"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { FEATURES } from "@/lib/features";

// ── SVG icons matching the Behance design ────────────────────────────────────
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V10.5Z"
      fill={active ? "#A377D2" : "none"}
      stroke={active ? "#A377D2" : "#BBBBBB"}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ShopIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M6 2L3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6L18 2H6Z"
      stroke={active ? "#A377D2" : "#BBBBBB"}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 6H21"
      stroke={active ? "#A377D2" : "#BBBBBB"}
      strokeWidth="1.75"
      strokeLinecap="round"
    />
    <path
      d="M16 10C16 12.2091 14.2091 14 12 14C9.79086 14 8 12.2091 8 10"
      stroke={active ? "#A377D2" : "#BBBBBB"}
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </svg>
);

const ScanIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="7" height="7" rx="1.5"
      stroke="white" strokeWidth="1.75" />
    <rect x="15" y="2" width="7" height="7" rx="1.5"
      stroke="white" strokeWidth="1.75" />
    <rect x="2" y="15" width="7" height="7" rx="1.5"
      stroke="white" strokeWidth="1.75" />
    <path d="M15 15.5H18.5M18.5 15.5H22M18.5 15.5V12M18.5 15.5V19"
      stroke="white" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

const HistoryIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle
      cx="12" cy="12" r="9"
      stroke={active ? "#A377D2" : "#BBBBBB"}
      strokeWidth="1.75"
    />
    <path
      d="M12 7V12L15 14"
      stroke={active ? "#A377D2" : "#BBBBBB"}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle
      cx="12" cy="8" r="4"
      stroke={active ? "#A377D2" : "#BBBBBB"}
      strokeWidth="1.75"
    />
    <path
      d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20"
      stroke={active ? "#A377D2" : "#BBBBBB"}
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </svg>
);

const BASE_NAV_ITEMS: Array<{
  href: string;
  label: string;
  Icon: ({ active }: { active: boolean }) => React.ReactElement;
  isScan?: boolean;
}> = [
  { href: "/",        label: "Home",    Icon: HomeIcon    },
  { href: "/shop",    label: "Shop",    Icon: ShopIcon    },
  { href: "/scan",    label: "Scan",    Icon: ScanIcon,   isScan: true },
  { href: "/history", label: "History", Icon: HistoryIcon },
  { href: "/profile", label: "Profile", Icon: ProfileIcon },
];

const HIDDEN_ROUTES = ["/result/free", "/result/full", "/sign-in", "/sign-up"];

export function BottomNav() {
  const pathname = usePathname();
  const isHidden = HIDDEN_ROUTES.some((r) => pathname.startsWith(r));
  if (isHidden) return null;

  const navItems = BASE_NAV_ITEMS.filter((item) =>
    FEATURES.commerce ? true : item.href !== "/shop"
  );

  return (
    <AnimatePresence>
      <motion.nav
        aria-label="Main navigation"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[480px]"
      >
        {/* iOS-style tab bar */}
        <div
          className="mx-4 mb-4 flex items-center justify-around bg-white/90 backdrop-blur-xl rounded-[28px] px-2 py-3 shadow-[0_-1px_0_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.10)]"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          {navItems.map(({ href, label, Icon, isScan }) => {
            const active =
              pathname === href ||
              (href !== "/" && href !== "/shop" && pathname.startsWith(href));

            if (isScan) {
              return (
                <Link
                  key={href}
                  href={href}
                  aria-label="Scan"
                  className="flex flex-col items-center gap-1 -mt-6"
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      "w-14 h-14 rounded-[18px] flex items-center justify-center shadow-[0_4px_16px_rgba(163,119,210,0.4)]",
                      active
                        ? "bg-[#8B5FC7]"
                        : "bg-gradient-to-b from-[#B68BE0] to-[#A377D2]"
                    )}
                  >
                    <Icon active={true} />
                  </motion.div>
                  <span className="text-[9px] font-bold text-[#A377D2]">{label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center gap-1 w-14 transition-all duration-200"
              >
                <motion.div whileTap={{ scale: 0.85 }}>
                  <Icon active={active} />
                </motion.div>
                <span
                  className={cn(
                    "text-[9px] font-bold transition-colors duration-200",
                    active ? "text-[#A377D2]" : "text-[#BBBBBB]"
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </motion.nav>
    </AnimatePresence>
  );
}
