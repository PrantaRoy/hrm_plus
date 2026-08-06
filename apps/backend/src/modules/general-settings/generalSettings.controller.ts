import { RequestHandler } from "express";
import { updateGeneralSettingsSchema } from "./generalSettings.schemas";
import * as generalSettingsService from "./generalSettings.service";
import { ApiError } from "../../utils/ApiError";

export const getGeneralSettingsHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await generalSettingsService.getGeneralSettings(req.prisma!));
  } catch (err) {
    next(err);
  }
};

export const updateGeneralSettingsHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updateGeneralSettingsSchema.parse(req.body);
    res.json(await generalSettingsService.updateGeneralSettings(req.prisma!, input, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const uploadGeneralLogoHandler: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) throw ApiError.badRequest("Logo file is required");
    const result = await generalSettingsService.setGeneralLogo(
      req.prisma!,
      { buffer: req.file.buffer, originalName: req.file.originalname, mimeType: req.file.mimetype },
      req.user!.id
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const uploadGeneralFaviconHandler: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) throw ApiError.badRequest("Favicon file is required");
    const result = await generalSettingsService.setGeneralFavicon(
      req.prisma!,
      { buffer: req.file.buffer, originalName: req.file.originalname, mimeType: req.file.mimetype },
      req.user!.id
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};
