import { RequestHandler } from "express";
import { updateAiSettingsSchema } from "./aiSettings.schemas";
import * as aiSettingsService from "./aiSettings.service";

export const getAiSettingsHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await aiSettingsService.getAiSettings(req.prisma!));
  } catch (err) {
    next(err);
  }
};

export const updateAiSettingsHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updateAiSettingsSchema.parse(req.body);
    res.json(await aiSettingsService.updateAiSettings(req.prisma!, input, req.user!.id));
  } catch (err) {
    next(err);
  }
};
