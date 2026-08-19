import { RequestHandler } from "express";
import { createPayRateSchema } from "./payRate.schemas";
import * as payRateService from "./payRate.service";
import { ApiError } from "../../utils/ApiError";

export const listPayRatesHandler: RequestHandler = async (req, res, next) => {
  try {
    const employeeId = Number(req.params.employeeId);
    if (Number.isNaN(employeeId)) throw ApiError.badRequest("Invalid employee id");
    res.json(await payRateService.listPayRatesForEmployee(req.prisma!, employeeId));
  } catch (err) {
    next(err);
  }
};

export const createPayRateHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createPayRateSchema.parse(req.body);
    res.status(201).json(await payRateService.createPayRate(req.prisma!, input, req.user!.id));
  } catch (err) {
    next(err);
  }
};
