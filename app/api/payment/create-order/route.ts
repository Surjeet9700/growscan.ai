import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { plan } = await req.json().catch(() => ({ plan: "standard" }));
    
    // Boris: Defensive Pricing — only authorized tiers allowed
    const amount = plan === "flash_sale" ? 2900 : 4900;

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "dummy",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy",
    });

    const reportId = crypto.randomUUID();

    const order = await razorpay.orders.create({
      amount, // ₹49 or ₹29 in paise
      currency: "INR",
      receipt: reportId,
      notes: { reportId, plan },
    });

    return NextResponse.json({ orderId: order.id, reportId });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Could not initialize payment order." },
      { status: 500 }
    );
  }
}
