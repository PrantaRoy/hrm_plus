import { RequestHandler } from "express";
import { ApiError } from "../../../utils/ApiError";
import { listSaasBlogPostsQuerySchema } from "./saasBlogPost.schemas";
import * as service from "./saasBlogPost.service";

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw ApiError.badRequest("Invalid blog post id");
  return id;
}

function coverFromReq(req: Parameters<RequestHandler>[0]) {
  if (!req.file) return undefined;
  return { buffer: req.file.buffer, originalName: req.file.originalname, mimeType: req.file.mimetype };
}

export const listPublicSaasBlogPostsHandler: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await service.listPublicSaasBlogPosts());
  } catch (err) {
    next(err);
  }
};

export const getPublicSaasBlogPostHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await service.getPublicSaasBlogPostBySlug(req.params.slug));
  } catch (err) {
    next(err);
  }
};

export const listSaasBlogPostsHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listSaasBlogPostsQuerySchema.parse(req.query);
    res.json(await service.listSaasBlogPosts(query));
  } catch (err) {
    next(err);
  }
};

export const getSaasBlogPostHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await service.getSaasBlogPostById(parseId(req.params.id)));
  } catch (err) {
    next(err);
  }
};

export const createSaasBlogPostHandler: RequestHandler = async (req, res, next) => {
  try {
    const post = await service.createSaasBlogPost(
      req.body,
      req.saasAdmin?.id ?? null,
      coverFromReq(req)
    );
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
};

export const updateSaasBlogPostHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await service.updateSaasBlogPost(parseId(req.params.id), req.body, coverFromReq(req)));
  } catch (err) {
    next(err);
  }
};

export const deleteSaasBlogPostHandler: RequestHandler = async (req, res, next) => {
  try {
    await service.deleteSaasBlogPost(parseId(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const publishSaasBlogPostHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await service.publishSaasBlogPost(parseId(req.params.id)));
  } catch (err) {
    next(err);
  }
};

export const unpublishSaasBlogPostHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await service.unpublishSaasBlogPost(parseId(req.params.id)));
  } catch (err) {
    next(err);
  }
};
