// app/api/history/route.ts
// Returns paginated scan history for the authenticated user
// POST: saves a scan record (validated)
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Scan from "@/models/Scan";
import { HistoryPostSchema } from "@/lib/schemas";

// ── GET /api/history?limit=20&page=1 ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse pagination params
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50); // max 50
    const page  = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
    const skip  = (page - 1) * limit;

    await dbConnect();

    const [scans, totalCount] = await Promise.all([
      Scan.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-__v -updatedAt") // exclude MongoDB internals
        .lean(),
      Scan.countDocuments({ userId }),
    ]);

    // Clean and normalize output
    const cleanedScans = scans.map((scan: any) => ({
      id:        scan._id.toString(),
      type:      scan.type,
      createdAt: scan.createdAt,
      // Surface key result fields for the history list UI
      glow_score:    scan.result?.glow_score   ?? null,
      skin_type:     scan.result?.skin_type    ?? null,
      top_concern:   scan.result?.top_concern  ?? null,
      acne_score:    scan.result?.acne_score   ?? null,
      dryness_score: scan.result?.dryness_score ?? null,
      spots_score:   scan.result?.spots_score  ?? null,
      moisture_score:scan.result?.moisture_score ?? null,
      preview_insight: scan.result?.preview_insight ?? null,
    }));

    return NextResponse.json({
      scans: cleanedScans,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
        has_more: skip + limit < totalCount,
      },
    });

  } catch (error: any) {
    console.error("History GET error:", error.message);
    const isConnError =
      error.name === "MongooseServerSelectionError" ||
      error.message?.includes("whitelist") ||
      error.message?.includes("ECONNREFUSED");

    return NextResponse.json(
      {
        error: isConnError
          ? "Database connection blocked (check MongoDB IP whitelist)"
          : "Could not fetch history",
        isOffline: isConnError,
      },
      { status: isConnError ? 503 : 500 }
    );
  }
}

// ── POST /api/history ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate with schema (prevents arbitrary type/result injection)
    const validation = HistoryPostSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid history data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { type, result } = validation.data;

    await dbConnect();

    const newScan = await Scan.create({ userId, type, result });

    return NextResponse.json({
      success: true,
      scanId: newScan._id.toString(),
    });

  } catch (error: any) {
    console.error("History POST error:", error.message);
    const isConnError =
      error.name === "MongooseServerSelectionError" ||
      error.message?.includes("whitelist") ||
      error.message?.includes("ECONNREFUSED");

    if (isConnError) {
      // Fail-open: result is already in LocalStorage, don't show error to user
      return NextResponse.json(
        { success: true, warning: "Database unreachable, scan saved locally only.", isOffline: true },
        { status: 202 }
      );
    }

    return NextResponse.json({ error: "Could not save history" }, { status: 500 });
  }
}
