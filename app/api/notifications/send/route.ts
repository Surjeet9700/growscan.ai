import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sendPushNotification, type NotificationPayload } from "@/lib/push";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, body: notifBody, icon, url, tag } = body as NotificationPayload;

    if (!title || !notifBody) {
      return NextResponse.json(
        { error: "Missing required fields: title, body" },
        { status: 400 }
      );
    }

    const result = await sendPushNotification(userId, {
      title,
      body: notifBody,
      icon,
      url,
      tag,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    console.error("[Push Send] Error:", (error as Error).message);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
