import {
  PublicSaasBlogPostDto,
  PublicSaasBlogPostListItemDto,
  SaasBlogPostDto,
  SaasBlogPostStatus,
} from "@hrm-plus/shared";
import { SaasBlogPost } from "../../../../generated/control";

export function toSaasBlogPostDto(p: SaasBlogPost): SaasBlogPostDto {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    contentMarkdown: p.contentMarkdown,
    coverImageUrl: p.coverImageUrl,
    coverImageKey: p.coverImageKey,
    authorName: p.authorName,
    status: p.status as SaasBlogPostStatus,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    metaDescription: p.metaDescription,
    createdById: p.createdById,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export function toPublicSaasBlogPostDto(p: SaasBlogPost): PublicSaasBlogPostDto {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    contentMarkdown: p.contentMarkdown,
    coverImageUrl: p.coverImageUrl,
    authorName: p.authorName,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    metaDescription: p.metaDescription,
  };
}

export function toPublicSaasBlogPostListItemDto(p: SaasBlogPost): PublicSaasBlogPostListItemDto {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    coverImageUrl: p.coverImageUrl,
    authorName: p.authorName,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    metaDescription: p.metaDescription,
  };
}
