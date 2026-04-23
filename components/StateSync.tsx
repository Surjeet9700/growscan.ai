"use client";

// components/StateSync.tsx
// Non-visual background component. Mounts on every page via layout.tsx.
// On sign-in, hits /api/user/sync and hydrates localStorage from the DB
// so users don't lose their premium status or scans on new devices.

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";

export function StateSync() {
  const { isSignedIn, isLoaded } = useUser();
  // Prevent double-sync in React StrictMode double-mount
  const hasSynced = useRef(false);

  useEffect(() => {
    // Only run once the Clerk auth state is confirmed and user is signed in
    if (!isLoaded || !isSignedIn || hasSynced.current) return;

    hasSynced.current = true;

    const runSync = async () => {
      try {
        const res = await fetch("/api/user/sync", { cache: "no-store" });
        if (!res.ok) return; // Fail silently — localStorage already has data

        const data = await res.json();

        // ── Hydrate Full Report ───────────────────────────────────────────────
        // Only write to localStorage if the device is MISSING the report.
        // We never overwrite a report that's already there (it could be fresher
        // from an in-progress scan on the same device).
        if (data.fullReport && !localStorage.getItem("glowscan_report")) {
          localStorage.setItem("glowscan_report", JSON.stringify(data.fullReport));
        }

        // ── Hydrate Free Scan ─────────────────────────────────────────────────
        if (data.freeScan && !localStorage.getItem("glowscan_free")) {
          localStorage.setItem("glowscan_free", JSON.stringify(data.freeScan));
        }

        // ── Hydrate Premium Flag ──────────────────────────────────────────────
        // If the server says isPremium but localStorage hasn't been set, fix it.
        if (data.isPremium && !localStorage.getItem("glowscan_is_premium")) {
          localStorage.setItem("glowscan_is_premium", "true");
        }
      } catch {
        // Network error — silently ignore, app works from existing localStorage
      }
    };

    runSync();
  }, [isLoaded, isSignedIn]);

  // Render nothing — this is a pure side-effect component
  return null;
}
