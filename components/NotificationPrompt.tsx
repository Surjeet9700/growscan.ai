"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { usePushNotifications } from "@/lib/use-push-notifications";

export function NotificationPrompt() {
  const {
    permission,
    isSubscribed,
    isSupported,
    loading,
    error,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  if (!isSupported) return null;

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-3 rounded-[18px] bg-[#FEF2F2] px-4 py-3">
        <BellOff className="w-4 h-4 text-red-400 shrink-0" />
        <p className="text-[12px] text-red-600">
          Notifications blocked. Enable them in your browser settings.
        </p>
      </div>
    );
  }

  if (isSubscribed) {
    return (
      <div className="flex items-center justify-between rounded-[18px] bg-[#F0FDF4] px-4 py-3">
        <div className="flex items-center gap-3">
          <Bell className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-[12px] text-emerald-700 font-medium">
            Notifications enabled
          </p>
        </div>
        <button
          onClick={() => void unsubscribe()}
          disabled={loading}
          className="text-[11px] font-semibold text-emerald-600 underline active:opacity-70"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Disable"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-[18px] bg-white px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#F3EEFB] flex items-center justify-center shrink-0">
          <Bell className="w-4 h-4 text-[#A377D2]" />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-bold text-[#1A1A1A]">
            Stay on track with reminders
          </p>
          <p className="text-[11px] text-[#9A9A9A] mt-0.5">
            Get daily routine reminders and weekly scan prompts.
          </p>
          {error && (
            <p className="text-[11px] text-red-500 mt-1">{error}</p>
          )}
          <button
            onClick={() => void subscribe()}
            disabled={loading}
            className="mt-3 px-4 py-2 rounded-full bg-[#A377D2] text-white text-[12px] font-bold shadow-[0_2px_8px_rgba(163,119,210,0.3)] active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Bell className="w-3 h-3" />
            )}
            Enable Notifications
          </button>
        </div>
      </div>
    </div>
  );
}
