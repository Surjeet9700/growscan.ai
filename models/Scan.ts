// models/Scan.ts — Stores each free/full/palm scan linked to a Clerk user ID
import mongoose, { Schema, Document, Model } from "mongoose";

export type ScanType = "free" | "full" | "palm";

export interface IScan extends Document {
  userId: string;      // Clerk user ID
  type: ScanType;
  result: Record<string, unknown>; // FreeAnalysisResult, FullReportResult, or PalmReadingResult
  createdAt: Date;
}

const ScanSchema = new Schema<IScan>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ["free", "full", "palm"], required: true },
    result: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

// Composite index for efficient per-user history queries
ScanSchema.index({ userId: 1, createdAt: -1 });

const Scan: Model<IScan> =
  mongoose.models.Scan || mongoose.model<IScan>("Scan", ScanSchema);

export default Scan;
