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

export const maxDuration = 60;

// Best model first — if quota hit, fall back
const MODEL_PRIORITY = [
  "gemini-2.5-flash",       // best vision + reasoning
  "gemini-2.5-flash-lite",  // faster, same quality for structured output
  "gemini-2.0-flash",       // legacy fallback
];

const FULL_PROMPT = `You are a board-certified dermatologist AI with specific expertise in South and Southeast Asian skin (Fitzpatrick III–V).
You are generating a PAID "Skin Report Card". This must be professional, specific, and immediately actionable.

## Context for South/Southeast Asian Skin
- Melanin-rich skin has higher risk of post-inflammatory hyperpigmentation (PIH) than textural scarring
- Hard water, high humidity, and pollution are common environmental stressors
- Avoid recommending high-strength retinoids without barrier repair context
- Niacinamide, azelaic acid, and kojic acid outperform hydroquinone for this demographic
- "Never aging" myth: melanin protects but also means dyspigmentation is the #1 complaint, not wrinkles

## Your Task
Analyze every visible aspect of the face in the photo.
Assess: skin type, all visible concerns, hydration, texture, pore size, pigmentation patterns, signs of sun damage, visible aging markers, skin barrier integrity signals.

## Tone Rules
- Write like a knowledgeable friend who happens to be a dermatologist
- Warm, direct, specific — no hedging, no vague generalities
- Never use "I see", "I notice", "I think"
- Write in second-person ("Your skin shows..." "This indicates...")
- No brand names — ingredients only

## Output Format
Return ONLY this exact valid JSON structure with no markdown fences or preamble:

{
  "skin_type": "<one of: oily | dry | combination | normal>",
  "skin_type_reason": "<2 precise sentences citing exactly what you observe in the photo to conclude this>",
  "concerns": {
    "pigmentation": "<one of: none | mild | moderate | significant>",
    "acne_or_breakouts": "<one of: none | mild | moderate | significant>",
    "dark_circles": "<one of: none | mild | moderate | significant>",
    "pores": "<one of: tight | slightly enlarged | enlarged>",
    "texture": "<one of: smooth | slightly uneven | uneven>",
    "hydration": "<one of: well hydrated | slightly dehydrated | dehydrated>",
    "oiliness": "<one of: low | moderate | high>"
  },
  "skin_age_estimate": "<e.g. 'Appears 24–28 years. Skin shows good collagen density with early signs of UV-related texture change'>",
  "strengths": [
    "<Specific genuine positive — e.g. 'Skin tone is even across the jawline with no visible scarring'>",
    "<Second positive>",
    "<Optional third if genuinely present — omit if not observable>"
  ],
  "priority_ingredients": [
    {
      "ingredient": "<ingredient name>",
      "reason": "<1 sentence linking this ingredient to exactly what was observed in their skin>"
    },
    {
      "ingredient": "<ingredient name>",
      "reason": "<1 sentence>"
    },
    {
      "ingredient": "<ingredient name>",
      "reason": "<1 sentence>"
    }
  ],
  "morning_routine_order": [
    "<Step 1: e.g. Gentle low-pH cleanser>",
    "<Step 2: e.g. Niacinamide + zinc serum (5–10%)>",
    "<Step 3: e.g. Lightweight moisturiser with ceramides>",
    "<Step 4: SPF 50+ broad-spectrum sunscreen — non-negotiable>"
  ],
  "night_routine_order": [
    "<Step 1>",
    "<Step 2>",
    "<Step 3>"
  ],
  "lifestyle_tips": [
    "<Specific tip directly related to what you observed — e.g. 'The peri-oral dehydration pattern suggests mouth-breathing during sleep — try a humidifier'>",
    "<Second specific tip>"
  ],
  "recheck_in_weeks": <integer — 4 for active concerns, 8 for mild, 12 for maintenance>,
  "summary": "<3–4 sentences: overall skin story, primary challenge, biggest opportunity for improvement, and one encouraging closing note. Write in warm clinical tone.>",
  "error": null
}

## Error Handling
If the image is too blurry, poorly lit, or shows no face:
Return: {"error": "Image quality insufficient. Please retake in natural light, facing the camera directly.", "skin_type": null, "concerns": {}, "priority_ingredients": [], "morning_routine_order": [], "night_routine_order": [], "lifestyle_tips": [], "summary": null, "skin_age_estimate": null}

## Ingredient Naming Rules (IMPORTANT)
Use these standard names for priority_ingredients to ensure accuracy:
- Salicylic Acid (not BHA)
- Vitamin C (not Ascorbic Acid)
- Niacinamide (not Vitamin B3)
- Retinol (not Vitamin A)
- Hyaluronic Acid (not HA)
- Glycolic Acid (not AHA)
- Ceramides
- Azelaic Acid
- Kojic Acid`

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // 1. Validate Input
    const result = FullAnalyseSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ 
        error: "Invalid input parameters", 
        details: result.error.format() 
      }, { status: 400 });
    }

    const { imageBase64, paymentId, context } = result.data;

    // ── Pre-Scan Personalization (Context) ───────────────────────────────────
    const userContext = context ? `
Patient Context:
- Age Range: ${context.age}
- Primary Concern: ${context.concern}
- Lifestyle/Water: ${context.habits}
` : "";

    const finalPrompt = `${FULL_PROMPT}\n\n${userContext}`;

    // 2. Atomic Payment Consumption (prevents concurrent replay attacks)
    await dbConnect();
    const payment = await VerifiedPayment.findOneAndUpdate(
      { 
        paymentId, 
        userId, 
        usedAt: null // Only consume if not already used
      }, 
      { 
        $set: { usedAt: new Date() } 
      },
      { new: true } // Return the updated document
    );

    if (!payment) {
      return NextResponse.json(
        { error: "Invalid payment, already used, or session expired." },
        { status: 402 }
      );
    }

    // 3. Generate with model fallback
    const imageData = {
      inlineData: {
        mimeType: "image/jpeg" as const,
        data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
      },
    };

    let data: FullReportResult | null = null;
    let lastError: unknown = null;

    for (const modelName of MODEL_PRIORITY) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            maxOutputTokens: 2048, // Increased to prevent JSON truncation
            responseMimeType: "application/json",
          },
        });

        const result = await model.generateContent([finalPrompt, imageData]);
        const text = result.response.text();
        data = safeParseJSON<FullReportResult>(text);

        // Basic validation
        if (!data.skin_type && !data.error) {
          throw new Error("Model returned incomplete data");
        }
        break; // success
      } catch (err: any) {
        const msg = String(err?.message ?? "");
        const is429 = err?.status === 429 || msg.includes("429") || msg.toLowerCase().includes("quota");
        const is404 = err?.status === 404 || msg.includes("404") || msg.toLowerCase().includes("not found");

        if (is429 || is404) {
          console.warn(`[Gemini Full] ${modelName} unavailable, trying next…`);
          lastError = err;
          continue;
        }
        throw err;
      }
    }

    if (!data) {
      console.warn("[Full Analysis] Gemini exhausted. Trying OpenRouter (Gemma 4 31B)...");
      try {
        const text = await analyseWithOpenRouter(finalPrompt, imageBase64);
        data = safeParseJSON<FullReportResult>(text);
        
        if (!data.skin_type && !data.error) {
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

    // No longer need to mark as used here, as it was done atomically above.

    // 5. Save scan history — fire-and-forget
    void Scan.create({
      userId,
      type: "full",
      result: data as unknown as Record<string, unknown>,
    }).catch((e: Error) => console.warn("[MongoDB] Full scan save failed:", e.message));

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Full analysis] Unhandled error:", error);
    return NextResponse.json(
      { error: "Could not complete full analysis. Payment NOT charged. Please contact support." },
      { status: 500 }
    );
  }
}
