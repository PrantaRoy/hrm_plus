import { PrismaClient } from "../../../generated/tenant";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import { LlmProvider } from "./llmProvider";
import { OpenAiProvider } from "./openAiProvider";
import { AnthropicProvider } from "./anthropicProvider";
import { GroqProvider } from "./groqProvider";
import { GeminiProvider } from "./geminiProvider";
import { resolveProviderConfig } from "../ai-settings/aiSettings.service";

/**
 * Tenants normally configure their own provider + API key via Settings > AI
 * (modules/ai-settings). When they haven't, this falls back to the env-configured
 * provider (LLM_PROVIDER + that provider's *_API_KEY/*_MODEL). No caching/singleton
 * here — these are cheap fetch-wrapper instances, and different tenants (and a
 * tenant that just changed its settings) can need a different one on every call.
 */
export async function getLlmProvider(prisma: PrismaClient): Promise<LlmProvider> {
  const tenantConfig = await resolveProviderConfig(prisma);
  if (tenantConfig) {
    return tenantConfig.provider === "GEMINI"
      ? new GeminiProvider({ apiKey: tenantConfig.apiKey, model: tenantConfig.model })
      : new GroqProvider({ apiKey: tenantConfig.apiKey, model: tenantConfig.model });
  }

  switch (env.LLM_PROVIDER) {
    case "anthropic":
      if (!env.ANTHROPIC_API_KEY) throw new ApiError(502, "ANTHROPIC_API_KEY is not configured", "LLM_NOT_CONFIGURED");
      return new AnthropicProvider({ apiKey: env.ANTHROPIC_API_KEY, model: env.ANTHROPIC_MODEL });
    case "gemini":
      if (!env.GEMINI_API_KEY) throw new ApiError(502, "GEMINI_API_KEY is not configured", "LLM_NOT_CONFIGURED");
      return new GeminiProvider({ apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL });
    case "openai":
      if (!env.OPENAI_API_KEY) throw new ApiError(502, "OPENAI_API_KEY is not configured", "LLM_NOT_CONFIGURED");
      return new OpenAiProvider({ apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL });
    case "groq":
    default:
      if (!env.GROQ_API_KEY) throw new ApiError(502, "GROQ_API_KEY is not configured", "LLM_NOT_CONFIGURED");
      return new GroqProvider({ apiKey: env.GROQ_API_KEY, model: env.GROQ_MODEL });
  }
}

/**
 * Name + model of whichever provider getLlmProvider() would build, for stamping onto
 * saved AI output (e.g. AI KPI reports) so it's traceable to the model that wrote it.
 */
export async function getLlmProviderInfo(prisma: PrismaClient): Promise<{ provider: string; model: string }> {
  const tenantConfig = await resolveProviderConfig(prisma);
  if (tenantConfig) return { provider: tenantConfig.provider.toLowerCase(), model: tenantConfig.model };

  switch (env.LLM_PROVIDER) {
    case "anthropic":
      return { provider: "anthropic", model: env.ANTHROPIC_MODEL };
    case "gemini":
      return { provider: "gemini", model: env.GEMINI_MODEL };
    case "openai":
      return { provider: "openai", model: env.OPENAI_MODEL };
    case "groq":
    default:
      return { provider: "groq", model: env.GROQ_MODEL };
  }
}
