export const BLOG_POST_STATUSES = ["DRAFT", "PUBLISHED"] as const;
export type BlogPostStatus = (typeof BLOG_POST_STATUSES)[number];

export interface BlogPostDto {
  id: number;
  title: string;
  slug: string;
  featuredImageUrl: string | null;
  excerpt: string | null;
  content: string;
  authorName: string | null;
  authorAvatarUrl: string | null;
  status: BlogPostStatus;
  publishedAt: string | null;
  createdById: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlogPostInput {
  title: string;
  excerpt?: string;
  content: string;
  authorName?: string;
}

export type UpdateBlogPostInput = Partial<CreateBlogPostInput>;

export type PublicBlogPostDto = Omit<
  BlogPostDto,
  "createdById" | "createdAt" | "updatedAt"
>;

export interface ListBlogPostsQuery {
  status?: BlogPostStatus;
}
