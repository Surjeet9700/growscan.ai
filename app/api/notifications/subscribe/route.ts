import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { dbConnect } from "@/lib/mongodb";
import PushSubscription from "@/models/PushSubscription";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "Missing required fields: endpoint, keys.p256dh, keys.auth" },
        { status: 400 }
      );
    }

    await dbConnect();

    const existing = await PushSubscription.findOne({ endpoint });

    if (existing) {
      if (existing.userId !== userId) {
        existing.userId = userId;
        existing.keys = keys;
        existing.userAgent = req.headers.get("user-agent") || undefined;
        await existing.save();
      }
      return NextResponse.json({ success: true, message: "Subscription updated" });
    }

    await PushSubscription.create({
      userId,
      endpoint,
      keys,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true, message: "Subscribed" });
  } catch (error: unknown) {
    console.error("[Push Subscribe] Error:", (error as Error).message);
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { endpoint } = await req.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: "Missing endpoint" },
        { status: 400 }
      );
    }

    await dbConnect();

    await PushSubscription.deleteOne({ endpoint, userId });

    return NextResponse.json({ success: true, message: "Unsubscribed" });
  } catch (error: unknown) {
    console.error("[Push Unsubscribe] Error:", (error as Error).message);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}
