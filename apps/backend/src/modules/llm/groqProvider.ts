import { ApiError } from "../../utils/ApiError";
import { LlmJsonRequest, LlmProvider } from "./llmProvider";

const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";

function extractJsonObject(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match ? match[0] : trimmed;
}

// OpenAI-compatible chat completions API. Free-tier models don't reliably honor
// response_format, so the system prompt asks for bare JSON and a regex fallback
// extracts the first {...} block before parsing.
export class GroqProvider implements LlmProvider {
  constructor(private readonly config: { apiKey: string; model: string }) {}

  async generateJson<T>(request: LlmJsonRequest): Promise<T> {
    let response: Response;
    try {
      response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: "system", content: `${request.system} Respond with ONLY the JSON object, no prose.` },
            { role: "user", content: request.prompt },
          ],
          max_tokens: request.maxTokens ?? 1500,
          temperature: 0.3,
        }),
      });
    } catch {
      throw new ApiError(502, "AI provider request failed", "LLM_ERROR");
    }

    if (!response.ok) {
      throw new ApiError(502, "AI provider request failed", "LLM_ERROR");
    }

    const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = body.choices?.[0]?.message?.content;
    if (!content) {
      throw new ApiError(502, "AI provider returned an empty response", "LLM_ERROR");
    }

    try {
      return JSON.parse(extractJsonObject(content)) as T;
    } catch {
      throw new ApiError(502, "AI provider returned an unparseable response", "LLM_ERROR");
    }
  }
}
