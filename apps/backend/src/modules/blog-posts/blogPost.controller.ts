import { RequestHandler } from "express";
import { createBlogPostSchema, listBlogPostsQuerySchema, updateBlogPostSchema } from "./blogPost.schemas";
import * as blogPostService from "./blogPost.service";
import { ApiError } from "../../utils/ApiError";

function toFile(file?: Express.Multer.File) {
  return file ? { buffer: file.buffer, originalName: file.originalname, mimeType: file.mimetype } : undefined;
}

export const listBlogPostsHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listBlogPostsQuerySchema.parse(req.query);
    res.json(await blogPostService.listBlogPosts(req.prisma!, query));
  } catch (err) {
    next(err);
  }
};

export const getBlogPostHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid blog post id");
    res.json(await blogPostService.getBlogPostById(req.prisma!, id));
  } catch (err) {
    next(err);
  }
};

export const createBlogPostHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createBlogPostSchema.parse(req.body);
    const image = toFile(req.file);
    res.status(201).json(await blogPostService.createBlogPost(req.prisma!, input, req.user!.id, image));
  } catch (err) {
    next(err);
  }
};

export const updateBlogPostHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid blog post id");
    const input = updateBlogPostSchema.parse(req.body);
    const image = toFile(req.file);
    res.json(await blogPostService.updateBlogPost(req.prisma!, id, input, req.user!.id, image));
  } catch (err) {
    next(err);
  }
};

export const deleteBlogPostHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid blog post id");
    await blogPostService.deleteBlogPost(req.prisma!, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const publishBlogPostHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid blog post id");
    res.json(await blogPostService.publishBlogPost(req.prisma!, id, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const unpublishBlogPostHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid blog post id");
    res.json(await blogPostService.unpublishBlogPost(req.prisma!, id, req.user!.id));
  } catch (err) {
    next(err);
  }
};
