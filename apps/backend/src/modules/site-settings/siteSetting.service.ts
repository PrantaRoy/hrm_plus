import { Prisma, PrismaClient } from "../../../generated/tenant";
import { SiteSettingDto, UpdateSiteSettingInput } from "@hrm-plus/shared";
import { getStorageDriver } from "../../storage";
import { toSiteSettingDto } from "./siteSetting.mapper";

// SiteSetting is a tenant-wide singleton for the public marketing website's own
// branding/contact info, deliberately separate from GeneralSettings (which drives
// the internal HRM admin app). Enforced via get-or-create, matching that pattern.
export async function getOrCreateSettings(prisma: PrismaClient) {
  const existing = await prisma.siteSetting.findFirst();
  if (existing) return existing;
  return prisma.siteSetting.create({ data: {} });
}

export async function getSiteSettings(prisma: PrismaClient): Promise<SiteSettingDto> {
  return toSiteSettingDto(await getOrCreateSettings(prisma));
}

export async function updateSiteSettings(
  prisma: PrismaClient,
  input: UpdateSiteSettingInput,
  updatedById: number
): Promise<SiteSettingDto> {
  const existing = await getOrCreateSettings(prisma);
  const { businessHours, ...rest } = input;
  const updated = await prisma.siteSetting.update({
    where: { id: existing.id },
    data: {
      ...rest,
      updatedById,
      ...(businessHours !== undefined
        ? { businessHours: businessHours === null ? Prisma.JsonNull : (businessHours as unknown as Prisma.InputJsonValue) }
        : {}),
    },
  });
  return toSiteSettingDto(updated);
}

export async function setSiteLogo(
  prisma: PrismaClient,
  file: { buffer: Buffer; originalName: string; mimeType: string },
  updatedById: number
): Promise<SiteSettingDto> {
  const existing = await getOrCreateSettings(prisma);
  const storage = getStorageDriver();
  const stored = await storage.save({
    buffer: file.buffer,
    originalName: file.originalName,
    mimeType: file.mimeType,
    folder: "website-cms/branding",
  });

  if (existing.logoKey) {
    await storage.delete(existing.logoKey).catch(() => undefined);
  }

  const updated = await prisma.siteSetting.update({
    where: { id: existing.id },
    data: { logoUrl: stored.url, logoKey: stored.key, updatedById },
  });
  return toSiteSettingDto(updated);
}

export async function setSiteFavicon(
  prisma: PrismaClient,
  file: { buffer: Buffer; originalName: string; mimeType: string },
  updatedById: number
): Promise<SiteSettingDto> {
  const existing = await getOrCreateSettings(prisma);
  const storage = getStorageDriver();
  const stored = await storage.save({
    buffer: file.buffer,
    originalName: file.originalName,
    mimeType: file.mimeType,
    folder: "website-cms/branding",
  });

  if (existing.faviconKey) {
    await storage.delete(existing.faviconKey).catch(() => undefined);
  }

  const updated = await prisma.siteSetting.update({
    where: { id: existing.id },
    data: { faviconUrl: stored.url, faviconKey: stored.key, updatedById },
  });
  return toSiteSettingDto(updated);
}
