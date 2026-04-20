"use client";

// components/PayButton.tsx
// Fixes applied:
// 1. Guard against window.Razorpay not yet loaded
// 2. Proper TypeScript types — no more `any`
// 3. Integrated premium ProcessingOverlay for post-payment flow

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import type { RazorpayHandlerResponse } from "@/lib/types";
import { ProcessingOverlay } from "./ProcessingOverlay";

// Minimal Razorpay type — enough to avoid window.any casts
interface RazorpayOptions {
  key: string | undefined;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { contact: string; email: string };
  theme: { color: string };
  handler: (response: RazorpayHandlerResponse) => Promise<void>;
  modal: { ondismiss: () => void };
}

interface RazorpayInstance {
  on: (event: string, handler: (response: { error: { description: string } }) => void) => void;
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export function PayButton({ className, label, isDiscounted = false }: { className?: string; label?: string; isDiscounted?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();
  const { userId } = useAuth();

  const handlePayment = async () => {
    // FIX: Guard against Razorpay script not yet loaded (lazyOnload race condition)
    if (typeof window.Razorpay === "undefined") {
      toast.error("Payment system not ready", {
        description: "Please wait a moment and try again.",
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Create Razorpay order
      const orderRes = await fetch("/api/payment/create-order", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: isDiscounted ? "flash_sale" : "standard" })
      });
      if (!orderRes.ok) throw new Error("Could not initialize payment");
      const { orderId } = await orderRes.json();

      // Ensure the image exists in localStorage
      const imageBase64 = localStorage.getItem("glowscan_image");
      if (!imageBase64) {
        throw new Error("Session expired. Please scan your face again.");
      }

      // 2. Open Razorpay checkout dialog
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: isDiscounted ? 2900 : 4900,
        currency: "INR",
        name: "GlowScan",
        description: "Full Skin Analysis Report",
        order_id: orderId,
        prefill: { contact: "", email: "" },
        theme: { color: "#E8956D" },
        handler: async (response: RazorpayHandlerResponse) => {
          setProcessing(true);
          setLoading(false);
          
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...response, userId }),
            });
            const verification = await verifyRes.json();
            if (!verification.success) throw new Error("Payment verification failed");

            // ── Patient Context ───────────────────────────────────────────────
            const contextRaw = localStorage.getItem("glowscan_context");
            const context = contextRaw ? JSON.parse(contextRaw) : null;

            // 4. Generate full report (MongoDB payment check happens here)
            const fullRes = await fetch("/api/analyse/full", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageBase64,
                paymentId: response.razorpay_payment_id,
                context
              }),
            });

            if (!fullRes.ok) throw new Error("Failed to generate full report. Please contact support.");

            const reportData = await fullRes.json();
            if (reportData.error) throw new Error(reportData.error);

            // 5. Store and navigate
            localStorage.setItem(
              "glowscan_report",
              JSON.stringify({
                report: reportData,
                paymentId: response.razorpay_payment_id,
                timestamp: Date.now(),
              })
            );

            router.push("/result/full");
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "An unknown error occurred";
            console.error(err);
            toast.error("Generation Error", { description: message });
            setProcessing(false);
          }
        },
        modal: {
          ondismiss() {
            setLoading(false);
            toast.info("Payment cancelled");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        toast.error("Payment Failed", {
          description: response.error.description,
        });
        setLoading(false);
      });
      rzp.open();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      console.error("Payment flow error:", error);
      toast.error("Error", { description: message });
      setLoading(false);
    }
  };

  return (
    <>
      <ProcessingOverlay isOpen={processing} />
      
      <button
        onClick={handlePayment}
        disabled={loading || processing}
        className={className || "w-full h-12 bg-white text-black rounded-full font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            {label || (isDiscounted ? "Unlock Full Report — ₹29" : "Unlock Full Report — ₹49")}
          </>
        )}
      </button>
    </>
  );
}
