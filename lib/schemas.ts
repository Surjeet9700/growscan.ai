// lib/schemas.ts — Zod validation schemas for all API routes
import { z } from "zod";

// ── Shared ────────────────────────────────────────────────────────────────────

const ClimateSignalsSchema = z.object({
  uv_index: z.number().nullable(),
  humidity: z.number().nullable(),
  pm25: z.number().nullable(),
  us_aqi: z.number().nullable(),
  temperature_c: z.number().nullable(),
});

const ClimateContextSchema = z.object({
  score: z.number(),
  level: z.enum(["low", "moderate", "high", "extreme"]),
  summary: z.string(),
  drivers: z.array(z.string()),
  watchouts: z.array(z.string()),
  actions: z.array(z.string()),
  captured_at: z.string(),
  source: z.enum(["live", "scan-time"]),
  signals: ClimateSignalsSchema,
});

export const ScanContextSchema = z.object({
  age: z.string().optional(),
  concern: z.string().optional(),
  habits: z.string().optional(),
  climate: ClimateContextSchema.nullable().optional(),
});

/** Base64 image: must start with data:image, and be under 5MB (≈ 6.67MB base64) */
const imageBase64Schema = z
  .string()
  .startsWith("data:image", { message: "Invalid image format" })
  .refine((val) => val.length <= 7_000_000, {
    message: "Image too large. Please use a photo under 5MB.",
  });

// ── Route schemas ─────────────────────────────────────────────────────────────

export const FreeAnalyseSchema = z.object({
  imageBase64: imageBase64Schema,
  context: ScanContextSchema.optional(),
});

export const FullAnalyseSchema = z.object({
  imageBase64: imageBase64Schema,
  paymentId: z.string().min(1, { message: "Payment ID is required" }),
  context: ScanContextSchema.optional(),
});

export const PaymentVerifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  userId: z.string().optional(),
});

/** Validates the body of POST /api/history — only allow known scan types */
export const HistoryPostSchema = z.object({
  type: z.enum(["free", "full"]).refine((v) => ["free", "full"].includes(v), {
    message: "type must be 'free' or 'full'",
  }),
  result: z.record(z.string(), z.unknown()),
});
