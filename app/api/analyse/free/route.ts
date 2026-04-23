// app/api/analyse/free/route.ts
// Free tier skin scan — Gemini vision with model fallback chain + native responseSchema
import { genAI } from "@/lib/gemini";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { dbConnect } from "@/lib/mongodb";
import Scan from "@/models/Scan";
import type { FreeAnalysisResult } from "@/lib/types";
import { safeParseJSON } from "@/lib/responseParser";
import { FreeAnalyseSchema } from "@/lib/schemas";
import { analyseWithOpenRouter } from "@/lib/openrouter";
import crypto from "crypto";

export const maxDuration = 30;

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

// Best model first — fallback on 429/404
const MODEL_PRIORITY = [
  "gemini-2.5-flash",      // best vision + reasoning
  "gemini-2.5-flash-lite", // fastest, good for structured output
  "gemini-2.0-flash",      // legacy fallback
];

// ── Gemini native JSON schema (guaranteed valid output — no regex parsing needed) ─
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    skin_type:        { type: "STRING", enum: ["oily", "dry", "combination", "normal"] },
    skin_type_reason: { type: "STRING" },
    top_concern:      { type: "STRING" },
    glow_score:       { type: "INTEGER" },
    skin_age_estimate:{ type: "INTEGER" },
    primary_ingredient: { type: "STRING" },
    preview_insight:  { type: "STRING" },
    error: { type: "STRING", nullable: true },
  },
  required: [
    "skin_type","skin_type_reason","top_concern","glow_score",
    "preview_insight", "primary_ingredient"
  ],
} as const;

// ── Production-grade dermatologist prompt ──────────────────────────────────────
const SKIN_PROMPT = `You are a clinical AI dermatologist trained on hundreds of thousands of skin images. Your analysis is calibrated for South and Southeast Asian skin tones (Fitzpatrick III–V).

## Your Task
Produce a FREE tier skin preview. Focus ONLY on what is clearly visible. Do NOT hallucinate features hidden from view or assume based on demographics.

## South/Southeast Asian Skin Context
- Melanin-rich skin ages differently — PIH (post-inflammatory hyperpigmentation) is MORE common than textural scarring
- Oiliness patterns differ from Caucasian models — T-zone often oilier even in combination skin
- "Never aging" myth: melanin delays wrinkles but amplifies pigmentation concerns
- Hard water and pollution exposure make barrier damage common
- Niacinamide, azelaic acid, kojic acid, and Vitamin C are the gold-standard brighteners for this demographic

## CRITICAL Score Calibration
- glow_score 1–10: Most real-world users score 5–7. Reserve 9–10 for genuinely radiant skin. Only use 1–2 for severely problematic skin.

## FREE Tier Rules
- DIAGNOSTIC only — tell them WHAT you see, not HOW to fix it
- primary_ingredient: the single most-needed ingredient (this is the locked-away hook for the paid report)
- preview_insight: 1–2 sentences revealing ONE compelling observation that TEASES the full report. Must create urgency without giving away the solution.
- Never use "I", "we", "our" in output text
- Keep all strings under 150 characters except preview_insight (max 250 chars)

## Error Handling
If image is too blurry, poorly lit, or no face visible:
Set error to: "Image quality too low. Please retake in bright, natural light facing the camera." and return zeros for all scores.`;

