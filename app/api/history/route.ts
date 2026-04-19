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
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json({ error: "Could not fetch history" }, { status: 500 });
  }
}
