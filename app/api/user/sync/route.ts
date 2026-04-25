// app/api/user/sync/route.ts
// Returns the user's latest scan results and premium status from MongoDB.
// This is the authenticated source of truth for result pages and summary UI.
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

    const freeResult = latestFreeScan?.result as Record<string, unknown> | undefined;
    const fullResult = latestFullScan?.result as Record<string, unknown> | undefined;

    return NextResponse.json({
      isPremium,
      fullReport: latestFullScan
        ? {
            report: fullResult,
            timestamp: new Date((latestFullScan as any).createdAt).getTime(),
            paymentId: typeof fullResult?.payment_id === "string" ? fullResult.payment_id : null,
            scan_image:
              typeof fullResult?.scan_image === "string"
                ? fullResult.scan_image
                : typeof freeResult?.scan_image === "string"
                ? freeResult.scan_image
                : null,
            scan_context: (fullResult?.scan_context as Record<string, unknown> | null) ?? null,
          }
        : null,
      freeScan: latestFreeScan
        ? {
            ...freeResult,
            timestamp: new Date((latestFreeScan as any).createdAt).getTime(),
            scan_image: typeof freeResult?.scan_image === "string" ? freeResult.scan_image : null,
            scan_context: (freeResult?.scan_context as Record<string, unknown> | null) ?? null,
          }
        : null,
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
    return NextResponse.json(
      { error: "Sync unavailable", isPremium: false, fullReport: null, freeScan: null },
      { status: 503 }
    );
  }
}
