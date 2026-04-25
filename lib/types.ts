// lib/types.ts — Shared TypeScript interfaces for GlowScan

import type { ClimateContext } from "@/lib/climate";

export type FaceZoneSeverity = "none" | "mild" | "moderate" | "severe";

export interface ScanContext {
  age?: string;
  concern?: string;
  habits?: string;
  climate?: ClimateContext | null;
}

export interface FaceZone {
  zone: "forehead" | "left_cheek" | "right_cheek" | "nose" | "chin";
  issue: string;
  severity: FaceZoneSeverity;
  score: number;   // 1–10 health index (10 = perfect)
  x?: number;      // 0–100% horizontal position
  y?: number;      // 0–100% vertical position
  confidence?: number; // 0–1 model confidence for this zone
}

export interface SkinTip {
  tip: string;
  urgency: "daily" | "weekly" | "lifestyle";
}

/** Numeric scores (0–100) for the 4 frontend metric rings */
export interface SkinMetricScores {
  acne_score: number;     // 0–100 (higher = more acne)
  dryness_score: number;  // 0–100 (higher = drier)
  spots_score: number;    // 0–100 (higher = more spots)
  moisture_score: number; // 0–100 (higher = better hydrated)
}

export interface FreeAnalysisResult extends SkinMetricScores {
  skin_type: "oily" | "dry" | "combination" | "normal";
  skin_type_reason: string;
  top_concern: string;
  glow_score: number;
  preview_insight: string;
  face_zones: FaceZone[];
  skin_tips: SkinTip[];
  skin_age_estimate?: number;
  primary_ingredient?: string;
  error: string | null;
  timestamp?: number;
  // Response metadata
  _meta?: {
    request_id: string;
    processing_time_ms: number;
    model_used: string;
  };
}

export interface SkinConcerns {
  pigmentation: "none" | "mild" | "moderate" | "significant";
  acne_or_breakouts: "none" | "mild" | "moderate" | "significant";
  dark_circles: "none" | "mild" | "moderate" | "significant";
  pores: "tight" | "slightly enlarged" | "enlarged";
  texture: "smooth" | "slightly uneven" | "uneven";
  hydration: "well hydrated" | "slightly dehydrated" | "dehydrated";
  oiliness: "low" | "moderate" | "high";
}

export interface PriorityIngredient {
  ingredient: string;
  scientific_role: string; // e.g. "Tyrosinase Inhibitor", "Humectant"
  reason: string;
}

/** A single step in a morning/night routine */
export interface RoutineStep {
  step: string;     // e.g. "Cleanser"
  product: string;  // e.g. "Gentle low-pH cleanser"
  purpose: string;  // e.g. "Purify without stripping"
}

/** Per-zone dermatological score block */
export interface ZoneIntelligence {
  score: number;       // 0–100
  observation: string; // 1 sentence
}

/** Dermal health index triplet */
export interface DermalIndices {
  barrier_resistance: number;  // 0–100
  luminosity_index: number;    // 0–100
  clarity_score: number;       // 0–100
}

export interface FullReportResult {
  skin_type: "oily" | "dry" | "combination" | "normal";
  skin_type_reason: string;
  zonal_intelligence: {
    forehead: ZoneIntelligence;
    cheeks: ZoneIntelligence;
    t_zone: ZoneIntelligence;
  };
  concerns: SkinConcerns;
  skin_age_estimate: string; // e.g. "Appears 24–28 years..."
  dermal_indices: DermalIndices;
  strengths: string[];
  priority_ingredients: PriorityIngredient[];
  morning_routine_order: RoutineStep[];
  night_routine_order: RoutineStep[];
  lifestyle_tips: string[];
  recheck_in_weeks: number;
  summary: string;
  error: string | null;
  _meta?: {
    request_id: string;
    processing_time_ms: number;
    model_used: string;
  };
}

export interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface StoredFreeResult extends FreeAnalysisResult {
  timestamp: number;
  scan_image?: string;
  scan_context?: ScanContext | null;
}

export interface StoredFullReport {
  report: FullReportResult;
  paymentId?: string | null;
  timestamp: number;
  scan_image?: string | null;
  scan_context?: ScanContext | null;
}

export interface LatestPaymentSummary {
  paymentId: string;
  amount: number;
  currency: string;
  paidAt: string | Date;
  usedAt?: string | Date | null;
}

export interface UserSyncState {
  isPremium: boolean;
  fullReport: StoredFullReport | null;
  freeScan: StoredFreeResult | null;
  latestPayment: LatestPaymentSummary | null;
}
