import { RequestHandler } from "express";
import { z } from "zod";
import { createPayCycleSchema, updatePayCycleSchema } from "./payCycle.schemas";
import * as payCycleService from "./payCycle.service";
import { ApiError } from "../../utils/ApiError";

const assignEmployeesSchema = z.object({ employeeIds: z.array(z.number().int()).min(1) });

export const listPayCyclesHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await payCycleService.listPayCycles(req.prisma!));
  } catch (err) {
    next(err);
  }
};

export const getPayCycleHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid pay cycle id");
    res.json(await payCycleService.getPayCycleById(req.prisma!, id));
  } catch (err) {
    next(err);
  }
};

export const createPayCycleHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createPayCycleSchema.parse(req.body);
    res.status(201).json(await payCycleService.createPayCycle(req.prisma!, input, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const updatePayCycleHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid pay cycle id");
    const input = updatePayCycleSchema.parse(req.body);
    res.json(await payCycleService.updatePayCycle(req.prisma!, id, input, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const assignEmployeesHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid pay cycle id");
    const { employeeIds } = assignEmployeesSchema.parse(req.body);
    res.json(await payCycleService.assignEmployeesToPayCycle(req.prisma!, id, employeeIds));
  } catch (err) {
    next(err);
  }
};
