import { env } from "../../config/env";
import { LlmProvider } from "./llmProvider";
import { OpenAiProvider } from "./openAiProvider";
import { AnthropicProvider } from "./anthropicProvider";

let provider: LlmProvider | undefined;

export function getLlmProvider(): LlmProvider {
  if (!provider) {
    provider = env.LLM_PROVIDER === "anthropic" ? new AnthropicProvider() : new OpenAiProvider();
  }
  return provider;
}
