import { BlogPostDto, CreateBlogPostInput, ListBlogPostsQuery, UpdateBlogPostInput } from "@hrm-plus/shared";
import { apiClient } from "./client";

function toFormData(input: CreateBlogPostInput | UpdateBlogPostInput, featuredImage?: File): FormData {
  const formData = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined) return;
    formData.append(key, String(value));
  });
  if (featuredImage) formData.append("featuredImage", featuredImage);
  return formData;
}

export async function listBlogPosts(params: ListBlogPostsQuery = {}): Promise<BlogPostDto[]> {
  const res = await apiClient.get<BlogPostDto[]>("/blog-posts", { params });
  return res.data;
}

export async function getBlogPost(id: number): Promise<BlogPostDto> {
  const res = await apiClient.get<BlogPostDto>(`/blog-posts/${id}`);
  return res.data;
}

export async function createBlogPost(input: CreateBlogPostInput, featuredImage?: File): Promise<BlogPostDto> {
  const res = await apiClient.post<BlogPostDto>("/blog-posts", toFormData(input, featuredImage));
  return res.data;
}

export async function updateBlogPost(
  id: number,
  input: UpdateBlogPostInput,
  featuredImage?: File
): Promise<BlogPostDto> {
  const res = await apiClient.patch<BlogPostDto>(`/blog-posts/${id}`, toFormData(input, featuredImage));
  return res.data;
}

export async function deleteBlogPost(id: number): Promise<void> {
  await apiClient.delete(`/blog-posts/${id}`);
}

export async function publishBlogPost(id: number): Promise<BlogPostDto> {
  const res = await apiClient.post<BlogPostDto>(`/blog-posts/${id}/publish`);
  return res.data;
}

export async function unpublishBlogPost(id: number): Promise<BlogPostDto> {
  const res = await apiClient.post<BlogPostDto>(`/blog-posts/${id}/unpublish`);
  return res.data;
}
