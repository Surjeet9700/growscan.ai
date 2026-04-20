// app/api/analyse/free/route.ts
// Free tier skin scan — Gemini vision with model fallback chain
import { genAI } from "@/lib/gemini";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { dbConnect } from "@/lib/mongodb";
import Scan from "@/models/Scan";
import type { FreeAnalysisResult } from "@/lib/types";
import { safeParseJSON } from "@/lib/responseParser";
import { FreeAnalyseSchema } from "@/lib/schemas";
import { analyseWithOpenRouter } from "@/lib/openrouter";

// NOTE: Cannot use Edge runtime here due to Mongoose (Node.js-only)
// maxDuration keeps the serverless fn warm enough for analysis
export const maxDuration = 30; // 30s max (was default 10s on Vercel hobby)

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

// Ordered by quality + availability. gemini-2.5-flash-lite is fastest on free tier.
// gemini-2.0-flash is kept first as it may still work if daily quota resets.
const MODEL_PRIORITY = [
  "gemini-2.5-flash-lite",   // fastest, best free tier availability
  "gemini-2.5-flash",        // better quality, slightly higher quota cost
  "gemini-2.0-flash",        // legacy — may 429 but worth trying
];

// ─── Premium Dermatologist-Grade Prompt ─────────────────────────────────────
// Designed to extract maximum signal from a single selfie.
// Structured to produce a specific, actionable free preview that
// creates urgency for the paid full report.
const SKIN_PROMPT = `You are an expert AI dermatologist trained to analyze skin from photographs with clinical precision.
Analyze the selfie provided. Focus ONLY on what is clearly visible — do not hallucinate or guess features hidden from view.

## Your Task
Produce a structured skin assessment for the FREE preview tier. This must be:
- Diagnostic (tell them WHAT is wrong) rather than Prescriptive (telling them HOW to fix it).
- Highly specific (mention actual observations, not generic statements)
- Written for South/Southeast Asian skin tones (Fitzpatrick III–V) — these have different pigmentation patterns, acne tendencies, and aging markers than Caucasian skin

## Output Format
Respond ONLY in this valid JSON structure — no markdown fences, no preamble:

{
  "skin_type": "<one of: oily | dry | combination | normal>",
  "skin_type_reason": "<1 precise sentence citing what you actually see>",
  "top_concern": "<The single most impactful visible issue — be specific>",
  "glow_score": <integer 1-10>,
  "skin_age_estimate": <integer — be honest but conservative, +/- 2 years of apparent visual age>,
  "primary_ingredient": "<the single most needed ingredient name — e.g. Vitamin C>",
  "preview_insight": "<1-2 sentences revealing ONE compelling but incomplete observation>",
  "face_zones": [
    { "zone": "forehead", "issue": "<3-8 word description>", "severity": "<none|mild|moderate|severe>" },
    { "zone": "left_cheek", "issue": "<3-8 word description>", "severity": "<none|mild|moderate|severe>" },
    { "zone": "right_cheek", "issue": "<3-8 word description>", "severity": "<none|mild|moderate|severe>" },
    { "zone": "nose", "issue": "<3-8 word description>", "severity": "<none|mild|moderate|severe>" },
    { "zone": "chin", "issue": "<3-8 word description>", "severity": "<none|mild|moderate|severe>" }
  ],
  "skin_tips": [
    { "tip": "<1 diagnostic tip 8-20 words describing the type of care needed WITHOUT naming specific ingredients>", "urgency": "daily" },
    { "tip": "<1 diagnostic tip for weekly treatment category>", "urgency": "weekly" },
    { "tip": "<1 lifestyle change that improves skin health>", "urgency": "lifestyle" }
  ],
  "error": null
}

## Rules
- If the image is too blurry, poorly lit, or no face is visible: return {"error": "Image quality too low. Please retake in natural light facing the camera.", ...rest null/0}
- glow_score: 1 = very dull/problematic, 5 = average, 8+ = genuinely healthy and radiant — be honest, most people score 4-7
- preview_insight must tease the full report without giving away the routine or ingredient recommendations
- Never use the words "I", "we", "our" — write in third-person clinical tone
- face_zones: include ALL 5 zones. If a zone looks healthy, set severity to "none" and issue to "clear"
- skin_tips: provide exactly 3 tips, one for each urgency level (daily, weekly, lifestyle)
- Keep all strings under 120 characters except preview_insight (max 220 chars)

## Ingredient Naming Rules (FOR FREE TIER ONLY)
- DO NOT mention specific ingredient names (Vitamin C, Retinol, etc.) in the skin_tips. Use general categories like "brightening serum", "exfoliating treatment", "repairing cream".
- ONLY use the specific name in the primary_ingredient field (this creates the lock-out effect).
- The top_concern should focus on the *condition* (e.g. "Hyper-pigmentation" or "Active Breakouts").`;

