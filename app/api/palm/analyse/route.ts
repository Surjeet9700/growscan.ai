// app/api/palm/analyse/route.ts
// Palm reading analysis using Gemini vision — returns JSON with line coordinates
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { dbConnect } from "@/lib/mongodb";
import Scan from "@/models/Scan";
import type { PalmReadingResult } from "@/lib/palm-types";
import { PalmAnalyseSchema } from "@/lib/schemas";
import { analyse, AiEngineException } from "@/lib/ai-engine";
import crypto from "crypto";

export const maxDuration = 30;

const PALM_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    scores: {
      type: "OBJECT",
      properties: {
        emotional_strength: { type: "INTEGER" },
        intellectual_drive: { type: "INTEGER" },
        vitality: { type: "INTEGER" },
      },
      required: ["emotional_strength", "intellectual_drive", "vitality"],
    },
    lines: {
      type: "OBJECT",
      properties: {
        heart_line: {
          type: "OBJECT",
          properties: {
            reading: { type: "STRING" },
            coordinates: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  x: { type: "NUMBER" },
                  y: { type: "NUMBER" },
                },
                required: ["x", "y"],
              },
            },
          },
          required: ["reading", "coordinates"],
        },
        head_line: {
          type: "OBJECT",
          properties: {
            reading: { type: "STRING" },
            coordinates: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  x: { type: "NUMBER" },
                  y: { type: "NUMBER" },
                },
                required: ["x", "y"],
              },
            },
          },
          required: ["reading", "coordinates"],
        },
        life_line: {
          type: "OBJECT",
          properties: {
            reading: { type: "STRING" },
            coordinates: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  x: { type: "NUMBER" },
                  y: { type: "NUMBER" },
                },
                required: ["x", "y"],
              },
            },
          },
          required: ["reading", "coordinates"],
        },
        fate_line: {
          type: "OBJECT",
          properties: {
            reading: { type: "STRING" },
            coordinates: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  x: { type: "NUMBER" },
                  y: { type: "NUMBER" },
                },
                required: ["x", "y"],
              },
            },
          },
          required: ["reading", "coordinates"],
        },
      },
      required: ["heart_line", "head_line", "life_line", "fate_line"],
    },
    hidden_trait: { type: "STRING" },
    disclaimer: { type: "STRING" },
    error: { type: "STRING", nullable: true },
  },
  required: ["summary", "scores", "lines", "hidden_trait", "disclaimer"],
} as const;

const PALM_PROMPT = `You are an expert, mystical, yet highly analytical AI Palmist. Analyze the provided image of a human palm. Identify the general location of the Heart, Head, Life, and Fate lines. Return ONLY a valid JSON object. Do not use markdown or conversational text.

For each line, provide a short 'reading' string, and an array of 3 to 4 relative coordinate points (x, y as percentages from 0 to 100) that approximate the path of that line on the image.

## Line Identification Guide
- **Heart Line**: Runs horizontally across the top of the palm, below the fingers. Reflects emotional nature and relationships.
- **Head Line**: Runs horizontally across the middle of the palm. Reflects intellect, communication style, and thinking patterns.
- **Life Line**: Curves around the base of the thumb. Reflects vitality, life changes, and physical health.
- **Fate Line**: Runs vertically from the base of the palm toward the middle finger. Reflects career path, destiny, and external influences.

## Reading Style
- Write concise, mystical but grounded readings (2-3 sentences per line).
- Use second-person voice ("Your heart line reveals...").
- Be specific and evocative, not generic.
- Each reading should feel personal and insightful.

## Scoring Guidelines
- emotional_strength (0-100): Based on heart line clarity, depth, and curvature
- intellectual_drive (0-100): Based on head line length, straightness, and definition
- vitality (0-100): Based on life line depth, curvature, and length

## Hidden Trait
Identify one surprising or hidden spiritual pattern, latent talent, or breakthrough potential visible in the palm. This should feel like a "secret discovery" that makes the user want to share.

## Error Handling
If the image does not clearly show a palm, is too dark, blurry, or unclear:
Set error to "Please retake the photo. Ensure your palm is open, flat, and well-lit facing the camera." and return safe default values.`;

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const validation = PalmAnalyseSchema.safeParse(json);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { imageBase64 } = validation.data;

    let data: PalmReadingResult;
    let modelUsed = "unknown";

    try {
      const result = await analyse<PalmReadingResult>({
        imageBase64,
        prompt: PALM_PROMPT,
        schema: PALM_RESPONSE_SCHEMA as Record<string, unknown>,
        temperature: 0.3,
        maxTokens: 4096,
        timeoutMs: 30000,
        validate: (d) => {
          const parsed = d as PalmReadingResult;
          return !!parsed?.summary && !!parsed?.lines?.heart_line;
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

    const processingTimeMs = Date.now() - startTime;
    const enrichedData: PalmReadingResult = {
      ...data,
      _meta: { request_id: requestId, processing_time_ms: processingTimeMs, model_used: modelUsed },
    };

    await dbConnect();
    const savedScan = await Scan.create({
      userId,
      type: "palm",
      result: {
        ...enrichedData,
        palm_image: imageBase64,
      } as Record<string, unknown>,
    });

    return NextResponse.json({
      ...enrichedData,
      timestamp: savedScan.createdAt.getTime(),
      scanId: savedScan._id.toString(),
    });

  } catch (error) {
    console.error(`[Palm analysis] [${requestId}] Unhandled error:`, error);
    return NextResponse.json(
      { error: "Could not analyse palm. Please try a clearer photo in natural light." },
      { status: 422 }
    );
  }
}
