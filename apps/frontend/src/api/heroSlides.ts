import { CreateHeroSlideInput, HeroSlideDto, UpdateHeroSlideInput } from "@hrm-plus/shared";
import { apiClient } from "./client";

function toFormData(input: CreateHeroSlideInput | UpdateHeroSlideInput, media?: File): FormData {
  const formData = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined) return;
    formData.append(key, String(value));
  });
  if (media) formData.append("media", media);
  return formData;
}

export async function listHeroSlides(): Promise<HeroSlideDto[]> {
  const res = await apiClient.get<HeroSlideDto[]>("/hero-slides");
  return res.data;
}

export async function getHeroSlide(id: number): Promise<HeroSlideDto> {
  const res = await apiClient.get<HeroSlideDto>(`/hero-slides/${id}`);
  return res.data;
}

export async function createHeroSlide(input: CreateHeroSlideInput, media: File): Promise<HeroSlideDto> {
  const res = await apiClient.post<HeroSlideDto>("/hero-slides", toFormData(input, media));
  return res.data;
}

export async function updateHeroSlide(id: number, input: UpdateHeroSlideInput, media?: File): Promise<HeroSlideDto> {
  const res = await apiClient.patch<HeroSlideDto>(`/hero-slides/${id}`, toFormData(input, media));
  return res.data;
}

export async function deleteHeroSlide(id: number): Promise<void> {
  await apiClient.delete(`/hero-slides/${id}`);
}

export async function reorderHeroSlides(orderedIds: number[]): Promise<HeroSlideDto[]> {
  const res = await apiClient.post<HeroSlideDto[]>("/hero-slides/reorder", { orderedIds });
  return res.data;
}
