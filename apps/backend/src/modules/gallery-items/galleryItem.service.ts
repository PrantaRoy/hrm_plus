import { PrismaClient } from "../../../generated/tenant";
import { CreateGalleryItemInput, GalleryItemDto, UpdateGalleryItemInput } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { getStorageDriver } from "../../storage";
import { toGalleryItemDto } from "./galleryItem.mapper";

type ImageFile = { buffer: Buffer; originalName: string; mimeType: string };

export async function listGalleryItems(prisma: PrismaClient): Promise<GalleryItemDto[]> {
  const items = await prisma.galleryItem.findMany({ orderBy: { sortOrder: "asc" } });
  return items.map(toGalleryItemDto);
}

export async function createGalleryItem(
  prisma: PrismaClient,
  input: CreateGalleryItemInput,
  image: ImageFile,
  thumbnail?: ImageFile
): Promise<GalleryItemDto> {
  const storage = getStorageDriver();
  const storedImage = await storage.save({
    buffer: image.buffer,
    originalName: image.originalName,
    mimeType: image.mimeType,
    folder: "website-cms/gallery",
  });
  const storedThumbnail = thumbnail
    ? await storage.save({
        buffer: thumbnail.buffer,
        originalName: thumbnail.originalName,
        mimeType: thumbnail.mimeType,
        folder: "website-cms/gallery",
      })
    : storedImage;

  const count = await prisma.galleryItem.count();
  const created = await prisma.galleryItem.create({
    data: {
      title: input.title,
      caption: input.caption,
      category: input.category,
      isFeatured: input.isFeatured ?? false,
      imageUrl: storedImage.url,
      imageKey: storedImage.key,
      thumbnailUrl: storedThumbnail.url,
      thumbnailKey: storedThumbnail.key,
      sortOrder: count,
    },
  });
  return toGalleryItemDto(created);
}

async function getGalleryItemOrThrow(prisma: PrismaClient, id: number) {
  const item = await prisma.galleryItem.findUnique({ where: { id } });
  if (!item) {
    throw ApiError.notFound("Gallery item not found");
  }
  return item;
}

export async function updateGalleryItem(
  prisma: PrismaClient,
  id: number,
  input: UpdateGalleryItemInput,
  image?: ImageFile,
  thumbnail?: ImageFile
): Promise<GalleryItemDto> {
  const existing = await getGalleryItemOrThrow(prisma, id);
  const storage = getStorageDriver();

  let imageFields: { imageUrl?: string; imageKey?: string } = {};
  if (image) {
    const stored = await storage.save({
      buffer: image.buffer,
      originalName: image.originalName,
      mimeType: image.mimeType,
      folder: "website-cms/gallery",
    });
    if (existing.imageKey) {
      await storage.delete(existing.imageKey).catch(() => undefined);
    }
    imageFields = { imageUrl: stored.url, imageKey: stored.key };
  }

  let thumbnailFields: { thumbnailUrl?: string; thumbnailKey?: string } = {};
  if (thumbnail) {
    const stored = await storage.save({
      buffer: thumbnail.buffer,
      originalName: thumbnail.originalName,
      mimeType: thumbnail.mimeType,
      folder: "website-cms/gallery",
    });
    if (existing.thumbnailKey) {
      await storage.delete(existing.thumbnailKey).catch(() => undefined);
    }
    thumbnailFields = { thumbnailUrl: stored.url, thumbnailKey: stored.key };
  }

  const updated = await prisma.galleryItem.update({
    where: { id },
    data: { ...input, ...imageFields, ...thumbnailFields },
  });
  return toGalleryItemDto(updated);
}

export async function deleteGalleryItem(prisma: PrismaClient, id: number): Promise<void> {
  const existing = await getGalleryItemOrThrow(prisma, id);
  const storage = getStorageDriver();
  if (existing.imageKey) await storage.delete(existing.imageKey).catch(() => undefined);
  if (existing.thumbnailKey && existing.thumbnailKey !== existing.imageKey) {
    await storage.delete(existing.thumbnailKey).catch(() => undefined);
  }
  await prisma.galleryItem.delete({ where: { id } });
}

export async function reorderGalleryItems(prisma: PrismaClient, orderedIds: number[]): Promise<GalleryItemDto[]> {
  const count = await prisma.galleryItem.count({ where: { id: { in: orderedIds } } });
  if (count !== orderedIds.length) {
    throw ApiError.badRequest("orderedIds contains unknown gallery item ids");
  }
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.galleryItem.update({ where: { id }, data: { sortOrder: index } }))
  );
  return listGalleryItems(prisma);
}
