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
const SKIN_PROMPT = `You are an AI skin analysis engine designed for public launch in India. Your tone should feel premium, precise, and trustworthy, while staying clinically conservative.

## Your Task
Generate a FREE skin preview from the face photo. Only report what is visually defensible from the image. Never invent hidden conditions, diagnoses, or medical certainty.

## India-first Context
- Indian users commonly present Fitzpatrick III-V skin.
- Prioritize visible pigmentation, tanning, post-acne marks, oil imbalance, dehydration, and barrier stress.
- Heat, humidity, strong UV exposure, hard water, and pollution are common real-world stressors.
- PIH is often more relevant than wrinkle depth in younger users.

## Calibration
- glow_score is 1-10 where most normal users should land between 5 and 7.
- Use 8 only when skin looks consistently clear, balanced, and bright.
- Use 9-10 rarely.
- Use 1-2 only for visibly severe, widespread issues.

## Output Style
- Write concise premium app copy, not a medical report.
- Never use "I", "we", "our", or exclamation marks.
- skin_type_reason should be one short sentence grounded in visible signs.
- top_concern should be a short label users instantly understand.
- primary_ingredient must be a single high-signal ingredient name only.
- preview_insight should feel valuable and specific, but should not give away the full paid routine.
- Keep each field under 140 characters except preview_insight, which can be up to 240 characters.

## Free-tier Product Rules
- The free result should create trust first, curiosity second.
- Mention one visible strength if the skin looks balanced.
- Do not prescribe a full routine.
- Do not mention products, brands, or purchase advice.

## Error Handling
If the image is blurry, too dark, overexposed, angled away, or no clear face is visible:
Set error to exactly "Image quality too low. Please retake in bright, natural light facing the camera." and return safe low-detail values.`;

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

    // 7. Persist the scan result, image, and questionnaire context so all clients
    // can render the latest free result without depending on localStorage.
    if (!dbAvailable) {
      return NextResponse.json(
        { error: "Scan completed, but storage is temporarily unavailable. Please try again shortly." },
        { status: 503 }
      );
    }

    const savedScan = await Scan.create({
      userId,
      type: "free",
      result: {
        ...enrichedData,
        scan_image: imageBase64,
        scan_context: context ?? null,
      } as Record<string, unknown>,
    });

    return NextResponse.json({
      ...enrichedData,
      timestamp: savedScan.createdAt.getTime(),
      scanId: savedScan._id.toString(),
    });

  } catch (error) {
    console.error(`[Free analysis] [${requestId}] Unhandled error:`, error);
    return NextResponse.json(
      { error: "Could not analyse image. Please try a clearer photo in natural light." },
      { status: 422 }
    );
  }
}
