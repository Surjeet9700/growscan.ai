"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Polyfill for the BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if the user is on iOS to show a manual install instruction if desired
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    const isTouchViewport = window.matchMedia("(max-width: 768px)").matches;

    setIsMobile(isTouchViewport || isIosDevice || isAndroidDevice);
    
    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
    }
    if (isAndroidDevice && !isStandalone) {
      setIsAndroid(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      // Clear prompt when app is installed
      setDeferredPrompt(null);
      setIsIOS(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const showPrompt = isMobile && (deferredPrompt !== null || isIOS || isAndroid) && !isDismissed;

  const getInstructions = () => {
    if (isIOS) return "Tap Share > Add to Home Screen";
    if (isAndroid && !deferredPrompt) return "Tap the 3 dots (⋮) > Install app";
    return "Get the app for a faster experience";
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 flex justify-center pointer-events-none"
        >
          <div className="bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 flex items-center justify-between gap-4 w-full max-w-[440px] pointer-events-auto border border-black/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#A377D2]/10 flex items-center justify-center shrink-0">
                <img src="/icon-192.png" alt="App Icon" className="w-6 h-6 rounded-md" />
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-bold text-[#1A1A1A] leading-tight">Install GlowScan</span>
                <span className="text-[12px] text-[#666666] leading-tight mt-0.5">
                  {getInstructions()}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!isIOS && deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="bg-[#A377D2] text-white text-[12px] font-bold px-4 py-2 rounded-full active:scale-95 transition-transform"
                >
                  Install
                </button>
              )}
              <button
                onClick={() => setIsDismissed(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 active:bg-black/10 transition-colors"
              >
                <X className="w-4 h-4 text-[#666666]" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
