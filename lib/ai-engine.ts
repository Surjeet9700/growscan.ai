// lib/ai-engine.ts — Deep AI orchestrator module
// Single entry point for all AI skin analysis. Absorbs Gemini + OpenRouter
// initialization, model fallback chain, timeout racing, and response parsing.
//
// Interface: analyse<T>(req, deps?) → { data: T, modelUsed: string }
// Everything else is private implementation.

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { safeParseJSON } from "@/lib/responseParser";

// ── Error taxonomy ──────────────────────────────────────────────────────────

export type AiErrorCode =
  | "QUOTA_EXCEEDED"      // all models + fallback exhausted
  | "INVALID_IMAGE"       // model returned error field
  | "VALIDATION_FAILED"   // parsed OK but validate() rejected
  | "TIMEOUT"             // every model timed out
  | "ALL_MODELS_FAILED";  // non-quota failures across the board

export class AiEngineException extends Error {
  constructor(
    public readonly code: AiErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AiEngineException";
  }
}

// ── Port interfaces (what the module needs from the outside world) ──────────

export interface GeminiModelInstance {
  generateContent(parts: unknown[]): Promise<{ response: { text(): string } }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GeminiClient = any;

export interface OpenRouterClient {
  chat: {
    completions: {
      create(
        body: unknown,
        opts?: unknown,
      ): Promise<{ choices: Array<{ message: { content: string | null } }> }>;
    };
  };
}

// ── Request / Result ────────────────────────────────────────────────────────

export interface AnalyseRequest {
  imageBase64: string;
  prompt: string;
  schema: Record<string, unknown>; // Gemini native JSON schema format
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
  validate?: (data: unknown) => boolean;
}

export interface AnalyseResult<T> {
  data: T;
  modelUsed: string;
}

// ── Module config ───────────────────────────────────────────────────────────

const MODEL_PRIORITY = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
];

const OPENROUTER_MODEL = "google/gemma-4-31b-it:free";

const DEFAULT_TOP_P = 0.85;

// ── Lazy singleton factories (absorb gemini.ts + openrouter.ts) ─────────────

let _geminiClient: GoogleGenerativeAI | null = null;

export function getGenAI(): GoogleGenerativeAI {
  if (_geminiClient) return _geminiClient;

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local or your deployment environment.",
    );
  }

  if (process.env.NODE_ENV !== "production") {
    if (!(global as Record<string, unknown>).__genAI) {
      (global as Record<string, unknown>).__genAI = new GoogleGenerativeAI(key);
    }
    _geminiClient = (global as Record<string, unknown>).__genAI as GoogleGenerativeAI;
  } else {
    _geminiClient = new GoogleGenerativeAI(key);
  }

  return _geminiClient;
}

let _openrouterClient: OpenAI | null = null;

export function getOpenRouterClient(): OpenAI | null {
  if (_openrouterClient) return _openrouterClient;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[AI Engine] OPENROUTER_API_KEY not set — fallback disabled.");
    }
    return null;
  }

  _openrouterClient = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "GlowScan",
    },
  });

  return _openrouterClient;
}

// ── Backward compat: lazy Proxy exports (match existing gemini.ts API) ──────

export const genAI = new Proxy({} as GoogleGenerativeAI, {
  get(_target, prop) {
    return (getGenAI() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// ── Private helpers ─────────────────────────────────────────────────────────

function stripBase64Prefix(imageBase64: string): string {
  return imageBase64.replace(/^data:image\/\w+;base64,/, "");
}

function buildImageData(imageBase64: string) {
  return {
    inlineData: {
      mimeType: "image/jpeg" as const,
      data: stripBase64Prefix(imageBase64),
    },
  };
}

function isQuotaError(err: unknown): boolean {
  const status = (err as { status?: number })?.status ?? 0;
  const msg = String((err as { message?: string })?.message ?? "");
  return status === 429 || msg.includes("429") || msg.toLowerCase().includes("quota");
}

function classifyError(lastError: unknown): AiErrorCode {
  if (isQuotaError(lastError)) return "QUOTA_EXCEEDED";
  if (lastError instanceof Error && lastError.message === "MODEL_TIMEOUT") return "TIMEOUT";
  return "ALL_MODELS_FAILED";
}

// ── The single entry point ──────────────────────────────────────────────────

export async function analyse<T>(
  req: AnalyseRequest,
  deps?: { gemini?: GeminiClient; openrouter?: OpenRouterClient | null },
): Promise<AnalyseResult<T>> {
  const { imageBase64, prompt, schema, temperature, maxTokens, timeoutMs, validate } = req;

  const gemini: GeminiClient = deps?.gemini ?? getGenAI();
  const openrouter: OpenRouterClient | null = deps?.openrouter ?? getOpenRouterClient();

  const imageData = buildImageData(imageBase64);
  let lastError: unknown = null;

  // ── Gemini model loop ──────────────────────────────────────────────────
  for (const modelName of MODEL_PRIORITY) {
    try {
      const model = gemini.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature,
          topP: DEFAULT_TOP_P,
          maxOutputTokens: maxTokens,
          responseMimeType: "application/json",
          responseSchema: schema as any,
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("MODEL_TIMEOUT")), timeoutMs),
      );

      const result = await Promise.race([
        model.generateContent([prompt, imageData]),
        timeoutPromise,
      ]) as any;

      const text = result.response.text();
      const parsed = safeParseJSON<T>(text);

      if (validate && !validate(parsed)) {
        console.warn(`[AI Engine] ${modelName} returned data that failed validation, trying next…`);
        lastError = new Error("VALIDATION_FAILED");
        continue;
      }

      return { data: parsed, modelUsed: modelName };

    } catch (err: unknown) {
      console.warn(`[AI Engine] ${modelName} failed (${(err as Error)?.message}), trying next…`);
      lastError = err;
      continue;
    }
  }

  // ── OpenRouter fallback ────────────────────────────────────────────────
  if (openrouter) {
    console.warn("[AI Engine] All Gemini models exhausted. Trying OpenRouter…");
    try {
      const cleanBase64 = stripBase64Prefix(imageBase64);

      const response = await openrouter.chat.completions.create({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${cleanBase64}` },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        extra_body: { reasoning: { enabled: true } },
      } as any);

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("OpenRouter returned empty response");

      const parsed = safeParseJSON<T>(content);

      if (validate && !validate(parsed)) {
        console.warn("[AI Engine] OpenRouter returned data that failed validation");
        lastError = new Error("VALIDATION_FAILED");
      } else {
        return { data: parsed, modelUsed: "openrouter-fallback" };
      }

    } catch (orErr: unknown) {
      console.error("[AI Engine] OpenRouter fallback failed:", (orErr as Error)?.message);
      lastError = orErr;
    }
  }

  // ── All exhausted ──────────────────────────────────────────────────────
  throw new AiEngineException(
    classifyError(lastError),
    "All AI models exhausted",
    lastError,
  );
}
