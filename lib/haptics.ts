type HapticKind = "light" | "medium" | "success" | "warning";

const PATTERNS: Record<HapticKind, number | number[]> = {
  light: 10,
  medium: 18,
  success: [12, 40, 18],
  warning: [24, 50, 24],
};

export function triggerHaptic(kind: HapticKind = "light") {
  if (typeof window === "undefined") return;
  if (!("vibrate" in navigator)) return;

  try {
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    // Ignore unsupported/blocked vibration requests.
  }
}
