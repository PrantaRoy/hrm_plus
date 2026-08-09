import { GalleryItemDto, PublicGalleryItemDto } from "@hrm-plus/shared";

type GalleryItemRecord = {
  id: number;
  title: string | null;
  caption: string | null;
  category: string | null;
  imageUrl: string;
  thumbnailUrl: string | null;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export function toGalleryItemDto(item: GalleryItemRecord): GalleryItemDto {
  return {
    id: item.id,
    title: item.title,
    caption: item.caption,
    category: item.category,
    imageUrl: item.imageUrl,
    thumbnailUrl: item.thumbnailUrl,
    isFeatured: item.isFeatured,
    sortOrder: item.sortOrder,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function toPublicGalleryItemDto(item: GalleryItemRecord): PublicGalleryItemDto {
  return {
    id: item.id,
    title: item.title,
    caption: item.caption,
    category: item.category,
    imageUrl: item.imageUrl,
    thumbnailUrl: item.thumbnailUrl,
    isFeatured: item.isFeatured,
    sortOrder: item.sortOrder,
  };
}
