/**
 * lib/responseParser.ts
 * Utility to robustly extract and clean JSON from AI responses.
 * Handles markdown fences, trailing commas, and partial responses.
 */

export function safeParseJSON<T>(text: string): T {
  try {
    // Stage 1: Basic cleaning
    let clean = text.replace(/```json|```/g, "").trim();

    // Stage 2: Extract content between outermost brackets
    // This handles cases where the AI adds preamble or conversational text.
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }

    // Stage 3: Sanitize common hallucinations
    // Remove trailing commas before closing braces/brackets
    clean = clean.replace(/,\s*([}\]])/g, "$1");
    
    // Remove accidental unescaped control characters (not permitted in JSON)
    // Only removes real control characters, not escaped sequences like \n
    clean = clean.replace(/[\x00-\x1F\x7F-\x9F]/g, "");

    // Stage 4: Basic Auto-closing for truncated responses
    // If it starts with { but doesn't end with }, and parsing fails, we try appending it.
    try {
      return JSON.parse(clean) as T;
    } catch (e) {
      if (clean.trim().startsWith("{") && !clean.trim().endsWith("}")) {
        try {
          return JSON.parse(clean + "}") as T;
        } catch {}
      }
      throw e;
    }
  } catch (error) {
    console.error("[ResponseParser] Failed to parse JSON. Raw text sample:", text.substring(0, 100));
    throw error;
  }
}
