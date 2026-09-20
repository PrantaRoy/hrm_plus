import { RequestHandler } from "express";
import { resolveActor } from "../projects/projectAccess";
import {
  createTimeEntrySchema,
  startTimerSchema,
  stopTimerSchema,
  taskIdParamSchema,
  timeEntryParamSchema,
  updateTimeEntrySchema,
} from "./task.schemas";
import * as timeEntryService from "./timeEntry.service";

export const listTimeEntriesHandler: RequestHandler = async (req, res, next) => {
  try {
    const { id } = taskIdParamSchema.parse(req.params);
    const actor = await resolveActor(req.prisma!, req.user!);
    res.json(await timeEntryService.listTimeEntries(req.prisma!, actor, id));
  } catch (err) {
    next(err);
  }
};

export const createTimeEntryHandler: RequestHandler = async (req, res, next) => {
  try {
    const { id } = taskIdParamSchema.parse(req.params);
    const input = createTimeEntrySchema.parse(req.body);
    const actor = await resolveActor(req.prisma!, req.user!);
    res.status(201).json(await timeEntryService.createTimeEntry(req.prisma!, actor, id, input));
  } catch (err) {
    next(err);
  }
};

export const startTimerHandler: RequestHandler = async (req, res, next) => {
  try {
    const { id } = taskIdParamSchema.parse(req.params);
    const input = startTimerSchema.parse(req.body ?? {});
    const actor = await resolveActor(req.prisma!, req.user!);
    res.status(201).json(await timeEntryService.startTimer(req.prisma!, actor, id, input));
  } catch (err) {
    next(err);
  }
};

export const stopTimerHandler: RequestHandler = async (req, res, next) => {
  try {
    const { id } = taskIdParamSchema.parse(req.params);
    const input = stopTimerSchema.parse(req.body ?? {});
    const actor = await resolveActor(req.prisma!, req.user!);
    res.json(await timeEntryService.stopTimer(req.prisma!, actor, id, input));
  } catch (err) {
    next(err);
  }
};

export const updateTimeEntryHandler: RequestHandler = async (req, res, next) => {
  try {
    const { entryId } = timeEntryParamSchema.parse(req.params);
    const input = updateTimeEntrySchema.parse(req.body);
    const actor = await resolveActor(req.prisma!, req.user!);
    res.json(await timeEntryService.updateTimeEntry(req.prisma!, actor, entryId, input));
  } catch (err) {
    next(err);
  }
};

export const deleteTimeEntryHandler: RequestHandler = async (req, res, next) => {
  try {
    const { entryId } = timeEntryParamSchema.parse(req.params);
    const actor = await resolveActor(req.prisma!, req.user!);
    await timeEntryService.deleteTimeEntry(req.prisma!, actor, entryId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
