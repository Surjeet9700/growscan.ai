import mongoose, { Schema, Document } from "mongoose";

export interface IRoutine extends Document {
  userId: string;
  dateString: string; // Format: "YYYY-MM-DD"
  items: {
    moisturizer: boolean;
    serum: boolean;
    sunscreen: boolean;
    nightCream: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const RoutineSchema = new Schema<IRoutine>(
  {
    userId: { type: String, required: true, index: true },
    dateString: { type: String, required: true, index: true },
    items: {
      moisturizer: { type: Boolean, default: false },
      serum: { type: Boolean, default: false },
      sunscreen: { type: Boolean, default: false },
      nightCream: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// Compound index to ensure 1 document per user per day
RoutineSchema.index({ userId: 1, dateString: 1 }, { unique: true });

export default mongoose.models.Routine || mongoose.model<IRoutine>("Routine", RoutineSchema);
