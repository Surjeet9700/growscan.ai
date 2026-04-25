// app/api/analyse/full/route.ts
// SECURITY: Requires a paymentId verified in MongoDB VerifiedPayment collection.
// A client cannot bypass this with an arbitrary string.
import { genAI } from "@/lib/gemini";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { dbConnect } from "@/lib/mongodb";
import VerifiedPayment from "@/models/VerifiedPayment";
import Scan from "@/models/Scan";
import type { FullReportResult } from "@/lib/types";
import { safeParseJSON } from "@/lib/responseParser";
import { FullAnalyseSchema } from "@/lib/schemas";
import { analyseWithOpenRouter } from "@/lib/openrouter";
import { formatScanContextForPrompt } from "@/lib/scan-context";
import crypto from "crypto";

export const maxDuration = 60;

const MODEL_PRIORITY = [
  "gemini-2.5-flash",      // best vision + reasoning for paid report
  "gemini-2.5-flash-lite", // faster fallback
  "gemini-2.0-flash",      // legacy final fallback
];

// ── Gemini native JSON schema ─────────────────────────────────────────────────
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    skin_type:        { type: "STRING", enum: ["oily","dry","combination","normal"] },
    skin_type_reason: { type: "STRING" },
    zonal_intelligence: {
      type: "OBJECT",
      properties: {
        forehead: {
          type: "OBJECT",
          properties: { score: { type: "INTEGER" }, observation: { type: "STRING" } },
          required: ["score","observation"],
        },
        cheeks: {
          type: "OBJECT",
          properties: { score: { type: "INTEGER" }, observation: { type: "STRING" } },
          required: ["score","observation"],
        },
        t_zone: {
          type: "OBJECT",
          properties: { score: { type: "INTEGER" }, observation: { type: "STRING" } },
          required: ["score","observation"],
        },
      },
      required: ["forehead","cheeks","t_zone"],
    },
    concerns: {
      type: "OBJECT",
      properties: {
        pigmentation:     { type: "STRING", enum: ["none","mild","moderate","significant"] },
        acne_or_breakouts:{ type: "STRING", enum: ["none","mild","moderate","significant"] },
        dark_circles:     { type: "STRING", enum: ["none","mild","moderate","significant"] },
        pores:            { type: "STRING", enum: ["tight","slightly enlarged","enlarged"] },
        texture:          { type: "STRING", enum: ["smooth","slightly uneven","uneven"] },
        hydration:        { type: "STRING", enum: ["well hydrated","slightly dehydrated","dehydrated"] },
        oiliness:         { type: "STRING", enum: ["low","moderate","high"] },
      },
      required: ["pigmentation","acne_or_breakouts","dark_circles","pores","texture","hydration","oiliness"],
    },
    fitzpatrick_scale: { type: "STRING", enum: ["Type I", "Type II", "Type III", "Type IV", "Type V", "Type VI"] },
    iga_acne_scale: { type: "STRING", enum: ["0 - Clear", "1 - Almost Clear", "2 - Mild", "3 - Moderate", "4 - Severe"] },
    skin_age_estimate: { type: "STRING" },
    dermal_indices: {
      type: "OBJECT",
      properties: {
        barrier_resistance:{ type: "INTEGER" },
        luminosity_index:  { type: "INTEGER" },
        clarity_score:     { type: "INTEGER" },
      },
      required: ["barrier_resistance","luminosity_index","clarity_score"],
    },
    strengths: { type: "ARRAY", items: { type: "STRING" } },
    priority_ingredients: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          ingredient:      { type: "STRING" },
          scientific_role: { type: "STRING" },
          reason:          { type: "STRING" },
        },
        required: ["ingredient","scientific_role","reason"],
      },
    },
    morning_routine_order: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          step:    { type: "STRING" },
          product: { type: "STRING" },
          purpose: { type: "STRING" },
        },
        required: ["step","product","purpose"],
      },
    },
    night_routine_order: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          step:    { type: "STRING" },
          product: { type: "STRING" },
          purpose: { type: "STRING" },
        },
        required: ["step","product","purpose"],
      },
    },
    lifestyle_tips: { type: "ARRAY", items: { type: "STRING" } },
    recheck_in_weeks: { type: "INTEGER" },
    summary: { type: "STRING" },
    error: { type: "STRING", nullable: true },
  },
  required: [
    "skin_type","skin_type_reason","zonal_intelligence","concerns",
    "fitzpatrick_scale", "iga_acne_scale",
    "skin_age_estimate","dermal_indices","strengths","priority_ingredients",
    "morning_routine_order","night_routine_order","lifestyle_tips",
    "recheck_in_weeks","summary",
  ],
} as const;

