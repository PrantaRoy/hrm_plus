import { PrismaClient, Prisma } from "../../../generated/tenant";
import { BlogPostDto, CreateBlogPostInput, ListBlogPostsQuery, UpdateBlogPostInput } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { getStorageDriver } from "../../storage";
import { generateUniqueSlug } from "../../utils/slug";
import { toBlogPostDto } from "./blogPost.mapper";

type ImageFile = { buffer: Buffer; originalName: string; mimeType: string };

async function generateUniqueBlogSlug(prisma: PrismaClient, title: string): Promise<string> {
  return generateUniqueSlug(title, "post", async (slug) =>
    Boolean(await prisma.blogPost.findUnique({ where: { slug } }))
  );
}

export async function listBlogPosts(prisma: PrismaClient, query: ListBlogPostsQuery): Promise<BlogPostDto[]> {
  const where: Prisma.BlogPostWhereInput = query.status ? { status: query.status } : {};
  const posts = await prisma.blogPost.findMany({ where, orderBy: { createdAt: "desc" } });
  return posts.map(toBlogPostDto);
}

export async function getBlogPostById(prisma: PrismaClient, id: number): Promise<BlogPostDto> {
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) {
    throw ApiError.notFound("Blog post not found");
  }
  return toBlogPostDto(post);
}

export async function createBlogPost(
  prisma: PrismaClient,
  input: CreateBlogPostInput,
  createdById: number,
  featuredImage?: ImageFile
): Promise<BlogPostDto> {
  const slug = await generateUniqueBlogSlug(prisma, input.title);

  let imageFields: { featuredImageUrl?: string; featuredImageKey?: string } = {};
  if (featuredImage) {
    const storage = getStorageDriver();
    const stored = await storage.save({
      buffer: featuredImage.buffer,
      originalName: featuredImage.originalName,
      mimeType: featuredImage.mimeType,
      folder: "website-cms/blog",
    });
    imageFields = { featuredImageUrl: stored.url, featuredImageKey: stored.key };
  }

  const created = await prisma.blogPost.create({
    data: {
      title: input.title,
      slug,
      excerpt: input.excerpt,
      content: input.content,
      authorName: input.authorName,
      createdById,
      ...imageFields,
    },
  });
  return toBlogPostDto(created);
}

async function getBlogPostOrThrow(prisma: PrismaClient, id: number) {
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) {
    throw ApiError.notFound("Blog post not found");
  }
  return post;
}

export async function updateBlogPost(
  prisma: PrismaClient,
  id: number,
  input: UpdateBlogPostInput,
  updatedById: number,
  featuredImage?: ImageFile
): Promise<BlogPostDto> {
  const existing = await getBlogPostOrThrow(prisma, id);

  let imageFields: { featuredImageUrl?: string; featuredImageKey?: string } = {};
  if (featuredImage) {
    const storage = getStorageDriver();
    const stored = await storage.save({
      buffer: featuredImage.buffer,
      originalName: featuredImage.originalName,
      mimeType: featuredImage.mimeType,
      folder: "website-cms/blog",
    });
    if (existing.featuredImageKey) {
      await storage.delete(existing.featuredImageKey).catch(() => undefined);
    }
    imageFields = { featuredImageUrl: stored.url, featuredImageKey: stored.key };
  }

  const updated = await prisma.blogPost.update({
    where: { id },
    data: { ...input, updatedById, ...imageFields },
  });
  return toBlogPostDto(updated);
}

export async function deleteBlogPost(prisma: PrismaClient, id: number): Promise<void> {
  const existing = await getBlogPostOrThrow(prisma, id);
  if (existing.featuredImageKey) {
    const storage = getStorageDriver();
    await storage.delete(existing.featuredImageKey).catch(() => undefined);
  }
  await prisma.blogPost.delete({ where: { id } });
}

export async function publishBlogPost(prisma: PrismaClient, id: number, updatedById: number): Promise<BlogPostDto> {
  const existing = await getBlogPostOrThrow(prisma, id);
  const updated = await prisma.blogPost.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: existing.publishedAt ?? new Date(), updatedById },
  });
  return toBlogPostDto(updated);
}

export async function unpublishBlogPost(prisma: PrismaClient, id: number, updatedById: number): Promise<BlogPostDto> {
  await getBlogPostOrThrow(prisma, id);
  const updated = await prisma.blogPost.update({
    where: { id },
    data: { status: "DRAFT", updatedById },
  });
  return toBlogPostDto(updated);
}
