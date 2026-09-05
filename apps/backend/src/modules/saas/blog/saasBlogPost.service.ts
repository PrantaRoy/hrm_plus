import {
  CreateSaasBlogPostInput,
  ListSaasBlogPostsQuery,
  PublicSaasBlogPostDto,
  PublicSaasBlogPostListItemDto,
  SaasBlogPostDto,
  UpdateSaasBlogPostInput,
} from "@hrm-plus/shared";
import { controlClient } from "../../../db/controlClient";
import { ApiError } from "../../../utils/ApiError";
import { getStorageDriver } from "../../../storage";
import { generateUniqueSlug } from "../../../utils/slug";
import {
  createSaasBlogPostSchema,
  updateSaasBlogPostSchema,
} from "./saasBlogPost.schemas";
import {
  toPublicSaasBlogPostDto,
  toPublicSaasBlogPostListItemDto,
  toSaasBlogPostDto,
} from "./saasBlogPost.mapper";

const STORAGE_FOLDER = "saas-landing/blog";

type ImageFile = { buffer: Buffer; originalName: string; mimeType: string };

async function uniqueSlug(title: string): Promise<string> {
  return generateUniqueSlug(title, "post", async (slug) =>
    Boolean(await controlClient.saasBlogPost.findUnique({ where: { slug } }))
  );
}

async function saveCover(file: ImageFile) {
  const stored = await getStorageDriver().save({
    buffer: file.buffer,
    originalName: file.originalName,
    mimeType: file.mimeType,
    folder: STORAGE_FOLDER,
  });
  return { coverImageUrl: stored.url, coverImageKey: stored.key };
}

export async function listSaasBlogPosts(query: ListSaasBlogPostsQuery): Promise<SaasBlogPostDto[]> {
  const posts = await controlClient.saasBlogPost.findMany({
    where: query.status ? { status: query.status } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return posts.map(toSaasBlogPostDto);
}

export async function getSaasBlogPostById(id: number): Promise<SaasBlogPostDto> {
  const post = await controlClient.saasBlogPost.findUnique({ where: { id } });
  if (!post) throw ApiError.notFound("Blog post not found");
  return toSaasBlogPostDto(post);
}

export async function listPublicSaasBlogPosts(): Promise<PublicSaasBlogPostListItemDto[]> {
  const posts = await controlClient.saasBlogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });
  return posts.map(toPublicSaasBlogPostListItemDto);
}

export async function getPublicSaasBlogPostBySlug(slug: string): Promise<PublicSaasBlogPostDto> {
  const post = await controlClient.saasBlogPost.findFirst({
    where: { slug, status: "PUBLISHED" },
  });
  if (!post) throw ApiError.notFound("Blog post not found");
  return toPublicSaasBlogPostDto(post);
}

export async function createSaasBlogPost(
  rawInput: CreateSaasBlogPostInput,
  createdById: number | null,
  coverImage?: ImageFile
): Promise<SaasBlogPostDto> {
  const input = createSaasBlogPostSchema.parse(rawInput);
  const slug = await uniqueSlug(input.title);
  const cover = coverImage ? await saveCover(coverImage) : {};

  const created = await controlClient.saasBlogPost.create({
    data: {
      title: input.title,
      slug,
      excerpt: input.excerpt ?? null,
      contentMarkdown: input.contentMarkdown,
      authorName: input.authorName ?? null,
      metaDescription: input.metaDescription ?? null,
      createdById,
      ...cover,
    },
  });
  return toSaasBlogPostDto(created);
}

export async function updateSaasBlogPost(
  id: number,
  rawInput: UpdateSaasBlogPostInput,
  coverImage?: ImageFile
): Promise<SaasBlogPostDto> {
  const input = updateSaasBlogPostSchema.parse(rawInput);
  const existing = await controlClient.saasBlogPost.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Blog post not found");

  let cover: { coverImageUrl?: string; coverImageKey?: string } = {};
  if (coverImage) {
    cover = await saveCover(coverImage);
    if (existing.coverImageKey) {
      await getStorageDriver().delete(existing.coverImageKey).catch(() => undefined);
    }
  }

  const updated = await controlClient.saasBlogPost.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.excerpt !== undefined ? { excerpt: input.excerpt } : {}),
      ...(input.contentMarkdown !== undefined ? { contentMarkdown: input.contentMarkdown } : {}),
      ...(input.authorName !== undefined ? { authorName: input.authorName } : {}),
      ...(input.metaDescription !== undefined ? { metaDescription: input.metaDescription } : {}),
      ...cover,
    },
  });
  return toSaasBlogPostDto(updated);
}

export async function deleteSaasBlogPost(id: number): Promise<void> {
  const existing = await controlClient.saasBlogPost.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Blog post not found");
  if (existing.coverImageKey) {
    await getStorageDriver().delete(existing.coverImageKey).catch(() => undefined);
  }
  await controlClient.saasBlogPost.delete({ where: { id } });
}

export async function publishSaasBlogPost(id: number): Promise<SaasBlogPostDto> {
  const existing = await controlClient.saasBlogPost.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Blog post not found");
  const updated = await controlClient.saasBlogPost.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: existing.publishedAt ?? new Date() },
  });
  return toSaasBlogPostDto(updated);
}

export async function unpublishSaasBlogPost(id: number): Promise<SaasBlogPostDto> {
  const existing = await controlClient.saasBlogPost.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Blog post not found");
  const updated = await controlClient.saasBlogPost.update({
    where: { id },
    data: { status: "DRAFT" },
  });
  return toSaasBlogPostDto(updated);
}
