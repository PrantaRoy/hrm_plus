export const SAAS_BLOG_POST_STATUSES = ["DRAFT", "PUBLISHED"] as const;
export type SaasBlogPostStatus = (typeof SAAS_BLOG_POST_STATUSES)[number];

export interface SaasBlogPostDto {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  contentMarkdown: string;
  coverImageUrl: string | null;
  coverImageKey: string | null;
  authorName: string | null;
  status: SaasBlogPostStatus;
  publishedAt: string | null;
  metaDescription: string | null;
  createdById: number | null;
  createdAt: string;
  updatedAt: string;
}

export type PublicSaasBlogPostListItemDto = Omit<
  SaasBlogPostDto,
  "contentMarkdown" | "coverImageKey" | "status" | "createdById" | "createdAt" | "updatedAt"
>;

export type PublicSaasBlogPostDto = Omit<
  SaasBlogPostDto,
  "coverImageKey" | "status" | "createdById" | "createdAt" | "updatedAt"
>;

export interface CreateSaasBlogPostInput {
  title: string;
  excerpt?: string | null;
  contentMarkdown: string;
  authorName?: string | null;
  metaDescription?: string | null;
}

export type UpdateSaasBlogPostInput = Partial<CreateSaasBlogPostInput>;

export interface ListSaasBlogPostsQuery {
  status?: SaasBlogPostStatus;
}
