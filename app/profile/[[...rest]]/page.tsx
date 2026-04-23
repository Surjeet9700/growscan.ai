"use client";

import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  User,
  CheckSquare,
  Lock,
  Bell,
  Shield,
  Globe,
  LogOut,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href?: string;
  action?: () => void;
  danger?: boolean;
}

// ── Menu Row ─────────────────────────────────────────────────────────────────
function MenuRow({
  icon: Icon,
  label,
  href,
  action,
  danger,
  delay,
}: MenuItem & { delay: number }) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ease: "easeOut" }}
      className={`flex items-center justify-between py-4 border-b border-black/[0.04] last:border-none active:bg-black/[0.02] transition-colors ${
        danger ? "text-[#FF4B4B]" : "text-[#1A1A1A]"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-9 h-9 rounded-[12px] flex items-center justify-center ${
            danger ? "bg-red-50" : "bg-[#F5F5F5]"
          }`}
        >
          <Icon
            className="w-4.5 h-4.5"
            strokeWidth={1.75}
            color={danger ? "#FF4B4B" : "#1A1A1A"}
          />
        </div>
        <span className={`text-[14px] font-semibold ${danger ? "text-[#FF4B4B]" : "text-[#1A1A1A]"}`}>
          {label}
        </span>
      </div>
      <ChevronRight
        className={`w-4 h-4 ${danger ? "text-[#FF4B4B]/50" : "text-[#BBBBBB]"}`}
        strokeWidth={2}
      />
    </motion.div>
  );

  if (action) {
    return (
      <button className="w-full text-left" onClick={action}>
        {inner}
      </button>
    );
  }
  return <Link href={href ?? "#"}>{inner}</Link>;
}

// ── PAGE ─────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    // Check premium via dedicated flag (set by StateSync from DB)
    // OR via the presence of a full report in localStorage (legacy/local flow)
    const hasFlag   = localStorage.getItem("glowscan_is_premium") === "true";
    const hasReport = !!localStorage.getItem("glowscan_report");
    if (hasFlag || hasReport) {
      setIsPremium(true);
    }
  }, []);

  const firstName = user?.firstName ?? "Friend";
  const lastName = user?.lastName ?? "";
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";

  const handleSignOut = () => {
    signOut(() => router.push("/"));
  };

  const MENU_ITEMS: (MenuItem & { delay?: number })[] = [
    ...(isPremium ? [{ icon: Sparkles, label: "My Pro Report", href: "/result/full" }] : []),
    { icon: User,        label: "Edit Profile",      href: "/profile/edit" },
    { icon: CheckSquare, label: "Checklist",          href: "/history"      },
    { icon: Lock,        label: "Change Password",    href: "/profile/security" },
    { icon: Bell,        label: "Notification",       href: "/profile/notifications" },
    { icon: Shield,      label: "Security",           href: "/profile/security" },
    { icon: Globe,       label: "Language",           href: "/profile/language" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-36 font-[var(--font-poppins)]">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="px-5 pt-14 pb-6 flex items-center justify-between">
        <h1 className="text-[22px] font-black text-[#1A1A1A]">Profile</h1>
      </div>

      {/* ── AVATAR + NAME ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: [0.16, 1, 0.3, 1] }}
        className="px-5 mb-8 flex flex-col items-center"
      >
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-[#F3EEFB] ring-4 ring-white shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#B68BE0] to-[#A377D2]">
                <span className="text-white font-black text-3xl">
                  {firstName[0]}
                </span>
              </div>
            )}
          </div>
          {/* Edit badge */}
          <Link href="/profile/edit">
            <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#A377D2] flex items-center justify-center shadow-sm">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z"
                  stroke="white"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <h2 className="text-[20px] font-black text-[#1A1A1A]">
            {firstName} {lastName}
          </h2>
          {isPremium && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-[#A377D2] to-[#7B4FC2] rounded-full shadow-sm">
              <Sparkles className="w-3 h-3 text-white" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Pro</span>
            </div>
          )}
        </div>
        {email && (
          <p className="text-[13px] text-[#9A9A9A] mt-0.5">{email}</p>
        )}
      </motion.div>

      {/* ── MENU LIST ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="px-5 mb-4"
      >
        <div className="bg-white rounded-[24px] px-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          {MENU_ITEMS.map((item, i) => (
            <MenuRow key={i} {...item} delay={0.05 + i * 0.04} />
          ))}
        </div>
      </motion.div>

      {/* ── LOGOUT ───────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="px-5"
      >
        <div className="bg-white rounded-[24px] px-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <MenuRow
            icon={LogOut}
            label="Logout"
            action={handleSignOut}
            danger
            delay={0.38}
          />
        </div>
      </motion.div>

    </div>
  );
}
