import { ApiError } from "../../utils/ApiError";
import { LlmJsonRequest, LlmProvider } from "./llmProvider";

function extractJsonObject(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match ? match[0] : trimmed;
}

export class GeminiProvider implements LlmProvider {
  constructor(private readonly config: { apiKey: string; model: string }) {}

  async generateJson<T>(request: LlmJsonRequest): Promise<T> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: `${request.system} Respond with ONLY the JSON object, no prose.` }] },
          contents: [{ role: "user", parts: [{ text: request.prompt }] }],
          generationConfig: {
            maxOutputTokens: request.maxTokens ?? 1500,
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        }),
      });
    } catch {
      throw new ApiError(502, "AI provider request failed", "LLM_ERROR");
    }

    if (!response.ok) {
      throw new ApiError(502, "AI provider request failed", "LLM_ERROR");
    }

    const body = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new ApiError(502, "AI provider returned an empty response", "LLM_ERROR");
    }

    try {
      return JSON.parse(extractJsonObject(text)) as T;
    } catch {
      throw new ApiError(502, "AI provider returned an unparseable response", "LLM_ERROR");
    }
  }
}