// ── Full dermatologist report prompt ──────────────────────────────────────────
// This is the PAID report — comprehensive, warm, specific, actionable.
const FULL_PROMPT = `You are a premium AI skin report engine for Indian users. Write like a highly competent dermatologist-led advisor: calm, specific, useful, and commercially polished without sounding salesy.

## Audience and Context
- Most users are in India and commonly Fitzpatrick III-V.
- Consider high UV, humidity, pollution, heat, indoor AC dehydration, and hard-water exposure as relevant context.
- PIH, tanning, oil imbalance, pore congestion, and barrier stress usually matter more than anti-ageing claims for this audience.

## Your Task
Generate a PAID full skin report from the visible face photo only.
Assess:
- skin type
- zonal condition across forehead, cheeks, and T-zone
- pigmentation visibility
- pore visibility and congestion
- dehydration and barrier stress
- dark circles and under-eye fatigue markers
- textural unevenness and visible ageing markers

## Report Standard
- This should feel premium and structured enough to justify a paid result.
- Stay visually grounded. If something cannot be seen clearly, keep the language conservative.
- Avoid diagnosis language unless the visual confidence is high.
- No brand names anywhere.

## Writing Rules
- Second-person voice only.
- Never use "I see", "I think", "maybe", "probably", or filler praise.
- Be warm and authoritative.
- summary should sound like a headline-quality expert readout.
- strengths should feel encouraging but credible.
- lifestyle_tips should be practical for Indian climate and routine realities.
- morning_routine_order and night_routine_order must be clearly sequenced and easy to follow.

## Clinical Scoring
- Zone scores are 0-100 where higher means healthier.
- Fitzpatrick and IGA should be reasonable for Indian users and visually supported.
- Do not overstate acne severity if only mild congestion is visible.

## Ingredient Naming Standards
Use only these canonical names when relevant:
Salicylic Acid | Vitamin C | Niacinamide | Retinol | Hyaluronic Acid | Glycolic Acid | Ceramides | Azelaic Acid | Kojic Acid | Centella Asiatica | Tranexamic Acid | Peptides | Zinc Oxide

## Output Quality
- Make the result feel premium, specific, and app-ready.
- Avoid repetitive phrasing between sections.
- Keep advice compatible with a mobile UI and quick reading.

## Error Handling
If the image is blurry, dark, heavily filtered, overexposed, or no clear face is visible:
Return error: "Image quality insufficient. Please retake in natural light, facing the camera directly." with null-like or empty-safe values for the rest.`;

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
    const body = await req.json();
    const validation = FullAnalyseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input parameters", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { imageBase64, paymentId, context } = validation.data;

    // 3. Build personalization context
    const userContext = formatScanContextForPrompt(context ?? null);

    const finalPrompt = userContext
      ? `${FULL_PROMPT}\n\n## Patient Context\n${userContext}`
      : FULL_PROMPT;

    // 4. Atomic payment consumption (prevents concurrent replay attacks)
    await dbConnect();
    const payment = await VerifiedPayment.findOneAndUpdate(
      { paymentId, userId, usedAt: null },
      { $set: { usedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!payment) {
      return NextResponse.json(
        { error: "Invalid payment, already used, or session expired." },
        { status: 402 }
      );
    }

    // 5. Generate with model fallback chain
    const imageData = {
      inlineData: {
        mimeType: "image/jpeg" as const,
        data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
      },
    };

    let data: FullReportResult | null = null;
    let modelUsed = "unknown";

    for (const modelName of MODEL_PRIORITY) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.2,
            topP: 0.85,
            maxOutputTokens: 8192, // Increased to prevent JSON truncation on long routines
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA as any,
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("MODEL_TIMEOUT")), 50000)
        );

        const result = await Promise.race([
          model.generateContent([finalPrompt, imageData]),
          timeoutPromise,
        ]) as any;

        const text = result.response.text();
        data = safeParseJSON<FullReportResult>(text);

        if (!data?.skin_type && !data?.error) {
          throw new Error("Model returned incomplete data");
        }

        modelUsed = modelName;
        break;

      } catch (err: any) {
        const msg = String(err?.message ?? "");
        
        console.warn(`[Gemini Full] ${modelName} failed (${msg}), trying next…`);
        continue;
      }
    }

    // 6. OpenRouter final fallback
    if (!data) {
      console.warn("[Full Analysis] All Gemini models exhausted. Trying OpenRouter…");
      try {
        const text = await analyseWithOpenRouter(finalPrompt, imageBase64);
        data = safeParseJSON<FullReportResult>(text);
        modelUsed = "openrouter-fallback";

        if (!data?.skin_type && !data?.error) {
          throw new Error("OpenRouter returned incomplete data");
        }
      } catch (orErr: any) {
        console.error("[OpenRouter Fallback] All models exhausted:", orErr.message);
        return NextResponse.json(
          { error: "AI engine is at capacity. Payment is NOT charged. Please try again shortly." },
          { status: 503 }
        );
      }
    }

    // 7. Attach response metadata
    const processingTimeMs = Date.now() - startTime;
    const enrichedData: FullReportResult = {
      ...data!,
      _meta: { request_id: requestId, processing_time_ms: processingTimeMs, model_used: modelUsed },
    };

    // 8. Persist the report and source image before returning so /result/full
    // can reliably load the latest record from MongoDB immediately.
    const savedScan = await Scan.create({
      userId,
      type: "full",
      result: {
        ...enrichedData,
        scan_image: imageBase64,
        scan_context: context ?? null,
        payment_id: paymentId,
      } as Record<string, unknown>,
    });

    return NextResponse.json({
      ...enrichedData,
      timestamp: savedScan.createdAt.getTime(),
      scanId: savedScan._id.toString(),
    });

  } catch (error) {
    console.error(`[Full analysis] [${requestId}] Unhandled error:`, error);
    return NextResponse.json(
      { error: "Could not complete full analysis. Payment NOT charged. Please contact support." },
      { status: 500 }
    );
  }
}