async function runWithFallback(
  imageBase64: string,
  userContext: string = ""
): Promise<FreeAnalysisResult> {
  const finalPrompt = `${SKIN_PROMPT}\n\n${userContext}`;

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
          temperature: 0.3,
          topP: 0.8,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
        },
      });

      const result = await model.generateContent([finalPrompt, imageData]);
      const text = result.response.text();
      const parsed = safeParseJSON<FreeAnalysisResult>(text);

      // Validate critical fields
      if (!parsed || !parsed.skin_type || parsed.glow_score === undefined) {
        throw new Error("Incomplete response from model");
      }

      return parsed;
    } catch (err: any) {
      const status = err?.status ?? 0;
      const msg = String(err?.message ?? "");
      const is429 = status === 429 || msg.includes("429") || msg.toLowerCase().includes("quota");
      const is404 = status === 404 || msg.includes("404") || msg.toLowerCase().includes("not found");

      if (is429 || is404) {
        console.warn(`[Gemini] Model ${modelName} unavailable (${is429 ? "quota" : "not found"}), trying next…`);
        lastError = err;
        continue;
      }
      // Any other error (image invalid, JSON parse fail, etc.) — surface immediately
      throw err;
    }
  }

  // ─── FINAL FALLBACK: OpenRouter (Gemma 4 31B) ───
  try {
    console.warn("[Free Analysis] All Gemini models exhausted. Trying OpenRouter (Gemma 4 31B)...");
    const text = await analyseWithOpenRouter(finalPrompt, imageBase64);
    const parsed = safeParseJSON<FreeAnalysisResult>(text);
    
    if (parsed && (parsed.skin_type || parsed.error)) {
      return parsed;
    }
  } catch (orErr: any) {
    console.error("[OpenRouter Fallback] Failed:", orErr.message);
  }

  const quotaErr = new Error("QUOTA_EXCEEDED");
  (quotaErr as any).isQuota = true;
  throw quotaErr;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    
    // 1. Validate Input
    const result = FreeAnalyseSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json({ 
        error: "Invalid image data provided", 
        details: result.error.format() 
      }, { status: 400 });
    }

    const { imageBase64, context } = result.data;
    // We already checked startsWith("data:image") in the Zod schema

    // ── Pre-Scan Personalization (Context) ───────────────────────────────────
    const userContext = context ? `
Patient Context:
- Age Range: ${context.age}
- Primary Concern: ${context.concern}
- Lifestyle/Water: ${context.habits}
` : "";

    // 2. Rate limiting — fail open so analysis works even if DB is unreachable
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
          { error: "You've used your 5 free scans for this period. Please wait 10 minutes." },
          { status: 429 }
        );
      }
    } catch (dbErr) {
      console.warn("[MongoDB] Unavailable — skipping rate limit:", (dbErr as Error).message);
    }

    // 3. Gemini analysis with model fallback
    let data: FreeAnalysisResult;
    try {
      data = await runWithFallback(imageBase64, userContext);
    } catch (err: any) {
      if (err?.isQuota) {
        return NextResponse.json(
          { error: "AI engine is at capacity. Please try again in a few minutes." },
          { status: 503 }
        );
      }
      throw err;
    }

    // 4. Save scan fire-and-forget — don't block the response
    if (dbAvailable) {
      void Scan.create({
        userId,
        type: "free",
        result: data as unknown as Record<string, unknown>,
      }).catch((e: Error) => console.warn("[MongoDB] Scan save failed:", e.message));
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("[Free analysis] Unhandled error:", error);
    return NextResponse.json(
      { error: "Could not analyse image. Please try a clearer photo in natural light." },
      { status: 422 }
    );
  }
}