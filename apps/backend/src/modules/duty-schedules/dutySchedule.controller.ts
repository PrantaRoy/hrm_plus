import { RequestHandler } from "express";
import {
  createDutyScheduleSchema,
  listDutySchedulesQuerySchema,
  updateDutyScheduleSchema,
} from "./dutySchedule.schemas";
import * as dutyScheduleService from "./dutySchedule.service";

export const listDutySchedulesHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listDutySchedulesQuerySchema.parse(req.query);
    res.json(await dutyScheduleService.listDutySchedules(req.prisma!, query));
  } catch (err) {
    next(err);
  }
};

export const getDutyScheduleHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await dutyScheduleService.getDutyScheduleById(req.prisma!, Number(req.params.id)));
  } catch (err) {
    next(err);
  }
};

export const createDutyScheduleHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createDutyScheduleSchema.parse(req.body);
    res.status(201).json(await dutyScheduleService.createDutySchedule(req.prisma!, input));
  } catch (err) {
    next(err);
  }
};

export const updateDutyScheduleHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updateDutyScheduleSchema.parse(req.body);
    res.json(await dutyScheduleService.updateDutySchedule(req.prisma!, Number(req.params.id), input));
  } catch (err) {
    next(err);
  }
};

export const deleteDutyScheduleHandler: RequestHandler = async (req, res, next) => {
  try {
    await dutyScheduleService.deleteDutySchedule(req.prisma!, Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
