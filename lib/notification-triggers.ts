import { sendPushNotification } from "@/lib/push";

export async function notifyScanComplete(userId: string) {
  await sendPushNotification(userId, {
    title: "Your Skin Report is Ready",
    body: "Tap to view your personalized skin analysis results.",
    url: "/result/free",
    tag: "scan-complete",
  });
}

export async function notifyPaymentConfirmed(userId: string) {
  await sendPushNotification(userId, {
    title: "Payment Confirmed",
    body: "Your full clinical report is being generated. We'll notify you when it's ready.",
    url: "/result/full",
    tag: "payment-confirmed",
  });
}

export async function notifyFullReportReady(userId: string) {
  await sendPushNotification(userId, {
    title: "Full Report Ready",
    body: "Your detailed skin analysis with zone mapping and routines is now available.",
    url: "/result/full",
    tag: "full-report-ready",
  });
}

export async function notifyDailyRoutineReminder(userId: string) {
  await sendPushNotification(userId, {
    title: "Morning Skincare Reminder",
    body: "Don't forget your morning routine! Tap to check off today's steps.",
    url: "/history",
    tag: "routine-reminder",
  });
}

export async function notifyWeeklyScanReminder(userId: string) {
  await sendPushNotification(userId, {
    title: "Weekly Skin Check",
    body: "It's been a while since your last scan. Track your skin progress today.",
    url: "/scan",
    tag: "weekly-scan-reminder",
  });
}
