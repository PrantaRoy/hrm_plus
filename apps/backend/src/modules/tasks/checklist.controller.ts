import { RequestHandler } from "express";
import { resolveActor } from "../projects/projectAccess";
import {
  checklistParamSchema,
  checklistTitleSchema,
  checklistToggleSchema,
  taskIdParamSchema,
} from "./task.schemas";
import * as checklistService from "./checklist.service";

export const addChecklistItemHandler: RequestHandler = async (req, res, next) => {
  try {
    const { id } = taskIdParamSchema.parse(req.params);
    const { title } = checklistTitleSchema.parse(req.body);
    const actor = await resolveActor(req.prisma!, req.user!);
    res.status(201).json(await checklistService.addChecklistItem(req.prisma!, actor, id, title));
  } catch (err) {
    next(err);
  }
};

export const renameChecklistItemHandler: RequestHandler = async (req, res, next) => {
  try {
    const { id, cid } = checklistParamSchema.parse(req.params);
    const { title } = checklistTitleSchema.parse(req.body);
    const actor = await resolveActor(req.prisma!, req.user!);
    res.json(await checklistService.renameChecklistItem(req.prisma!, actor, id, cid, title));
  } catch (err) {
    next(err);
  }
};

export const deleteChecklistItemHandler: RequestHandler = async (req, res, next) => {
  try {
    const { id, cid } = checklistParamSchema.parse(req.params);
    const actor = await resolveActor(req.prisma!, req.user!);
    await checklistService.deleteChecklistItem(req.prisma!, actor, id, cid);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const completeChecklistItemHandler: RequestHandler = async (req, res, next) => {
  try {
    const { id, cid } = checklistParamSchema.parse(req.params);
    const { value } = checklistToggleSchema.parse(req.body ?? {});
    const actor = await resolveActor(req.prisma!, req.user!);
    res.json(await checklistService.setChecklistCompleted(req.prisma!, actor, id, cid, value));
  } catch (err) {
    next(err);
  }
};

export const verifyChecklistItemHandler: RequestHandler = async (req, res, next) => {
  try {
    const { id, cid } = checklistParamSchema.parse(req.params);
    const { value } = checklistToggleSchema.parse(req.body ?? {});
    const actor = await resolveActor(req.prisma!, req.user!);
    res.json(await checklistService.setChecklistVerified(req.prisma!, actor, id, cid, value));
  } catch (err) {
    next(err);
  }
};
