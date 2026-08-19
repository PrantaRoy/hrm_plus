import { RequestHandler } from "express";
import { updatePayrollSettingsSchema } from "./payrollSettings.schemas";
import * as payrollSettingsService from "./payrollSettings.service";

export const getPayrollSettingsHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await payrollSettingsService.getPayrollSettings(req.prisma!));
  } catch (err) {
    next(err);
  }
};

export const updatePayrollSettingsHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updatePayrollSettingsSchema.parse(req.body);
    res.json(await payrollSettingsService.updatePayrollSettings(req.prisma!, input, req.user!.id));
  } catch (err) {
    next(err);
  }
};
