// models/VerifiedPayment.ts — Stores Razorpay payments confirmed via HMAC signature
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVerifiedPayment extends Document {
  paymentId: string;   // razorpay_payment_id
  orderId: string;     // razorpay_order_id
  userId: string;      // Clerk user ID
  usedAt: Date | null; // Set when the full report is generated — prevents reuse
  createdAt: Date;
}

const VerifiedPaymentSchema = new Schema<IVerifiedPayment>(
  {
    paymentId: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const VerifiedPayment: Model<IVerifiedPayment> =
  mongoose.models.VerifiedPayment ||
  mongoose.model<IVerifiedPayment>("VerifiedPayment", VerifiedPaymentSchema);

export default VerifiedPayment;
