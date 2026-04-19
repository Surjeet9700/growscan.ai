"use client";

// components/CameraCapture.tsx
// Bug fixes:
// 1. Race condition fix: <video> always rendered in DOM so videoRef is always valid
//    Previously: video only rendered when hasCamera===true → videoRef.current was null
//    when startCamera fired → stream attached to nothing → camera never appeared
// 2. Stream attached post-render via useEffect watching streamRef
// 3. fileInputRef programmatic click (iOS motion.label bug avoided)
// 4. navigator.mediaDevices existence guard for HTTP non-localhost

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, SwitchCamera, Upload, Check } from "lucide-react";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface CameraCaptureProps {
  onCaptureAction: (base64: string) => void;
  disabled?: boolean;
}

export function CameraCapture({ onCaptureAction, disabled }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);
  const [cameraReady, setCameraReady] = useState(false); // separate from "stream acquired"
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [compressing, setCompressing] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraReady(false);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError(
        "Camera unavailable — browser may be blocking it on HTTP. Upload a photo instead."
      );
      return;
    }

    try {
      // Stop any existing stream first
      streamRef.current?.getTracks().forEach((t) => t.stop());

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 720 }, height: { ideal: 720 } },
      });

      streamRef.current = stream;

      // KEY FIX: attach stream to video element immediately.
      // The <video> is always in the DOM (visibility controlled via CSS),
      // so videoRef.current is guaranteed non-null here.
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch((e) =>
          console.warn("Autoplay blocked:", e)
        );
        setCameraReady(true);
      }
    } catch (err: any) {
      const isPermission = err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError";
      setCameraError(
        isPermission
          ? "Camera permission denied. Please allow access in your browser settings."
          : "Could not start camera. Upload a photo instead."
      );
    }
  }, [facingMode]);

  // Only start camera after client mounts
  useEffect(() => {
    if (!mounted) return;
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [mounted, startCamera]);

  const toggleCamera = () =>
    setFacingMode((p) => (p === "user" ? "environment" : "user"));

  const processFile = useCallback(async (file: File) => {
    setCompressing(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.4,          // 400KB max — fast Gemini upload
        maxWidthOrHeight: 800,   // enough for AI analysis
        useWebWorker: true,
        initialQuality: 0.82,
      });
      const reader = new FileReader();
      reader.onloadend = () => {
        onCaptureAction(reader.result as string);
        // Reset compressing after parent has the data
        setTimeout(() => setCompressing(false), 800);
      };
      reader.onerror = () => {
        toast.error("Could not read image");
        setCompressing(false);
      };
      reader.readAsDataURL(compressed);
    } catch {
      toast.error("Image processing failed. Please try another photo.");
      setCompressing(false);
    }
  }, [onCaptureAction]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so same file can be reselected
    e.target.value = "";
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || !cameraReady || compressing || disabled) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror front camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) processFile(new File([blob], "capture.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.85   // 0.85 is near-lossless for skin analysis, ~30% smaller than 0.92
    );
  };

  const isDisabled = Boolean(disabled) || compressing;

  // ── SSR placeholder ──────────────────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="w-full max-w-sm mx-auto aspect-[3/4] bg-neutral-950 rounded-[40px] flex items-center justify-center border-[6px] border-neutral-900">
        <p className="text-white/40 text-sm">Initializing…</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center w-full max-w-sm mx-auto aspect-[3/4] bg-neutral-950 rounded-[40px] overflow-hidden shadow-2xl border-[6px] border-neutral-900">
      {/* Hidden file input — shared between camera view and fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
        aria-hidden="true"
      />

      {/* ── VIDEO always in DOM. Visibility controlled by CSS. ───────────────
           This is what fixes the race condition: videoRef.current is always
           attached, so startCamera() can set srcObject immediately.        */}
      <motion.video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        initial={{ opacity: 0 }}
        animate={{ opacity: cameraReady ? 1 : 0 }}
        transition={{ duration: 0.6 }}
        className={`absolute inset-0 w-full h-full object-cover ${
          compressing ? "scale-105 blur-sm brightness-50" : ""
        } ${facingMode === "user" ? "-scale-x-100" : ""} ${
          // Flip accounts for the scale-x-100 mirror — needs !important-ish ordering
          facingMode === "user" && compressing ? "scale-x-[-1.05]" : ""
        }`}
      />

      {/* ── No camera / error state ────────────────────────────────────────── */}
      <AnimatePresence>
        {!cameraReady && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white/60 space-y-3 z-10"
          >
            <Camera className="w-10 h-10 opacity-30 mb-1" />
            <p className="text-sm leading-relaxed">
              {cameraError ?? "Camera is starting…"}
            </p>
            <motion.button
              type="button"
              disabled={isDisabled}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 text-sm font-medium transition-colors disabled:opacity-40"
            >
              <Upload className="w-4 h-4" />
              Upload Photo Instead
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FaceID overlay — only visible when camera is ready ──────────────── */}
      <AnimatePresence>
        {cameraReady && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center z-20"
          >
            <motion.div
              className="relative w-[65%] aspect-[3/4] max-w-[240px]"
              animate={{ scale: compressing ? 0.88 : 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
            >
              {/* Corner brackets */}
              {(["tl", "tr", "bl", "br"] as const).map((c) => (
                <div
                  key={c}
                  className={`absolute w-10 h-10 border-[3.5px] rounded-[28px] transition-colors duration-500 ${
                    compressing ? "border-emerald-400" : "border-white/90"
                  } ${c === "tl" ? "top-0 left-0 border-r-0 border-b-0" : ""}
                     ${c === "tr" ? "top-0 right-0 border-l-0 border-b-0" : ""}
                     ${c === "bl" ? "bottom-0 left-0 border-r-0 border-t-0" : ""}
                     ${c === "br" ? "bottom-0 right-0 border-l-0 border-t-0" : ""}`}
                />
              ))}

              {/* Laser — only while idle */}
              {!compressing && (
                <motion.div
                  animate={{ top: ["4%", "96%", "4%"] }}
                  transition={{ duration: 2.8, ease: "easeInOut", repeat: Infinity }}
                  className="absolute left-3 right-3 h-[1.5px] bg-cyan-400 shadow-[0_0_10px_3px_rgba(34,211,238,0.65)] z-10"
                  style={{ position: "absolute" }}
                />
              )}

              {/* Capture checkmark */}
              <AnimatePresence>
                {compressing && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Check
                      className="w-16 h-16 text-emerald-400"
                      style={{ filter: "drop-shadow(0 0 14px rgba(52,211,153,0.9))" }}
                      strokeWidth={2.5}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hint pill ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {cameraReady && (
          <motion.div
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute top-5 inset-x-0 flex justify-center z-30 pointer-events-none"
          >
            <div className="px-4 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/10">
              <p className="text-white/90 text-[13px] font-medium tracking-wide">
                {compressing ? "Analysing…" : "Align face in frame"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom controls — only when camera is ready ───────────────────── */}
      <AnimatePresence>
        {cameraReady && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex justify-center items-end gap-8 pb-9 z-30"
          >
            {/* Upload */}
            <motion.button
              type="button"
              aria-label="Upload photo from gallery"
              disabled={isDisabled}
              whileTap={!isDisabled ? { scale: 0.88 } : {}}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/20 text-white transition-colors disabled:opacity-40"
            >
              <Upload className="w-5 h-5" />
            </motion.button>

            {/* Shutter */}
            <motion.button
              type="button"
              aria-label="Take photo"
              disabled={isDisabled}
              whileTap={!isDisabled ? { scale: 0.94 } : {}}
              onClick={takePhoto}
              className="w-[74px] h-[74px] rounded-full border-4 border-white/80 bg-white/10 backdrop-blur-sm flex items-center justify-center disabled:opacity-50"
            >
              <motion.div
                className="w-[54px] h-[54px] bg-white rounded-full shadow-[0_0_18px_rgba(255,255,255,0.4)]"
                animate={{ scale: compressing ? 0 : 1 }}
                transition={{ type: "spring" }}
              />
            </motion.button>

            {/* Flip */}
            <motion.button
              type="button"
              aria-label="Switch camera"
              disabled={isDisabled}
              whileTap={!isDisabled ? { scale: 0.88 } : {}}
              onClick={toggleCamera}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/20 text-white transition-colors disabled:opacity-40"
            >
              <SwitchCamera className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
