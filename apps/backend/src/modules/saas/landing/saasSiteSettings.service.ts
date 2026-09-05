import { z } from "zod";
import { SaasSiteSettingsDto, UpdateSaasSiteSettingsInput } from "@hrm-plus/shared";
import { Prisma } from "../../../../generated/control";
import { controlClient } from "../../../db/controlClient";
import { getStorageDriver } from "../../../storage";
import { toSaasSiteSettingsDto } from "./saasLanding.mapper";
import { updateSaasSiteSettingsSchema, SaasSettingsImageField } from "./saasLanding.schemas";
import { invalidateLandingCache } from "./saasLandingContent.service";

const STORAGE_FOLDER = "saas-landing/branding";

const IMAGE_FIELDS: Record<
  SaasSettingsImageField,
  { urlColumn: keyof Prisma.SaasSiteSettingsUncheckedUpdateInput; keyColumn: "logoKey" | "faviconKey" | "heroImageKey" | "ogImageKey" }
> = {
  logo: { urlColumn: "logoUrl", keyColumn: "logoKey" },
  favicon: { urlColumn: "faviconUrl", keyColumn: "faviconKey" },
  heroImage: { urlColumn: "heroImageUrl", keyColumn: "heroImageKey" },
  ogImage: { urlColumn: "ogImageUrl", keyColumn: "ogImageKey" },
};

// Global singleton — get-or-create, mirroring the tenant SiteSetting pattern.
export async function getOrCreateSettings() {
  const existing = await controlClient.saasSiteSettings.findFirst();
  if (existing) return existing;
  return controlClient.saasSiteSettings.create({ data: {} });
}

export async function getSaasSiteSettings(): Promise<SaasSiteSettingsDto> {
  return toSaasSiteSettingsDto(await getOrCreateSettings());
}

type JsonArrayKey = "navLinks" | "sections" | "footerColumns" | "socialLinks";
const JSON_ARRAY_KEYS: JsonArrayKey[] = ["navLinks", "sections", "footerColumns", "socialLinks"];

export async function updateSaasSiteSettings(
  rawInput: UpdateSaasSiteSettingsInput
): Promise<SaasSiteSettingsDto> {
  const input = updateSaasSiteSettingsSchema.parse(rawInput) as z.infer<
    typeof updateSaasSiteSettingsSchema
  >;
  const existing = await getOrCreateSettings();

  const data: Prisma.SaasSiteSettingsUncheckedUpdateInput = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    if (JSON_ARRAY_KEYS.includes(key as JsonArrayKey)) {
      (data as Record<string, unknown>)[key] = value as Prisma.InputJsonValue;
    } else {
      (data as Record<string, unknown>)[key] = value;
    }
  }

  const updated = await controlClient.saasSiteSettings.update({
    where: { id: existing.id },
    data,
  });
  invalidateLandingCache();
  return toSaasSiteSettingsDto(updated);
}

export async function setSaasSettingsImage(
  field: SaasSettingsImageField,
  file: { buffer: Buffer; originalName: string; mimeType: string }
): Promise<SaasSiteSettingsDto> {
  const existing = await getOrCreateSettings();
  const storage = getStorageDriver();
  const stored = await storage.save({
    buffer: file.buffer,
    originalName: file.originalName,
    mimeType: file.mimeType,
    folder: STORAGE_FOLDER,
  });

  const { urlColumn, keyColumn } = IMAGE_FIELDS[field];
  const oldKey = existing[keyColumn];
  if (oldKey) {
    await storage.delete(oldKey).catch(() => undefined);
  }

  const updated = await controlClient.saasSiteSettings.update({
    where: { id: existing.id },
    data: {
      [urlColumn]: stored.url,
      [keyColumn]: stored.key,
    } as Prisma.SaasSiteSettingsUncheckedUpdateInput,
  });
  invalidateLandingCache();
  return toSaasSiteSettingsDto(updated);
}
