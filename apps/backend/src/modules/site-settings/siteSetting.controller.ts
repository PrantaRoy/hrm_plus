import { RequestHandler } from "express";
import { updateSiteSettingSchema } from "./siteSetting.schemas";
import * as siteSettingService from "./siteSetting.service";
import { ApiError } from "../../utils/ApiError";

export const getSiteSettingsHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await siteSettingService.getSiteSettings(req.prisma!));
  } catch (err) {
    next(err);
  }
};

export const updateSiteSettingsHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updateSiteSettingSchema.parse(req.body);
    res.json(await siteSettingService.updateSiteSettings(req.prisma!, input, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const uploadSiteLogoHandler: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) throw ApiError.badRequest("Logo file is required");
    const result = await siteSettingService.setSiteLogo(
      req.prisma!,
      { buffer: req.file.buffer, originalName: req.file.originalname, mimeType: req.file.mimetype },
      req.user!.id
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const uploadSiteFaviconHandler: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) throw ApiError.badRequest("Favicon file is required");
    const result = await siteSettingService.setSiteFavicon(
      req.prisma!,
      { buffer: req.file.buffer, originalName: req.file.originalname, mimeType: req.file.mimetype },
      req.user!.id
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};
