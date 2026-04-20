import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getOpenRouterClient() {
  if (_client) return _client;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn("OPENROUTER_API_KEY is not set. OpenRouter fallback will be unavailable.");
    return null;
  }

  _client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey,
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "GlowScan",
    },
  });

  return _client;
}

/**
 * High-precision multimodal analysis using OpenRouter (Gemma 4 31B)
 */
export async function analyseWithOpenRouter(prompt: string, base64Image: string) {
  const client = getOpenRouterClient();
  if (!client) throw new Error("OpenRouter client not initialized");

  // Clean base64
  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

  const response = await client.chat.completions.create({
    model: "google/gemma-4-31b-it:free",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${cleanBase64}`,
            },
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
    // Use extra_body for OpenRouter-specific reasoning/features
    extra_body: {
      reasoning: { enabled: true },
    },
  } as any);

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("OpenRouter returned empty response");

  return content;
}
