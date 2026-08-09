export interface GalleryItemDto {
  id: number;
  title: string | null;
  caption: string | null;
  category: string | null;
  imageUrl: string;
  thumbnailUrl: string | null;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGalleryItemInput {
  title?: string;
  caption?: string;
  category?: string;
  isFeatured?: boolean;
}

export type UpdateGalleryItemInput = Partial<CreateGalleryItemInput>;

export type PublicGalleryItemDto = Omit<GalleryItemDto, "createdAt" | "updatedAt">;

export interface ReorderGalleryItemsInput {
  orderedIds: number[];
}
