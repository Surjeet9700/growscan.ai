// lib/schemas.ts
import { z } from "zod";

export const ScanContextSchema = z.object({
  age: z.string().optional(),
  concern: z.string().optional(),
  habits: z.string().optional(),
});

export const FreeAnalyseSchema = z.object({
  imageBase64: z.string().startsWith("data:image", { message: "Invalid image format" }),
});

export const FullAnalyseSchema = z.object({
  imageBase64: z.string().startsWith("data:image", { message: "Invalid image format" }),
  paymentId: z.string().min(1, { message: "Payment ID is required" }),
  context: ScanContextSchema.optional(),
});

export const PaymentVerifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  userId: z.string().optional(),
});
