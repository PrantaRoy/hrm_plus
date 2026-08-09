import { CreateSocialLinkInput, SocialLinkDto, UpdateSocialLinkInput } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listSocialLinks(): Promise<SocialLinkDto[]> {
  const res = await apiClient.get<SocialLinkDto[]>("/social-links");
  return res.data;
}

export async function createSocialLink(input: CreateSocialLinkInput): Promise<SocialLinkDto> {
  const res = await apiClient.post<SocialLinkDto>("/social-links", input);
  return res.data;
}

export async function updateSocialLink(id: number, input: UpdateSocialLinkInput): Promise<SocialLinkDto> {
  const res = await apiClient.patch<SocialLinkDto>(`/social-links/${id}`, input);
  return res.data;
}

export async function deleteSocialLink(id: number): Promise<void> {
  await apiClient.delete(`/social-links/${id}`);
}

export async function reorderSocialLinks(orderedIds: number[]): Promise<SocialLinkDto[]> {
  const res = await apiClient.post<SocialLinkDto[]>("/social-links/reorder", { orderedIds });
  return res.data;
}
