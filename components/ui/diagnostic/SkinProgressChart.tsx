"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, X, Check } from "lucide-react";

interface ProgressData {
  label: string;
  delta: number;
  color: string;
  bgColor: string;
}

const SAMPLE_PROGRESS: ProgressData[] = [
  { label: "Dryness",  delta: -15, color: "#E8956D", bgColor: "#FDEEE7" },
  { label: "Spots",    delta: -10, color: "#FBBF24", bgColor: "#FFFBEB" },
  { label: "Acne",     delta: -8,  color: "#A377D2", bgColor: "#F6F1FB" },
  { label: "Moisture", delta: 5,   color: "#0EA5E9", bgColor: "#F0F9FF" },
];

// ── Generate Google Calendar URL ─────────────────────────────────────────────
function googleCalUrl(date: Date, weeks: number): string {
  const start = date.toISOString().replace(/[-:]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const end   = new Date(date.getTime() + 30 * 60 * 1000)
    .toISOString().replace(/[-:]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const text  = encodeURIComponent("GlowScan — Skin Re-Check");
  const details = encodeURIComponent(
    `Time for your ${weeks}-week GlowScan skin check-in! Open the app and scan your face again.`
  );
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}`;
}

// ── Generate Apple Calendar URL ──────────────────────────────────────────────
function appleCalUrl(date: Date, weeks: number): string {
  const start = date.toISOString().replace(/[-:]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const end   = new Date(date.getTime() + 30 * 60 * 1000)
    .toISOString().replace(/[-:]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const text  = encodeURIComponent("GlowScan — Skin Re-Check");
  const details = encodeURIComponent(
    `Time for your ${weeks}-week GlowScan skin check-in!`
  );
  return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${text}&body=${details}&startdt=${date.toISOString()}&enddt=${new Date(date.getTime() + 30 * 60 * 1000).toISOString()}`;
}

// ── Generate WhatsApp reminder message ───────────────────────────────────────
function whatsappUrl(date: Date): string {
  const dateStr = date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const msg = encodeURIComponent(
    `🌟 GlowScan Reminder: I need to do my skin re-scan on ${dateStr}! Open GlowScan and check my progress.`
  );
  return `https://wa.me/?text=${msg}`;
}

// ── Calendar Modal ─────────────────────────────────────────────────────────────
function ReminderModal({
  onClose,
  recheckWeeks = 4,
}: {
  onClose: () => void;
  recheckWeeks?: number;
}) {
  const [selected, setSelected] = useState<number>(recheckWeeks); // weeks from now
  const [confirmed, setConfirmed] = useState(false);

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + selected * 7);
  targetDate.setHours(9, 0, 0, 0); // 9 AM

  const WEEK_OPTIONS = [2, 4, 6, 8];

  const handleConfirm = () => setConfirmed(true);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="w-full max-w-[480px] bg-white rounded-t-[32px] p-6 pb-10"
        style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.12)" }}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-black/10 rounded-full mx-auto mb-6" />

        {!confirmed ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[17px] font-black text-[#1A1A1A]">Set Skin Reminder</h3>
                <p className="text-[12px] text-[#9A9A9A] mt-0.5">Remind yourself to re-scan</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#F5F5F5] flex items-center justify-center active:scale-90 transition-transform"
              >
                <X className="w-4 h-4 text-[#666]" />
              </button>
            </div>

            {/* Week selector chips */}
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#BBBBBB] mb-3">
              Remind me in
            </p>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {WEEK_OPTIONS.map((w) => (
                <button
                  key={w}
                  onClick={() => setSelected(w)}
                  className={`py-3 rounded-[14px] text-[13px] font-bold transition-all active:scale-95 ${
                    selected === w
                      ? "bg-[#A377D2] text-white shadow-[0_4px_12px_rgba(163,119,210,0.35)]"
                      : "bg-[#F5F5F5] text-[#666]"
                  }`}
                >
                  {w}w
                </button>
              ))}
            </div>

            {/* Target date display */}
            <div className="bg-[#F9F6FD] rounded-[16px] p-4 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-[#A377D2]/10 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-[#A377D2]" />
              </div>
              <div>
                <p className="text-[11px] text-[#9A9A9A]">Reminding you on</p>
                <p className="text-[14px] font-black text-[#1A1A1A]">
                  {targetDate.toLocaleDateString("en-IN", {
                    weekday: "long", day: "numeric", month: "long",
                  })}
                </p>
              </div>
            </div>

            {/* Confirm */}
            <button
              onClick={handleConfirm}
              className="w-full h-13 bg-[#1A1A1A] text-white rounded-full font-black text-[14px] flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
            >
              <CalendarDays className="w-4 h-4 shrink-0" />
              <span>Set Reminder</span>
            </button>
          </>
        ) : (
          /* After confirmation — show calendar options */
          <div className="flex flex-col gap-4">
            {/* Success header */}
            <div className="text-center mb-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 20, stiffness: 400 }}
                className="w-14 h-14 rounded-full bg-[#F0FDF4] flex items-center justify-center mx-auto mb-3"
              >
                <Check className="w-7 h-7 text-[#10B981]" />
              </motion.div>
              <h3 className="text-[16px] font-black text-[#1A1A1A]">Reminder Set!</h3>
              <p className="text-[12px] text-[#9A9A9A] mt-1">
                Add to your calendar to make sure you don't miss it
              </p>
            </div>

            {/* Google Calendar */}
            <a
              href={googleCalUrl(targetDate, selected)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-[16px] bg-[#F8F9FA] active:scale-[0.98] transition-all"
            >
              {/* Google icon */}
              <div className="w-10 h-10 rounded-[12px] bg-white border border-black/[0.06] flex items-center justify-center shadow-sm shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-black text-[#1A1A1A]">Google Calendar</p>
                <p className="text-[11px] text-[#9A9A9A]">Opens in a new tab</p>
              </div>
              <div className="text-[#BBBBBB] text-[12px]">→</div>
            </a>

            {/* Outlook / Apple Calendar */}
            <a
              href={appleCalUrl(targetDate, selected)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-[16px] bg-[#F8F9FA] active:scale-[0.98] transition-all"
            >
              <div className="w-10 h-10 rounded-[12px] bg-white border border-black/[0.06] flex items-center justify-center shadow-sm shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect width="24" height="24" rx="5" fill="#0078D4"/>
                  <path d="M5 8h14v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8z" fill="white" fillOpacity="0.9"/>
                  <path d="M5 8V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" fill="white" fillOpacity="0.4"/>
                  <rect x="8" y="11" width="3" height="3" rx="0.5" fill="#0078D4"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-black text-[#1A1A1A]">Outlook / Apple Calendar</p>
                <p className="text-[11px] text-[#9A9A9A]">Works with iCal too</p>
              </div>
              <div className="text-[#BBBBBB] text-[12px]">→</div>
            </a>

            {/* WhatsApp self-reminder */}
            <a
              href={whatsappUrl(targetDate)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-[16px] bg-[#F0FFF4] active:scale-[0.98] transition-all"
            >
              <div className="w-10 h-10 rounded-[12px] bg-[#25D366] flex items-center justify-center shadow-sm shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-black text-[#1A1A1A]">WhatsApp Reminder</p>
                <p className="text-[11px] text-[#9A9A9A]">Send yourself a message</p>
              </div>
              <div className="text-[#BBBBBB] text-[12px]">→</div>
            </a>

            <button
              onClick={onClose}
              className="w-full py-3 text-[13px] font-semibold text-[#9A9A9A] mt-1 active:scale-[0.98] transition-all"
            >
              Done
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Main chart component ───────────────────────────────────────────────────────
interface SkinProgressChartProps {
  lastScanDate?: number; // unix ms
  recheckWeeks?: number;
}

export function SkinProgressChart({
  lastScanDate,
  recheckWeeks = 4,
}: SkinProgressChartProps = {}) {
  const [reminderOpen, setReminderOpen] = useState(false);

  const displayDate = lastScanDate
    ? new Date(lastScanDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <>
      <AnimatePresence>
        {reminderOpen && (
          <ReminderModal
            onClose={() => setReminderOpen(false)}
            recheckWeeks={recheckWeeks}
          />
        )}
      </AnimatePresence>

      <div className="bg-white rounded-[24px] p-5 shadow-sm border border-black/[0.02]">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#F6F6F6] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black/40">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                <line x1="16" x2="16" y1="2" y2="6"/>
                <line x1="8" x2="8" y1="2" y2="6"/>
                <line x1="3" x2="21" y1="10" y2="10"/>
                <path d="M8 14h.01"/><path d="M12 14h.01"/>
                <path d="M16 14h.01"/><path d="M8 18h.01"/>
                <path d="M12 18h.01"/><path d="M16 18h.01"/>
              </svg>
            </div>
            <h3 className="text-[12px] font-bold text-[#2F2F30] uppercase tracking-widest">
              Your Skin Progress
            </h3>
          </div>

          {/* Calendar button — opens reminder modal */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setReminderOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F6F1FB] active:bg-[#EDE0FF] transition-colors"
          >
            <CalendarDays className="w-3.5 h-3.5 text-[#A377D2]" />
            <span className="text-[11px] font-bold text-[#A377D2]">Set Reminder</span>
          </motion.button>
        </div>

        {/* Big percentage */}
        <div className="text-center mb-6">
          <span className="text-4xl font-black text-[#2F2F30]">+20%</span>
          <p className="text-[10px] font-bold text-black/20 uppercase tracking-[0.2em] mt-1">
            Last Scan: {displayDate}
          </p>
        </div>

        {/* Bar chart */}
        <div className="grid grid-cols-4 gap-3 items-end h-28">
          {SAMPLE_PROGRESS.map((item, i) => {
            const isNegative = item.delta < 0;
            return (
              <div key={item.label} className="flex flex-col items-center gap-2 h-full justify-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.abs(item.delta) * 4}px` }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                  style={{ backgroundColor: item.bgColor }}
                  className="w-full rounded-xl flex flex-col items-center justify-center min-h-[40px]"
                >
                  <span style={{ color: item.color }} className="text-[10px] font-black">
                    {isNegative ? "" : "+"}{item.delta}%
                  </span>
                </motion.div>
                <span className="text-[9px] font-bold text-black/30 uppercase">{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Set reminder CTA strip */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setReminderOpen(true)}
          className="w-full mt-5 py-3 rounded-[16px] bg-[#F9F6FD] flex items-center justify-center gap-2 active:bg-[#F0E8FB] transition-colors"
        >
          <CalendarDays className="w-4 h-4 text-[#A377D2]" />
          <span className="text-[12px] font-bold text-[#A377D2]">
            Remind me to re-scan in {recheckWeeks} weeks
          </span>
        </motion.button>
      </div>
    </>
  );
}
