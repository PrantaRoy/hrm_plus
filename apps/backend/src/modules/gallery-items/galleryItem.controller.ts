import { RequestHandler } from "express";
import { createGalleryItemSchema, reorderGalleryItemsSchema, updateGalleryItemSchema } from "./galleryItem.schemas";
import * as galleryItemService from "./galleryItem.service";
import { ApiError } from "../../utils/ApiError";

type MulterFields = { [fieldname: string]: Express.Multer.File[] };

function toFile(file?: Express.Multer.File) {
  return file ? { buffer: file.buffer, originalName: file.originalname, mimeType: file.mimetype } : undefined;
}

export const listGalleryItemsHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await galleryItemService.listGalleryItems(req.prisma!));
  } catch (err) {
    next(err);
  }
};

export const createGalleryItemHandler: RequestHandler = async (req, res, next) => {
  try {
    const files = req.files as MulterFields | undefined;
    const image = toFile(files?.image?.[0]);
    if (!image) throw ApiError.badRequest("Image file is required");
    const thumbnail = toFile(files?.thumbnail?.[0]);
    const input = createGalleryItemSchema.parse(req.body);
    res.status(201).json(await galleryItemService.createGalleryItem(req.prisma!, input, image, thumbnail));
  } catch (err) {
    next(err);
  }
};

export const updateGalleryItemHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid gallery item id");
    const files = req.files as MulterFields | undefined;
    const image = toFile(files?.image?.[0]);
    const thumbnail = toFile(files?.thumbnail?.[0]);
    const input = updateGalleryItemSchema.parse(req.body);
    res.json(await galleryItemService.updateGalleryItem(req.prisma!, id, input, image, thumbnail));
  } catch (err) {
    next(err);
  }
};

export const deleteGalleryItemHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid gallery item id");
    await galleryItemService.deleteGalleryItem(req.prisma!, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const reorderGalleryItemsHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = reorderGalleryItemsSchema.parse(req.body);
    res.json(await galleryItemService.reorderGalleryItems(req.prisma!, input.orderedIds));
  } catch (err) {
    next(err);
  }
};
