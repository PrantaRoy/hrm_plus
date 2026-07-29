import { RequestHandler } from "express";
import { ApiError } from "../../utils/ApiError";
import {
  autoGenerateRosterSchema,
  createRosterSchema,
  listRostersQuerySchema,
  updateRosterSchema,
} from "./roster.schemas";
import * as rosterService from "./roster.service";

export const listRostersHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listRostersQuerySchema.parse(req.query);
    res.json(await rosterService.listRosters(req.prisma!, query));
  } catch (err) {
    next(err);
  }
};

export const getMyScheduleHandler: RequestHandler = async (req, res, next) => {
  try {
    const employee = await req.prisma!.employee.findUnique({ where: { userId: req.user!.id } });
    if (!employee) {
      throw ApiError.notFound("No employee profile linked to this account");
    }
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    res.json(await rosterService.getMyScheduleForEmployee(req.prisma!, employee.id, { startDate, endDate }));
  } catch (err) {
    next(err);
  }
};

export const getRosterHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await rosterService.getRosterById(req.prisma!, Number(req.params.id)));
  } catch (err) {
    next(err);
  }
};

export const createRosterHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createRosterSchema.parse(req.body);
    res.status(201).json(await rosterService.createRoster(req.prisma!, input, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const updateRosterHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updateRosterSchema.parse(req.body);
    res.json(await rosterService.updateRoster(req.prisma!, Number(req.params.id), input, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const deleteRosterHandler: RequestHandler = async (req, res, next) => {
  try {
    await rosterService.deleteRoster(req.prisma!, Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const autoGenerateRosterHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = autoGenerateRosterSchema.parse(req.body ?? {});
    res.json(
      await rosterService.autoGenerateRoster(
        req.prisma!,
        Number(req.params.id),
        input.overwriteExisting,
        req.user!.id
      )
    );
  } catch (err) {
    next(err);
  }
};

export const approveRosterHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await rosterService.approveRoster(req.prisma!, Number(req.params.id), req.user!.id));
  } catch (err) {
    next(err);
  }
};
