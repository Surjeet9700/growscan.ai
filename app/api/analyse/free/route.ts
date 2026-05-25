// app/api/analyse/free/route.ts
// Free tier skin scan — delegates to lib/ai-engine for AI orchestration
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { dbConnect } from "@/lib/mongodb";
import Scan from "@/models/Scan";
import type { FreeAnalysisResult } from "@/lib/types";
import { FreeAnalyseSchema } from "@/lib/schemas";
import { formatScanContextForPrompt } from "@/lib/scan-context";
import { analyse, AiEngineException } from "@/lib/ai-engine";
import { notifyScanComplete } from "@/lib/notification-triggers";
import crypto from "crypto";

export const maxDuration = 30;

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

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
    root_causes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          cause: { type: "STRING" },
          likelihood: { type: "STRING", enum: ["high", "moderate", "low"] },
          explanation: { type: "STRING" },
          action: { type: "STRING" },
        },
        required: ["cause", "likelihood", "explanation", "action"],
      },
    },
    error: { type: "STRING", nullable: true },
  },
  required: [
    "skin_type","skin_type_reason","top_concern","glow_score",
    "preview_insight", "primary_ingredient", "root_causes"
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

## Root Cause Analysis
Analyze visible skin signs and identify 2-3 likely root causes. Consider these categories:
- **Hormonal**: Jawline/chin breakouts, cyclical patterns, oily T-zone
- **Diet-related**: Dairy/sugar-linked breakouts, inflammation, dullness
- **Stress-induced**: Forehead breakouts, tension areas, fatigue markers
- **Environmental**: Pollution damage, UV exposure, climate-related dehydration
- **Product-related**: Clogged pores from comedogenic products, irritation patterns
- **Barrier damage**: Over-exfoliation signs, sensitivity, tightness
- **Genetic predisposition**: Fitzpatrick type tendencies, pore size, sebum patterns

For each root cause, provide:
- cause: Short label (e.g. "Hormonal imbalance")
- likelihood: "high", "moderate", or "low" based on visible evidence
- explanation: One sentence connecting visible signs to this cause
- action: One specific, actionable step

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
    const userContext = formatScanContextForPrompt(context ?? null);
    const finalPrompt = userContext
      ? `${SKIN_PROMPT}\n\n## Patient Context\n${userContext}`
      : SKIN_PROMPT;

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

    // 5. AI analysis via deep module
    let data: FreeAnalysisResult;
    let modelUsed = "unknown";
    try {
      const result = await analyse<FreeAnalysisResult>({
        imageBase64,
        prompt: finalPrompt,
        schema: RESPONSE_SCHEMA as Record<string, unknown>,
        temperature: 0.25,
        maxTokens: 4096,
        timeoutMs: 25000,
        validate: (d) => {
          const parsed = d as FreeAnalysisResult;
          return !!parsed?.skin_type && parsed.glow_score !== undefined;
        },
      });
      data = result.data;
      modelUsed = result.modelUsed;
    } catch (err: unknown) {
      if (err instanceof AiEngineException && err.code === "QUOTA_EXCEEDED") {
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

    notifyScanComplete(userId).catch(() => {});

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
