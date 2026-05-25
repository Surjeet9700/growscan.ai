import webPush from "web-push";
import { dbConnect } from "@/lib/mongodb";
import PushSubscription from "@/models/PushSubscription";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || "mailto:support@glowscan.app";

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export async function sendPushNotification(
  userId: string,
  payload: NotificationPayload
): Promise<{ sent: number; failed: number }> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("[Push] VAPID keys not configured. Skipping notification.");
    return { sent: 0, failed: 0 };
  }

  await dbConnect();

  const subscriptions = await PushSubscription.find({ userId });

  if (subscriptions.length === 0) {
    console.warn(`[Push] No subscriptions found for user ${userId}`);
    return { sent: 0, failed: 0 };
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-192.png",
    url: payload.url || "/",
    tag: payload.tag || "glowscan-notification",
    data: payload.data || {},
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
          },
          notificationPayload,
          {
            TTL: 60 * 60,
            urgency: "normal",
          }
        );
        return { success: true, endpoint: sub.endpoint };
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          await PushSubscription.deleteOne({ endpoint: sub.endpoint });
          console.warn(`[Push] Removed stale subscription: ${sub.endpoint}`);
        }
        return { success: false, endpoint: sub.endpoint, error: err };
      }
    })
  );

  const sent = results.filter((r) => r.status === "fulfilled" && r.value.success).length;
  const failed = results.length - sent;

  return { sent, failed };
}

export async function sendPushToAll(
  payload: NotificationPayload
): Promise<{ sent: number; failed: number }> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("[Push] VAPID keys not configured. Skipping broadcast.");
    return { sent: 0, failed: 0 };
  }

  await dbConnect();

  const subscriptions = await PushSubscription.find();

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-192.png",
    url: payload.url || "/",
    tag: payload.tag || "glowscan-notification",
    data: payload.data || {},
  });

  let sent = 0;
  let failed = 0;

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
          },
          notificationPayload,
          { TTL: 60 * 60, urgency: "normal" }
        );
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          await PushSubscription.deleteOne({ endpoint: sub.endpoint });
        }
        failed++;
      }
    })
  );

  return { sent, failed };
}
