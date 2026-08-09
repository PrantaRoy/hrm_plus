import { PrismaClient } from "../../../generated/tenant";
import { CreateHeroSlideInput, HeroSlideDto, UpdateHeroSlideInput } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { getStorageDriver } from "../../storage";
import { toHeroSlideDto } from "./heroSlide.mapper";

type MediaFile = { buffer: Buffer; originalName: string; mimeType: string };

export async function listHeroSlides(prisma: PrismaClient): Promise<HeroSlideDto[]> {
  const slides = await prisma.heroSlide.findMany({ orderBy: { sortOrder: "asc" } });
  return slides.map(toHeroSlideDto);
}

export async function getHeroSlideById(prisma: PrismaClient, id: number): Promise<HeroSlideDto> {
  const slide = await prisma.heroSlide.findUnique({ where: { id } });
  if (!slide) {
    throw ApiError.notFound("Hero slide not found");
  }
  return toHeroSlideDto(slide);
}

export async function createHeroSlide(
  prisma: PrismaClient,
  input: CreateHeroSlideInput,
  media: MediaFile
): Promise<HeroSlideDto> {
  const storage = getStorageDriver();
  const stored = await storage.save({
    buffer: media.buffer,
    originalName: media.originalName,
    mimeType: media.mimeType,
    folder: "website-cms/hero-slides",
  });
  const count = await prisma.heroSlide.count();
  const created = await prisma.heroSlide.create({
    data: {
      headline: input.headline,
      subHeadline: input.subHeadline,
      mediaType: input.mediaType,
      mediaUrl: stored.url,
      mediaKey: stored.key,
      ctaPrimaryText: input.ctaPrimaryText,
      ctaPrimaryUrl: input.ctaPrimaryUrl,
      ctaSecondaryText: input.ctaSecondaryText,
      ctaSecondaryUrl: input.ctaSecondaryUrl,
      isActive: input.isActive ?? true,
      sortOrder: count,
    },
  });
  return toHeroSlideDto(created);
}

async function getHeroSlideOrThrow(prisma: PrismaClient, id: number) {
  const slide = await prisma.heroSlide.findUnique({ where: { id } });
  if (!slide) {
    throw ApiError.notFound("Hero slide not found");
  }
  return slide;
}

export async function updateHeroSlide(
  prisma: PrismaClient,
  id: number,
  input: UpdateHeroSlideInput,
  media?: MediaFile
): Promise<HeroSlideDto> {
  const existing = await getHeroSlideOrThrow(prisma, id);

  let mediaFields: { mediaUrl?: string; mediaKey?: string } = {};
  if (media) {
    const storage = getStorageDriver();
    const stored = await storage.save({
      buffer: media.buffer,
      originalName: media.originalName,
      mimeType: media.mimeType,
      folder: "website-cms/hero-slides",
    });
    if (existing.mediaKey) {
      await storage.delete(existing.mediaKey).catch(() => undefined);
    }
    mediaFields = { mediaUrl: stored.url, mediaKey: stored.key };
  }

  const updated = await prisma.heroSlide.update({
    where: { id },
    data: { ...input, ...mediaFields },
  });
  return toHeroSlideDto(updated);
}

export async function deleteHeroSlide(prisma: PrismaClient, id: number): Promise<void> {
  const existing = await getHeroSlideOrThrow(prisma, id);
  if (existing.mediaKey) {
    const storage = getStorageDriver();
    await storage.delete(existing.mediaKey).catch(() => undefined);
  }
  await prisma.heroSlide.delete({ where: { id } });
}

export async function reorderHeroSlides(prisma: PrismaClient, orderedIds: number[]): Promise<HeroSlideDto[]> {
  const count = await prisma.heroSlide.count({ where: { id: { in: orderedIds } } });
  if (count !== orderedIds.length) {
    throw ApiError.badRequest("orderedIds contains unknown hero slide ids");
  }
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.heroSlide.update({ where: { id }, data: { sortOrder: index } }))
  );
  return listHeroSlides(prisma);
}
