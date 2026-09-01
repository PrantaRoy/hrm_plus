import { RequestHandler } from "express";
import { updateSchedulerSettingsSchema } from "./schedulerSettings.schemas";
import * as schedulerSettingsService from "./schedulerSettings.service";

export const getSchedulerSettingsHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await schedulerSettingsService.getSchedulerSettings(req.prisma!));
  } catch (err) {
    next(err);
  }
};

export const updateSchedulerSettingsHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updateSchedulerSettingsSchema.parse(req.body);
    res.json(await schedulerSettingsService.updateSchedulerSettings(req.prisma!, input, req.user!.id));
  } catch (err) {
    next(err);
  }
};
