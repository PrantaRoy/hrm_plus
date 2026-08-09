import { BlogPostDto, BlogPostStatus, PublicBlogPostDto } from "@hrm-plus/shared";

type BlogPostRecord = {
  id: number;
  title: string;
  slug: string;
  featuredImageUrl: string | null;
  excerpt: string | null;
  content: string;
  authorName: string | null;
  authorAvatarUrl: string | null;
  status: string;
  publishedAt: Date | null;
  createdById: number;
  createdAt: Date;
  updatedAt: Date;
};

export function toBlogPostDto(post: BlogPostRecord): BlogPostDto {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    featuredImageUrl: post.featuredImageUrl,
    excerpt: post.excerpt,
    content: post.content,
    authorName: post.authorName,
    authorAvatarUrl: post.authorAvatarUrl,
    status: post.status as BlogPostStatus,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    createdById: post.createdById,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

export function toPublicBlogPostDto(post: BlogPostRecord): PublicBlogPostDto {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    featuredImageUrl: post.featuredImageUrl,
    excerpt: post.excerpt,
    content: post.content,
    authorName: post.authorName,
    authorAvatarUrl: post.authorAvatarUrl,
    status: post.status as BlogPostStatus,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
  };
}
