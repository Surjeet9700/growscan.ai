// app/api/payment/create-order/route.ts
import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { plan } = await req.json().catch(() => ({ plan: "standard" }));
    
    // Step 1: Calculate amount in paise (1 INR = 100 paise)
    const amount = plan === "flash_sale" ? 2900 : 4900;

    // Minimum amount validation as per Razorpay requirements
    if (amount < 100) {
      return NextResponse.json(
        { error: "Amount must be at least 100 paise." },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("Razorpay credentials missing from env");
      return NextResponse.json(
        { error: "Payment gateway configuration error." },
        { status: 401 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const receipt = `rcpt_${crypto.randomBytes(8).toString("hex")}`;

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt,
      notes: { plan },
    });

    return NextResponse.json({ 
      orderId: order.id, 
      amount: order.amount, 
      currency: order.currency 
    });
  } catch (error) {
    console.error("Razorpay Order Creation Error:", error);
    return NextResponse.json(
      { error: "Could not initialize payment order." },
      { status: 500 }
    );
  }
}
