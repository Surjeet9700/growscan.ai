// lib/gemini.ts — Gemini client singleton, key guard moved inside module (not throw at import)
import { GoogleGenerativeAI } from "@google/generative-ai";

let _genAI: GoogleGenerativeAI | null = null;

export function getGenAI(): GoogleGenerativeAI {
  if (_genAI) return _genAI;

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local or your deployment environment."
    );
  }

  // In development, preserve instance across HMR
  if (process.env.NODE_ENV !== "production") {
    if (!(global as Record<string, unknown>).__genAI) {
      (global as Record<string, unknown>).__genAI = new GoogleGenerativeAI(key);
    }
    _genAI = (global as Record<string, unknown>).__genAI as GoogleGenerativeAI;
  } else {
    _genAI = new GoogleGenerativeAI(key);
  }

  return _genAI;
}

// Backward compat export — lazily initialized when first called from an API route
export const genAI = new Proxy({} as GoogleGenerativeAI, {
  get(_target, prop) {
    // Cast through unknown first to satisfy TS — GoogleGenerativeAI is not an index type
    return (getGenAI() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
