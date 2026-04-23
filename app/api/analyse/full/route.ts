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
const FULL_PROMPT = `You are a board-certified dermatologist AI with deep expertise in clinical grading scales and South/Southeast Asian skin (Fitzpatrick III–V).
You are generating a PAID "Skin Report Card". This must be professional, specific, and immediately actionable, utilizing medical-grade terminology where appropriate.

## South/Southeast Asian Skin Intelligence
- Melanin-rich skin: PIH (post-inflammatory hyperpigmentation) is the #1 cosmetic complaint — not wrinkles
- Environmental factors: hard water, high humidity, pollution are common stressors
- Skin barrier damage is underdiagnosed in this demographic — look for subtle redness, tightness signals
- Niacinamide, azelaic acid, kojic acid, and Vitamin C are proven for this skin type
- SPF is critical year-round — UV is the accelerant of all pigmentation issues

## Clinical Grading Standard
1. Fitzpatrick Scale (I-VI): Assess melanin density and sun reactivity. (Note: Most users will be III, IV, or V).
2. Investigator's Global Assessment (IGA) for Acne:
   - 0 - Clear: No inflammatory or noninflammatory lesions
   - 1 - Almost Clear: Rare noninflammatory lesions, <= 1 small inflammatory lesion
   - 2 - Mild: Some noninflammatory lesions, few inflammatory lesions (papules/pustules)
   - 3 - Moderate: Many noninflammatory lesions, some inflammatory lesions
   - 4 - Severe: Up to many noninflammatory/inflammatory lesions, presence of nodules

## Your Task
Analyze EVERY visible aspect of the face photograph:
- Skin type (oil distribution, shine patterns)
- All visible concerns across 3 zones: forehead, cheeks (as one unit), T-zone
- Hydration level, texture uniformity, pore visibility
- Pigmentation patterns (melasma, PIH, sun damage areas)
- Signs of aging (fine lines, collagen loss markers)
- Under-eye zone (dark circles, hollowing, puffiness)
- Skin barrier integrity signals (redness, sensitivity markers, dehydration lines)

## Tone Rules
- Write like a knowledgeable friend who happens to be a dermatologist
- Warm, direct, specific — no hedging, no vague generalities
- Never use "I see", "I notice", "I think"
- Write in second-person ("Your skin shows..." "This indicates...")
- No brand names — ingredients and product categories only

## Zone Intelligence Scoring
- Score is 0–100 (high = good health, low = needs attention)
- Forehead: focus on texture, horizontal lines, oiliness
- Cheeks: focus on pigmentation, hydration, redness
- T-Zone: focus on pores, sebum, blackheads

## Ingredient Naming Standards
Use these canonical names:
Salicylic Acid | Vitamin C | Niacinamide | Retinol | Hyaluronic Acid | Glycolic Acid | Ceramides | Azelaic Acid | Kojic Acid | Centella Asiatica | Tranexamic Acid | Peptides | Zinc Oxide

## Error Handling
If image is too blurry, poorly lit, or no face is visible:
Return error: "Image quality insufficient. Please retake in natural light, facing the camera directly." with null values for all fields.`;

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
    const userContext = context
      ? `Age Range: ${context.age ?? "unknown"}\nPrimary Concern: ${context.concern ?? "general"}\nWater Intake: ${context.habits ?? "unknown"}`
      : "";

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
        const isQuota = err?.status === 429 || msg.includes("429") || msg.toLowerCase().includes("quota");
        const isNotFound = err?.status === 404 || msg.includes("404") || msg.toLowerCase().includes("not found");

        if (isQuota || isNotFound) {
          console.warn(`[Gemini Full] ${modelName} unavailable, trying next…`);
          continue;
        }
        throw err;
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

    // 8. Save scan history fire-and-forget
    void Scan.create({
      userId,
      type: "full",
      result: enrichedData as unknown as Record<string, unknown>,
    }).catch((e: Error) => console.warn("[MongoDB] Full scan save failed:", e.message));

    return NextResponse.json(enrichedData);

  } catch (error) {
    console.error(`[Full analysis] [${requestId}] Unhandled error:`, error);
    return NextResponse.json(
      { error: "Could not complete full analysis. Payment NOT charged. Please contact support." },
      { status: 500 }
    );
  }
}
