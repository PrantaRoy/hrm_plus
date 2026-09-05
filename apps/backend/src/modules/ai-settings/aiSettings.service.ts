import { PrismaClient } from "../../../generated/tenant";
import { AiSettingsDto, UpdateAiSettingsInput } from "@hrm-plus/shared";
import { encrypt, decrypt } from "../../utils/encryption";
import { toAiSettingsDto } from "./aiSettings.mapper";

// AiSettings is a tenant-wide singleton (chosen LLM provider + credentials),
// same get-or-create pattern as GeneralSettings/AttendanceSettings.
export async function getOrCreateSettings(prisma: PrismaClient) {
  const existing = await prisma.aiSettings.findFirst();
  if (existing) return existing;
  return prisma.aiSettings.create({ data: {} });
}

export async function getAiSettings(prisma: PrismaClient): Promise<AiSettingsDto> {
  return toAiSettingsDto(await getOrCreateSettings(prisma));
}

export async function updateAiSettings(
  prisma: PrismaClient,
  input: UpdateAiSettingsInput,
  updatedById: number
): Promise<AiSettingsDto> {
  const existing = await getOrCreateSettings(prisma);
  const updated = await prisma.aiSettings.update({
    where: { id: existing.id },
    data: {
      provider: input.provider,
      model: input.model ?? null,
      ...(input.apiKey ? { apiKeyCiphertext: encrypt(input.apiKey) } : {}),
      updatedById,
    },
  });
  return toAiSettingsDto(updated);
}

export interface ResolvedProviderConfig {
  provider: "GROQ" | "GEMINI";
  apiKey: string;
  model: string;
}

/**
 * Resolves the tenant's configured provider + decrypted API key + model for
 * modules/llm's factory to build an LlmProvider from. Returns null if the tenant
 * hasn't configured a key yet, letting the caller fall back to env vars.
 */
export async function resolveProviderConfig(prisma: PrismaClient): Promise<ResolvedProviderConfig | null> {
  const settings = await getOrCreateSettings(prisma);
  if (!settings.apiKeyCiphertext) return null;

  const provider = settings.provider as "GROQ" | "GEMINI";
  const defaultModel = provider === "GEMINI" ? "gemini-2.0-flash" : "openai/gpt-oss-20b";
  return {
    provider,
    apiKey: decrypt(settings.apiKeyCiphertext),
    model: settings.model ?? defaultModel,
  };
}
