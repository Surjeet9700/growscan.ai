import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST() {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "dummy",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy",
    });

    const reportId = crypto.randomUUID();

    const order = await razorpay.orders.create({
      amount: 4900, // ₹49 in paise
      currency: "INR",
      receipt: reportId,
      notes: { reportId },
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
