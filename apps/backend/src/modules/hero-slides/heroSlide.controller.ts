import { RequestHandler } from "express";
import { createHeroSlideSchema, reorderHeroSlidesSchema, updateHeroSlideSchema } from "./heroSlide.schemas";
import * as heroSlideService from "./heroSlide.service";
import { ApiError } from "../../utils/ApiError";

export const listHeroSlidesHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await heroSlideService.listHeroSlides(req.prisma!));
  } catch (err) {
    next(err);
  }
};

export const getHeroSlideHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid hero slide id");
    res.json(await heroSlideService.getHeroSlideById(req.prisma!, id));
  } catch (err) {
    next(err);
  }
};

export const createHeroSlideHandler: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) throw ApiError.badRequest("Media file is required");
    const input = createHeroSlideSchema.parse(req.body);
    const media = { buffer: req.file.buffer, originalName: req.file.originalname, mimeType: req.file.mimetype };
    res.status(201).json(await heroSlideService.createHeroSlide(req.prisma!, input, media));
  } catch (err) {
    next(err);
  }
};

export const updateHeroSlideHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid hero slide id");
    const input = updateHeroSlideSchema.parse(req.body);
    const media = req.file
      ? { buffer: req.file.buffer, originalName: req.file.originalname, mimeType: req.file.mimetype }
      : undefined;
    res.json(await heroSlideService.updateHeroSlide(req.prisma!, id, input, media));
  } catch (err) {
    next(err);
  }
};

export const deleteHeroSlideHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid hero slide id");
    await heroSlideService.deleteHeroSlide(req.prisma!, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const reorderHeroSlidesHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = reorderHeroSlidesSchema.parse(req.body);
    res.json(await heroSlideService.reorderHeroSlides(req.prisma!, input.orderedIds));
  } catch (err) {
    next(err);
  }
};
