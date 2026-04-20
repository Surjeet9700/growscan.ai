// app/api/history/route.ts — Returns last 10 scans for the authenticated user
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Scan from "@/models/Scan";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const scans = await Scan.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({ scans });
  } catch (error: any) {
    console.error("History fetch error:", error.message);
    const isConnError = error.name === "MongooseServerSelectionError" || error.message.includes("whitelist");
    
    return NextResponse.json({ 
      error: isConnError ? "Database connection blocked (check IP whitelist)" : "Could not fetch history",
      isOffline: isConnError
    }, { status: isConnError ? 503 : 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, result } = await req.json();

    if (!type || !result) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    await dbConnect();

    const newScan = await Scan.create({
      userId,
      type,
      result,
    });

    return NextResponse.json({ success: true, scanId: newScan._id });
  } catch (error: any) {
    console.error("History save error:", error.message);
    const isConnError = error.name === "MongooseServerSelectionError" || error.message.includes("whitelist");

    if (isConnError) {
      // FAIL-OPEN: Return success-preview so frontend doesn't show an error toast
      // The result is already in LocalStorage, so the user experience is preserved.
      return NextResponse.json({ 
        success: true, 
        warning: "Database unreachable, scan saved locally only.",
        isOffline: true 
      }, { status: 202 });
    }

    return NextResponse.json({ error: "Could not save history" }, { status: 500 });
  }
}
