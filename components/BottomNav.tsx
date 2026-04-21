"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, Clock, Home, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/scan", icon: Camera, label: "Scan" },
  { href: "/history", icon: Clock, label: "History" },
  { href: "/profile", icon: User, label: "Profile" },
] as const;

// Pages where the nav should NOT appear (detail views, Apple HIG: hidesBottomBarWhenPushed)
const HIDDEN_ROUTES = ["/result/free", "/result/full", "/sign-in", "/sign-up"];

export function BottomNav() {
  const pathname = usePathname();

  // Hide on detail/auth pages
  const isHidden = HIDDEN_ROUTES.some((r) => pathname.startsWith(r));

  if (isHidden) return null;

  return (
    <AnimatePresence>
      <motion.nav
        aria-label="Main navigation"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 pt-4 px-4 pointer-events-none"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        {/* Liquid Glass dock */}
        <div className="flex items-center gap-1 bg-white/80 backdrop-blur-2xl backdrop-saturate-150 rounded-[32px] px-2 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/50 pointer-events-auto max-w-xs w-full justify-around supports-[backdrop-filter]:bg-white/60">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-col items-center justify-center w-16 h-[52px] rounded-full transition-all duration-300"
              >
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-[#A377D2] rounded-full shadow-[0_4px_12px_rgba(163,119,210,0.3)]"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}

                <div className="relative z-10 flex flex-col items-center gap-0.5">
                  <Icon
                    className={cn(
                      "w-[22px] h-[22px] transition-all duration-300",
                      active ? "text-white" : "text-black/40"
                    )}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                  <span
                    className={cn(
                      "text-[9px] font-bold tracking-tight transition-all duration-300",
                      active ? "text-white/90" : "text-black/40"
                    )}
                  >
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.nav>
    </AnimatePresence>
  );
}
