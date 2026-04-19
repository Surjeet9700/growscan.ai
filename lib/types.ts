// lib/types.ts — Shared TypeScript interfaces for GlowScan

export type FaceZoneSeverity = "none" | "mild" | "moderate" | "severe";

export interface FaceZone {
  zone: "forehead" | "left_cheek" | "right_cheek" | "nose" | "chin";
  issue: string;
  severity: FaceZoneSeverity;
  coordinates?: { top: number; left: number };
}

export interface SkinTip {
  tip: string;
  urgency: "daily" | "weekly" | "lifestyle";
}

export interface FreeAnalysisResult {
  skin_type: "oily" | "dry" | "combination" | "normal";
  skin_type_reason: string;
  top_concern: string;
  glow_score: number;
  preview_insight: string;
  face_zones: FaceZone[];
  skin_tips: SkinTip[];
  error: string | null;
  timestamp?: number;
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
  reason: string;
}

export interface FullReportResult {
  skin_type: "oily" | "dry" | "combination" | "normal";
  skin_type_reason: string;
  concerns: SkinConcerns;
  skin_age_estimate: string;
  strengths: string[];
  priority_ingredients: PriorityIngredient[];
  morning_routine_order: string[];
  night_routine_order: string[];
  lifestyle_tips: string[];
  recheck_in_weeks: number;
  summary: string;
  error: string | null;
}

export interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface StoredFreeResult extends FreeAnalysisResult {
  timestamp: number;
}

export interface StoredFullReport {
  report: FullReportResult;
  paymentId: string;
  timestamp: number;
}
