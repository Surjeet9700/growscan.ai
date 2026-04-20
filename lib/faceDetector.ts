// lib/faceDetector.ts
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let landmarker: FaceLandmarker | null = null;
let isInitializing = false;

/**
 * Initializes the MediaPipe Face Landmarker with a GPU-to-CPU fallback mechanism.
 */
async function initLandmarker() {
  if (landmarker) return landmarker;
  if (isInitializing) {
     // Wait for the existing initialization to finish
     while (isInitializing) {
       await new Promise(resolve => setTimeout(resolve, 100));
     }
     return landmarker;
  }

  isInitializing = true;
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );

    // Try GPU first
    try {
      landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "IMAGE",
        numFaces: 1,
      });
      console.log("MediaPipe FaceLandmarker loaded (GPU)");
    } catch (gpuError) {
      console.warn("GPU delegate failed, falling back to CPU", gpuError);
      landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "CPU",
        },
        runningMode: "IMAGE",
        numFaces: 1,
      });
      console.log("MediaPipe FaceLandmarker loaded (CPU)");
    }
  } catch (error) {
    console.error("Failed to initialize MediaPipe", error);
    throw error;
  } finally {
    isInitializing = false;
  }
  return landmarker;
}

/**
 * Detects face zone positions (percentages) from an image element.
 */
export async function detectZonePositions(imageElement: HTMLImageElement) {
  try {
    const detector = await initLandmarker();
    if (!detector) return null;

    const result = detector.detect(imageElement);

    if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
      console.warn("No face detected by MediaPipe");
      return null;
    }

    const lm = result.faceLandmarks[0];

    // Helper to average x/y of multiple landmark points
    const toPercent = (indices: number[]) => {
      const x = indices.reduce((sum, i) => sum + lm[i].x, 0) / indices.length;
      const y = indices.reduce((sum, i) => sum + lm[i].y, 0) / indices.length;
      return { x: x * 100, y: y * 100 };
    };

    // Calculate bespoke zone coordinates based on verified landmark indices
    return {
      forehead: toPercent([10]),                      // Center forehead
      nose:     toPercent([1, 2, 5]),                   // Nose tip cluster
      chin:     toPercent([152]),                       // Bottom of chin
      
      // Cheeks (using the mid-cheek clusters verified as "fleshier" points)
      // Mirroring/Front camera check: 
      // MediaPipe landmarks are anatomical (left is user's left).
      // We will handle mirroring in the UI if needed, but the data should be raw anatomical.
      left_cheek:  toPercent([116, 117, 118, 119, 120]), 
      right_cheek: toPercent([345, 346, 347, 348, 349]),
    };
  } catch (error) {
    console.error("Detection error:", error);
    return null;
  }
}

/**
 * Pre-load models early (e.g. on page mount)
 */
export async function preloadFaceDetector() {
  try {
    await initLandmarker();
  } catch (e) {
    // Silent fail for preload
  }
}
