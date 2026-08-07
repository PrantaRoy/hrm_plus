import { ApiError } from "../../utils/ApiError";
import { env } from "../../config/env";
import { LlmJsonRequest, LlmProvider } from "./llmProvider";

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

export class OpenAiProvider implements LlmProvider {
  async generateJson<T>(request: LlmJsonRequest): Promise<T> {
    if (!env.OPENAI_API_KEY) {
      throw new ApiError(502, "OPENAI_API_KEY is not configured", "LLM_NOT_CONFIGURED");
    }

    let response: Response;
    try {
      response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL,
          messages: [
            { role: "system", content: request.system },
            { role: "user", content: request.prompt },
          ],
          response_format: { type: "json_object" },
          max_tokens: request.maxTokens ?? 2000,
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
      return JSON.parse(content) as T;
    } catch {
      throw new ApiError(502, "AI provider returned an unparseable response", "LLM_ERROR");
    }
  }
}
