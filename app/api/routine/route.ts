import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Routine from "@/models/Routine";

// GET /api/routine?startDate=2024-04-01&endDate=2024-04-30
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    await dbConnect();

    const query: any = { userId };
    if (startDate && endDate) {
      query.dateString = { $gte: startDate, $lte: endDate };
    }

    const routines = await Routine.find(query).sort({ dateString: 1 }).lean();

    return NextResponse.json({ routines });
  } catch (error: any) {
    console.error("Routine GET error:", error.message);
    return NextResponse.json({ error: "Could not fetch routines" }, { status: 500 });
  }
}

// POST /api/routine
// Body: { dateString: "2024-04-23", field: "moisturizer", value: true }
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { dateString, field, value } = body;

    if (!dateString || !field || typeof value !== "boolean") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Ensure only valid fields can be updated
    const validFields = ["moisturizer", "serum", "sunscreen", "nightCream"];
    if (!validFields.includes(field)) {
      return NextResponse.json({ error: "Invalid routine field" }, { status: 400 });
    }

    await dbConnect();

    // Upsert the routine for this user & date
    const updatedRoutine = await Routine.findOneAndUpdate(
      { userId, dateString },
      { $set: { [`items.${field}`]: value } },
      { returnDocument: "after", upsert: true }
    ).lean();

    return NextResponse.json({ success: true, routine: updatedRoutine });
  } catch (error: any) {
    console.error("Routine POST error:", error.message);
    return NextResponse.json({ error: "Could not update routine" }, { status: 500 });
  }
}
