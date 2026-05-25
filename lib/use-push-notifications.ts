"use client";

import { useState, useEffect, useCallback } from "react";

interface PushState {
  permission: NotificationPermission;
  isSubscribed: boolean;
  isSupported: boolean;
  loading: boolean;
  error: string | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushState>({
    permission: "default",
    isSubscribed: false,
    isSupported: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const isSupported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setState((prev) => ({
      ...prev,
      isSupported,
      permission: isSupported ? Notification.permission : "denied",
      loading: false,
    }));

    if (isSupported) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setState((prev) => ({
            ...prev,
            isSubscribed: !!subscription,
          }));
        });
      });
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!state.isSupported) {
      setState((prev) => ({ ...prev, error: "Push notifications not supported" }));
      return false;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setState((prev) => ({
          ...prev,
          permission,
          loading: false,
          error: permission === "denied" ? "Notification permission denied" : "Permission not granted",
        }));
        return false;
      }

      const registration = await navigator.serviceWorker.ready;

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setState((prev) => ({ ...prev, loading: false, error: "VAPID key not configured" }));
        return false;
      }

      const existingSubscription = await registration.pushManager.getSubscription();

      let subscription = existingSubscription;

      if (!subscription) {
        const applicationServerKey = urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer;
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      }

      const subJson = subscription.toJSON();

      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save subscription on server");
      }

      setState((prev) => ({
        ...prev,
        permission: "granted",
        isSubscribed: true,
        loading: false,
      }));

      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to subscribe";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      return false;
    }
  }, [state.isSupported]);

  const unsubscribe = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;

        await subscription.unsubscribe();

        await fetch("/api/notifications/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        loading: false,
      }));

      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to unsubscribe";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      return false;
    }
  }, []);

  const sendTestNotification = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "GlowScan",
          body: "Push notifications are working!",
          url: "/",
          tag: "test-notification",
        }),
      });

      if (!res.ok) throw new Error("Failed to send test notification");
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send test";
      setState((prev) => ({ ...prev, error: message }));
      return false;
    }
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
