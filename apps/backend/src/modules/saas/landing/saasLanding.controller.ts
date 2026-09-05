import { RequestHandler } from "express";
import { ApiError } from "../../../utils/ApiError";
import {
  createSaasLandingBlockSchema,
  listSaasLandingBlocksQuerySchema,
  reorderSaasLandingBlocksSchema,
  saasSettingsImageFieldSchema,
  updateSaasLandingBlockSchema,
  updateSaasSiteSettingsSchema,
} from "./saasLanding.schemas";
import * as settingsService from "./saasSiteSettings.service";
import * as blockService from "./saasLandingBlock.service";
import { getSaasLandingContent } from "./saasLandingContent.service";

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw ApiError.badRequest("Invalid id");
  return id;
}

function fileFromReq(req: Parameters<RequestHandler>[0]) {
  if (!req.file) throw ApiError.badRequest("A file is required");
  return { buffer: req.file.buffer, originalName: req.file.originalname, mimeType: req.file.mimetype };
}

export const getLandingContentHandler: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await getSaasLandingContent());
  } catch (err) {
    next(err);
  }
};

export const getLandingSettingsHandler: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await settingsService.getSaasSiteSettings());
  } catch (err) {
    next(err);
  }
};

export const updateLandingSettingsHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updateSaasSiteSettingsSchema.parse(req.body);
    res.json(await settingsService.updateSaasSiteSettings(input));
  } catch (err) {
    next(err);
  }
};

export const uploadLandingImageHandler: RequestHandler = async (req, res, next) => {
  try {
    const field = saasSettingsImageFieldSchema.parse(req.params.field);
    res.json(await settingsService.setSaasSettingsImage(field, fileFromReq(req)));
  } catch (err) {
    next(err);
  }
};

export const listLandingBlocksHandler: RequestHandler = async (req, res, next) => {
  try {
    const { blockType } = listSaasLandingBlocksQuerySchema.parse(req.query);
    res.json(await blockService.listSaasLandingBlocks(blockType));
  } catch (err) {
    next(err);
  }
};

export const createLandingBlockHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createSaasLandingBlockSchema.parse(req.body);
    res.status(201).json(await blockService.createSaasLandingBlock(input));
  } catch (err) {
    next(err);
  }
};

export const updateLandingBlockHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updateSaasLandingBlockSchema.parse(req.body);
    res.json(await blockService.updateSaasLandingBlock(parseId(req.params.id), input));
  } catch (err) {
    next(err);
  }
};

export const deleteLandingBlockHandler: RequestHandler = async (req, res, next) => {
  try {
    await blockService.deleteSaasLandingBlock(parseId(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const reorderLandingBlocksHandler: RequestHandler = async (req, res, next) => {
  try {
    const { blockType, orderedIds } = reorderSaasLandingBlocksSchema.parse(req.body);
    res.json(await blockService.reorderSaasLandingBlocks(blockType, orderedIds));
  } catch (err) {
    next(err);
  }
};

export const uploadLandingBlockMediaHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await blockService.setSaasLandingBlockMedia(parseId(req.params.id), fileFromReq(req)));
  } catch (err) {
    next(err);
  }
};
