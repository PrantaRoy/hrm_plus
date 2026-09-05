import { AiProvider, AiSettingsDto } from "@hrm-plus/shared";

export function toAiSettingsDto(settings: {
  id: number;
  provider: string;
  model: string | null;
  apiKeyCiphertext: string | null;
  updatedById: number | null;
  updatedAt: Date;
}): AiSettingsDto {
  return {
    id: settings.id,
    provider: settings.provider as AiProvider,
    model: settings.model,
    hasApiKey: Boolean(settings.apiKeyCiphertext),
    updatedById: settings.updatedById,
    updatedAt: settings.updatedAt.toISOString(),
  };
}