// ── Fallback chain ─────────────────────────────────────────────────────────────
async function runWithFallback(
  imageBase64: string,
  userContext: string = ""
): Promise<{ data: FreeAnalysisResult; modelUsed: string }> {
  const finalPrompt = userContext
    ? `${SKIN_PROMPT}\n\n## Patient Context\n${userContext}`
    : SKIN_PROMPT;

  const imageData = {
    inlineData: {
      mimeType: "image/jpeg" as const,
      data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
    },
  };

  let lastError: unknown = null;

  for (const modelName of MODEL_PRIORITY) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.25,
          topP: 0.85,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA as any,
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("MODEL_TIMEOUT")), 25000)
      );

      const result = await Promise.race([
        model.generateContent([finalPrompt, imageData]),
        timeoutPromise,
      ]) as any;

      const text = result.response.text();
      const parsed = safeParseJSON<FreeAnalysisResult>(text);

      // Strict validation — reject if core fields missing
      if (!parsed?.skin_type) throw new Error("Incomplete response: missing skin_type");
      if (parsed.glow_score === undefined) throw new Error("Incomplete response: missing glow_score");

      return { data: parsed, modelUsed: modelName };

    } catch (err: any) {
      const status = err?.status ?? 0;
      const msg = String(err?.message ?? "");
      const isQuota = status === 429 || msg.includes("429") || msg.toLowerCase().includes("quota");
      
      console.warn(`[Gemini Free] ${modelName} failed (${msg}), trying next…`);
      lastError = err;
      continue;
    }
  }

  // ── FINAL FALLBACK: OpenRouter ────────────────────────────────────────────
  console.warn("[Free Analysis] All Gemini models exhausted. Trying OpenRouter…");
  try {
    const text = await analyseWithOpenRouter(finalPrompt, imageBase64);
    const parsed = safeParseJSON<FreeAnalysisResult>(text);

    if (parsed?.skin_type || parsed?.error) {
      return { data: parsed, modelUsed: "openrouter-fallback" };
    }
  } catch (orErr: any) {
    console.error("[OpenRouter Fallback] Failed:", orErr.message);
  }

  const quotaErr = new Error("QUOTA_EXCEEDED");
  (quotaErr as any).isQuota = true;
  throw quotaErr;
}

// ── Route Handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // 1. Auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate input
    const json = await req.json();
    const validation = FreeAnalyseSchema.safeParse(json);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { imageBase64, context } = validation.data;

    // 3. Build personalization context
    const userContext = context
      ? `Age Range: ${context.age ?? "unknown"}\nPrimary Concern: ${context.concern ?? "general"}\nWater Intake: ${context.habits ?? "unknown"}`
      : "";

    // 4. Rate limiting (fail-open if DB unreachable)
    let dbAvailable = false;
    try {
      await dbConnect();
      dbAvailable = true;

      const windowStart = new Date(Date.now() - RATE_WINDOW_MS);
      const recentCount = await Scan.countDocuments({
        userId,
        type: "free",
        createdAt: { $gte: windowStart },
      });

      if (recentCount >= RATE_LIMIT) {
        return NextResponse.json(
          { error: `You've used your ${RATE_LIMIT} free scans for this period. Please wait 10 minutes.` },
          { status: 429 }
        );
      }
    } catch (dbErr) {
      console.warn("[MongoDB] Rate limit check skipped — DB unavailable:", (dbErr as Error).message);
    }

    // 5. AI analysis with fallback chain
    let data: FreeAnalysisResult;
    let modelUsed = "unknown";
    try {
      const result = await runWithFallback(imageBase64, userContext);
      data = result.data;
      modelUsed = result.modelUsed;
    } catch (err: any) {
      if (err?.isQuota) {
        return NextResponse.json(
          { error: "AI engine is at capacity. Please try again in a few minutes." },
          { status: 503 }
        );
      }
      throw err;
    }

    // 6. Attach response metadata
    const processingTimeMs = Date.now() - startTime;
    const enrichedData: FreeAnalysisResult = {
      ...data,
      _meta: { request_id: requestId, processing_time_ms: processingTimeMs, model_used: modelUsed },
    };

    // 7. Save to DB fire-and-forget
    if (dbAvailable) {
      void Scan.create({
        userId,
        type: "free",
        result: enrichedData as unknown as Record<string, unknown>,
      }).catch((e: Error) => console.warn("[MongoDB] Scan save failed:", e.message));
    }

    return NextResponse.json(enrichedData);

  } catch (error) {
    console.error(`[Free analysis] [${requestId}] Unhandled error:`, error);
    return NextResponse.json(
      { error: "Could not analyse image. Please try a clearer photo in natural light." },
      { status: 422 }
    );
  }
}