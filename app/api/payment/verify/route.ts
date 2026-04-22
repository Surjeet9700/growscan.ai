// app/api/payment/verify/route.ts
// SECURITY: Verifies Razorpay HMAC signature + cross-verifies with Razorpay REST API.
// The full report API checks the VerifiedPayment collection — no DB record = no report.
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { dbConnect } from "@/lib/mongodb";
import VerifiedPayment from "@/models/VerifiedPayment";
import { PaymentVerifySchema } from "@/lib/schemas";

/** Cross-verify payment status with Razorpay REST API */
async function verifyPaymentWithRazorpay(paymentId: string): Promise<{
  status: string;
  amount: number;
  currency: string;
}> {
  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials not configured");
  }

  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch(
    `https://api.razorpay.com/v1/payments/${paymentId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Razorpay API error [${response.status}]: ${errorText}`);
  }

  const payment = await response.json();
  return {
    status:   payment.status,
    amount:   payment.amount,    // in paise (INR × 100)
    currency: payment.currency,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    const json = await req.json();

    // 1. Validate input
    const result = PaymentVerifySchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Invalid payload", details: result.error.format() },
        { status: 400 }
      );
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId: bodyUserId,
    } = result.data;

    const userId = clerkUserId ?? bodyUserId;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. HMAC signature verification (Razorpay Standard Checkout requirement)
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error("RAZORPAY_KEY_SECRET missing");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    const hmacPayload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(hmacPayload)
      .digest("hex");

    // Use timing-safe comparison to prevent timing attacks
    const signaturesMatch = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(razorpay_signature, "hex")
    );

    if (!signaturesMatch) {
      console.warn(
        `[Payment] Signature mismatch: Order[${razorpay_order_id}] Payment[${razorpay_payment_id}]`
      );
      return NextResponse.json(
        { success: false, error: "Signature verification failed" },
        { status: 400 }
      );
    }

    // 3. Cross-verify with Razorpay API — confirm payment is actually captured
    let paymentAmount = 0;
    let paymentCurrency = "INR";
    try {
      const razorpayPayment = await verifyPaymentWithRazorpay(razorpay_payment_id);

      if (razorpayPayment.status !== "captured") {
        console.warn(
          `[Payment] Payment ${razorpay_payment_id} status is "${razorpayPayment.status}" (expected "captured")`
        );
        return NextResponse.json(
          { success: false, error: `Payment not yet captured. Status: ${razorpayPayment.status}` },
          { status: 402 }
        );
      }

      paymentAmount   = razorpayPayment.amount;
      paymentCurrency = razorpayPayment.currency;

    } catch (apiErr: any) {
      // If Razorpay API is unreachable, fall back to HMAC-only (don't block the user)
      console.warn("[Payment] Razorpay API cross-verify failed (falling back to HMAC-only):", apiErr.message);
    }

    // 4. Persist verified payment to MongoDB
    await dbConnect();
    await VerifiedPayment.create({
      paymentId:  razorpay_payment_id,
      orderId:    razorpay_order_id,
      userId,
      amount:     paymentAmount,
      currency:   paymentCurrency,
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("[Payment verify] Unhandled error:", error);

    // Handle duplicate payment ID gracefully (idempotency)
    if (error?.code === 11000) {
      return NextResponse.json({ success: true }); // Already verified
    }

    return NextResponse.json(
      { success: false, error: "Verification failed. Please contact support." },
      { status: 500 }
    );
  }
}
