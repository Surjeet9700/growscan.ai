import { describe, it, expect } from "vitest";
import {
  analyse,
  AiEngineException,
  type GeminiClient,
  type OpenRouterClient,
  type AnalyseRequest,
} from "@/lib/ai-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function mockGemini(response: string | Error): GeminiClient {
  return {
    getGenerativeModel: () => ({
      generateContent: response instanceof Error
        ? () => Promise.reject(response)
        : () => Promise.resolve({ response: { text: () => response } }),
    }),
  };
}

function mockOpenRouter(response: string | Error | null): OpenRouterClient | null {
  if (response === null) return null;
  return {
    chat: {
      completions: {
        create: response instanceof Error
          ? () => Promise.reject(response)
          : () => Promise.resolve({ choices: [{ message: { content: response } }] }),
      },
    },
  };
}

const BASE_REQ: AnalyseRequest = {
  imageBase64: "data:image/jpeg;base64,/9j/abc123",
  prompt: "test prompt",
  schema: { type: "OBJECT", properties: { skin_type: { type: "STRING" } }, required: ["skin_type"] },
  temperature: 0.25,
  maxTokens: 4096,
  timeoutMs: 5000,
};

// ── Tests ───────────────────────────────────────────────────────────────────

describe("analyse()", () => {
  it("returns data from first successful Gemini model", async () => {
    const gemini = mockGemini(JSON.stringify({ skin_type: "oily", glow_score: 6 }));
    const result = await analyse(BASE_REQ, { gemini, openrouter: null });

    expect(result.data).toEqual({ skin_type: "oily", glow_score: 6 });
    expect(result.modelUsed).toBe("gemini-2.5-flash");
  });

  it("falls through to second model on first model error", async () => {
    let callCount = 0;
    const gemini: GeminiClient = {
      getGenerativeModel: (config) => ({
        generateContent: () => {
          callCount++;
          if (config.model === "gemini-2.5-flash") {
            return Promise.reject(new Error("429 quota exceeded"));
          }
          return Promise.resolve({
            response: { text: () => JSON.stringify({ skin_type: "dry" }) },
          });
        },
      }),
    };

    const result = await analyse(BASE_REQ, { gemini, openrouter: null });
    expect(result.modelUsed).toBe("gemini-2.5-flash-lite");
    expect(callCount).toBe(2);
  });

  it("falls back to OpenRouter when all Gemini models fail", async () => {
    const gemini = mockGemini(new Error("429 quota exceeded"));
    const openrouter = mockOpenRouter(JSON.stringify({ skin_type: "normal" }));

    const result = await analyse(BASE_REQ, { gemini, openrouter });
    expect(result.modelUsed).toBe("openrouter-fallback");
    expect(result.data).toEqual({ skin_type: "normal" });
  });

  it("throws QUOTA_EXCEEDED when all providers fail with quota errors", async () => {
    const gemini = mockGemini(new Error("429 rate limit"));
    const openrouter = mockOpenRouter(new Error("429 quota"));

    await expect(analyse(BASE_REQ, { gemini, openrouter })).rejects.toThrow(AiEngineException);
    await expect(analyse(BASE_REQ, { gemini, openrouter })).rejects.toMatchObject({
      code: "QUOTA_EXCEEDED",
    });
  });

  it("throws ALL_MODELS_FAILED when all providers fail with non-quota errors", async () => {
    const gemini = mockGemini(new Error("internal server error"));
    const openrouter = mockOpenRouter(new Error("connection refused"));

    await expect(analyse(BASE_REQ, { gemini, openrouter })).rejects.toMatchObject({
      code: "ALL_MODELS_FAILED",
    });
  });

  it("skips OpenRouter when openrouter is null", async () => {
    const gemini = mockGemini(new Error("429"));

    await expect(analyse(BASE_REQ, { gemini, openrouter: null })).rejects.toMatchObject({
      code: "QUOTA_EXCEEDED",
    });
  });

  it("falls through on validate() rejection and tries next model", async () => {
    let callCount = 0;
    const gemini: GeminiClient = {
      getGenerativeModel: (config) => ({
        generateContent: () => {
          callCount++;
          if (config.model === "gemini-2.5-flash") {
            // Returns data missing skin_type — will fail validation
            return Promise.resolve({
              response: { text: () => JSON.stringify({ wrong: "shape" }) },
            });
          }
          return Promise.resolve({
            response: { text: () => JSON.stringify({ skin_type: "combination" }) },
          });
        },
      }),
    };

    const result = await analyse(
      { ...BASE_REQ, validate: (d: any) => !!d?.skin_type },
      { gemini, openrouter: null },
    );

    expect(result.modelUsed).toBe("gemini-2.5-flash-lite");
    expect(callCount).toBe(2);
  });

  it("strips data:image prefix from base64 before passing to Gemini", async () => {
    let receivedParts: unknown[] = [];
    const gemini: GeminiClient = {
      getGenerativeModel: () => ({
        generateContent: (parts: unknown[]) => {
          receivedParts = parts;
          return Promise.resolve({
            response: { text: () => JSON.stringify({ skin_type: "oily" }) },
          });
        },
      }),
    };

    await analyse(
      { ...BASE_REQ, imageBase64: "data:image/jpeg;base64,abc123" },
      { gemini, openrouter: null },
    );

    const imageData = receivedParts[1] as { inlineData: { data: string } };
    expect(imageData.inlineData.data).toBe("abc123");
  });

  it("passes schema and generation config to Gemini correctly", async () => {
    let receivedConfig: unknown = {};
    const gemini: GeminiClient = {
      getGenerativeModel: (config) => {
        receivedConfig = config;
        return {
          generateContent: () => Promise.resolve({
            response: { text: () => JSON.stringify({ skin_type: "oily" }) },
          }),
        };
      },
    };

    await analyse(BASE_REQ, { gemini, openrouter: null });

    expect(receivedConfig).toMatchObject({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.25,
        topP: 0.85,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    });
  });

  it("OpenRouter receives correct message format with image_url", async () => {
    const gemini = mockGemini(new Error("429"));
    let receivedBody: any = null;
    const openrouter: OpenRouterClient = {
      chat: {
        completions: {
          create: (body: any) => {
            receivedBody = body;
            return Promise.resolve({
              choices: [{ message: { content: JSON.stringify({ skin_type: "dry" }) } }],
            });
          },
        },
      },
    };

    await analyse(BASE_REQ, { gemini, openrouter });

    expect(receivedBody.model).toBe("google/gemma-4-31b-it:free");
    expect(receivedBody.messages[0].content[0].type).toBe("text");
    expect(receivedBody.messages[0].content[1].type).toBe("image_url");
    expect(receivedBody.messages[0].content[1].image_url.url).toContain("data:image/jpeg;base64,");
  });
});
