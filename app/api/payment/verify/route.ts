// app/api/payment/verify/route.ts
// SECURITY: Verifies Razorpay HMAC signature and persists verified paymentId to MongoDB.
// The full report API checks this collection — no DB record = no report.
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { dbConnect } from "@/lib/mongodb";
import VerifiedPayment from "@/models/VerifiedPayment";
import { PaymentVerifySchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    const json = await req.json();
    
    // 1. Validate Input
    const result = PaymentVerifySchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid payload", 
        details: result.error.format() 
      }, { status: 400 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId: bodyUserId } = result.data;
    const userId = clerkUserId || bodyUserId;

    if (!userId) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    // 1. Verify HMAC signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      throw new Error("RAZORPAY_KEY_SECRET is not configured");
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, error: "Signature mismatch" }, { status: 400 });
    }

    // 2. Persist the verified payment — this is what /api/analyse/full checks
    await dbConnect();
    await VerifiedPayment.create({
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Signature verification error:", error);
    // Handle duplicate payment ID gracefully (idempotency)
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json({ success: true }); // Already verified
    }
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}
