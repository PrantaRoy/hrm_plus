import {
  CreateSaasBlogPostInput,
  PublicSaasBlogPostDto,
  PublicSaasBlogPostListItemDto,
  SaasBlogPostDto,
  SaasBlogPostStatus,
  UpdateSaasBlogPostInput,
} from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listPublicBlogPosts(): Promise<PublicSaasBlogPostListItemDto[]> {
  const res = await apiClient.get<PublicSaasBlogPostListItemDto[]>("/saas/public/blog");
  return res.data;
}

export async function getPublicBlogPost(slug: string): Promise<PublicSaasBlogPostDto> {
  const res = await apiClient.get<PublicSaasBlogPostDto>(`/saas/public/blog/${encodeURIComponent(slug)}`);
  return res.data;
}

export async function listBlogPosts(status?: SaasBlogPostStatus): Promise<SaasBlogPostDto[]> {
  const res = await apiClient.get<SaasBlogPostDto[]>("/saas/admin/blog", {
    params: status ? { status } : undefined,
  });
  return res.data;
}

export async function getBlogPost(id: number): Promise<SaasBlogPostDto> {
  const res = await apiClient.get<SaasBlogPostDto>(`/saas/admin/blog/${id}`);
  return res.data;
}

function toFormData(input: CreateSaasBlogPostInput | UpdateSaasBlogPostInput, coverImage?: File | null) {
  const form = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    form.append(key, String(value));
  }
  if (coverImage) form.append("coverImage", coverImage);
  return form;
}

export async function createBlogPost(
  input: CreateSaasBlogPostInput,
  coverImage?: File | null
): Promise<SaasBlogPostDto> {
  const res = await apiClient.post<SaasBlogPostDto>("/saas/admin/blog", toFormData(input, coverImage), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function updateBlogPost(
  id: number,
  input: UpdateSaasBlogPostInput,
  coverImage?: File | null
): Promise<SaasBlogPostDto> {
  const res = await apiClient.patch<SaasBlogPostDto>(
    `/saas/admin/blog/${id}`,
    toFormData(input, coverImage),
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
}

export async function deleteBlogPost(id: number): Promise<void> {
  await apiClient.delete(`/saas/admin/blog/${id}`);
}

export async function publishBlogPost(id: number): Promise<SaasBlogPostDto> {
  const res = await apiClient.post<SaasBlogPostDto>(`/saas/admin/blog/${id}/publish`);
  return res.data;
}

export async function unpublishBlogPost(id: number): Promise<SaasBlogPostDto> {
  const res = await apiClient.post<SaasBlogPostDto>(`/saas/admin/blog/${id}/unpublish`);
  return res.data;
}
