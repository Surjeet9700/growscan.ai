// app/api/user/sync/route.ts
// Cross-device state sync — called on app mount by <StateSync />.
// Returns the user's latest scan results and premium status from MongoDB
// so the client can hydrate localStorage on a new device.
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Scan from "@/models/Scan";
import VerifiedPayment from "@/models/VerifiedPayment";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Run all DB queries in parallel for performance
    const [latestFreeScan, latestFullScan, latestPayment] = await Promise.all([
      Scan.findOne({ userId, type: "free" })
        .sort({ createdAt: -1 })
        .select("-__v -updatedAt")
        .lean(),
      Scan.findOne({ userId, type: "full" })
        .sort({ createdAt: -1 })
        .select("-__v -updatedAt")
        .lean(),
      VerifiedPayment.findOne({ userId })
        .sort({ createdAt: -1 })
        .select("paymentId orderId amount currency createdAt usedAt")
        .lean(),
    ]);

    const isPremium = !!latestPayment;

    return NextResponse.json({
      isPremium,
      // Full report: reshape to match what /result/full/page.tsx expects in localStorage
      fullReport: latestFullScan
        ? {
            report: latestFullScan.result,
            timestamp: new Date((latestFullScan as any).createdAt).getTime(),
          }
        : null,
      // Free scan: reshape to match what /result/free/page.tsx expects in localStorage
      freeScan: latestFreeScan
        ? {
            ...(latestFreeScan.result as Record<string, unknown>),
            timestamp: new Date((latestFreeScan as any).createdAt).getTime(),
          }
        : null,
      // Payment info for the profile billing section
      latestPayment: latestPayment
        ? {
            paymentId: (latestPayment as any).paymentId,
            amount: (latestPayment as any).amount,
            currency: (latestPayment as any).currency,
            paidAt: (latestPayment as any).createdAt,
            usedAt: (latestPayment as any).usedAt,
          }
        : null,
    });
  } catch (error: any) {
    console.error("[Sync] Error:", error.message);
    // Always fail-open — the client can still work from localStorage
    return NextResponse.json(
      { error: "Sync unavailable", isPremium: false, fullReport: null, freeScan: null },
      { status: 503 }
    );
  }
}
