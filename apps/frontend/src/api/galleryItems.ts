import { CreateGalleryItemInput, GalleryItemDto, UpdateGalleryItemInput } from "@hrm-plus/shared";
import { apiClient } from "./client";

function toFormData(
  input: CreateGalleryItemInput | UpdateGalleryItemInput,
  image?: File,
  thumbnail?: File
): FormData {
  const formData = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined) return;
    formData.append(key, String(value));
  });
  if (image) formData.append("image", image);
  if (thumbnail) formData.append("thumbnail", thumbnail);
  return formData;
}

export async function listGalleryItems(): Promise<GalleryItemDto[]> {
  const res = await apiClient.get<GalleryItemDto[]>("/gallery-items");
  return res.data;
}

export async function createGalleryItem(
  input: CreateGalleryItemInput,
  image: File,
  thumbnail?: File
): Promise<GalleryItemDto> {
  const res = await apiClient.post<GalleryItemDto>("/gallery-items", toFormData(input, image, thumbnail));
  return res.data;
}

export async function updateGalleryItem(
  id: number,
  input: UpdateGalleryItemInput,
  image?: File,
  thumbnail?: File
): Promise<GalleryItemDto> {
  const res = await apiClient.patch<GalleryItemDto>(`/gallery-items/${id}`, toFormData(input, image, thumbnail));
  return res.data;
}

export async function deleteGalleryItem(id: number): Promise<void> {
  await apiClient.delete(`/gallery-items/${id}`);
}

export async function reorderGalleryItems(orderedIds: number[]): Promise<GalleryItemDto[]> {
  const res = await apiClient.post<GalleryItemDto[]>("/gallery-items/reorder", { orderedIds });
  return res.data;
}
