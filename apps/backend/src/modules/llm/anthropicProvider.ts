import { ApiError } from "../../utils/ApiError";
import { LlmJsonRequest, LlmProvider } from "./llmProvider";

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";

function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

export class AnthropicProvider implements LlmProvider {
  constructor(private readonly config: { apiKey: string; model: string }) {}

  async generateJson<T>(request: LlmJsonRequest): Promise<T> {
    // Anthropic has no native JSON response mode, so we prompt-engineer it and
    // defensively strip markdown code fences before parsing.
    const system = `${request.system}\n\nRespond with ONLY a JSON object, no prose, no markdown code fences.`;

    let response: Response;
    try {
      response = await fetch(ANTHROPIC_MESSAGES_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: request.maxTokens ?? 2000,
          system,
          messages: [{ role: "user", content: request.prompt }],
        }),
      });
    } catch {
      throw new ApiError(502, "AI provider request failed", "LLM_ERROR");
    }

    if (!response.ok) {
      throw new ApiError(502, "AI provider request failed", "LLM_ERROR");
    }

    const body = (await response.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = body.content?.find((block) => block.type === "text")?.text;
    if (!text) {
      throw new ApiError(502, "AI provider returned an empty response", "LLM_ERROR");
    }

    try {
      return JSON.parse(stripJsonFences(text)) as T;
    } catch {
      throw new ApiError(502, "AI provider returned an unparseable response", "LLM_ERROR");
    }
  }
}
