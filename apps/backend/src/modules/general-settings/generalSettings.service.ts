import { PrismaClient } from "../../../generated/tenant";
import { GeneralSettingsDto, UpdateGeneralSettingsInput } from "@hrm-plus/shared";
import { getStorageDriver } from "../../storage";
import { toGeneralSettingsDto } from "./generalSettings.mapper";

// GeneralSettings is a tenant-wide singleton (branding, locale, formatting); enforced
// via get-or-create, matching the AttendanceSettings pattern.
export async function getOrCreateSettings(prisma: PrismaClient) {
  const existing = await prisma.generalSettings.findFirst();
  if (existing) return existing;
  return prisma.generalSettings.create({ data: {} });
}

export async function getGeneralSettings(prisma: PrismaClient): Promise<GeneralSettingsDto> {
  return toGeneralSettingsDto(await getOrCreateSettings(prisma));
}

export async function updateGeneralSettings(
  prisma: PrismaClient,
  input: UpdateGeneralSettingsInput,
  updatedById: number
): Promise<GeneralSettingsDto> {
  const existing = await getOrCreateSettings(prisma);
  const updated = await prisma.generalSettings.update({
    where: { id: existing.id },
    data: { ...input, updatedById },
  });
  return toGeneralSettingsDto(updated);
}

export async function setGeneralLogo(
  prisma: PrismaClient,
  file: { buffer: Buffer; originalName: string; mimeType: string },
  updatedById: number
): Promise<GeneralSettingsDto> {
  const existing = await getOrCreateSettings(prisma);
  const storage = getStorageDriver();
  const stored = await storage.save({
    buffer: file.buffer,
    originalName: file.originalName,
    mimeType: file.mimeType,
    folder: "branding",
  });

  if (existing.logoKey) {
    await storage.delete(existing.logoKey).catch(() => undefined);
  }

  const updated = await prisma.generalSettings.update({
    where: { id: existing.id },
    data: { logoUrl: stored.url, logoKey: stored.key, updatedById },
  });
  return toGeneralSettingsDto(updated);
}

export async function setGeneralFavicon(
  prisma: PrismaClient,
  file: { buffer: Buffer; originalName: string; mimeType: string },
  updatedById: number
): Promise<GeneralSettingsDto> {
  const existing = await getOrCreateSettings(prisma);
  const storage = getStorageDriver();
  const stored = await storage.save({
    buffer: file.buffer,
    originalName: file.originalName,
    mimeType: file.mimeType,
    folder: "branding",
  });

  if (existing.faviconKey) {
    await storage.delete(existing.faviconKey).catch(() => undefined);
  }

  const updated = await prisma.generalSettings.update({
    where: { id: existing.id },
    data: { faviconUrl: stored.url, faviconKey: stored.key, updatedById },
  });
  return toGeneralSettingsDto(updated);
}
