import { RequestHandler } from "express";
import { ApiError } from "../../utils/ApiError";
import {
  createStickyNoteSchema,
  listStickyNotesQuerySchema,
  updateStickyNoteStatusSchema,
} from "./stickyNote.schemas";
import * as stickyNoteService from "./stickyNote.service";

export const listStickyNotesHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listStickyNotesQuerySchema.parse(req.query);
    res.json(await stickyNoteService.listStickyNotes(req.prisma!, req.user!.id, query));
  } catch (err) {
    next(err);
  }
};

export const createStickyNoteHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createStickyNoteSchema.parse(req.body);
    res.status(201).json(await stickyNoteService.createStickyNote(req.prisma!, req.user!.id, input));
  } catch (err) {
    next(err);
  }
};

export const updateStickyNoteStatusHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid sticky note id");
    const input = updateStickyNoteStatusSchema.parse(req.body);
    res.json(await stickyNoteService.updateStickyNoteStatus(req.prisma!, req.user!.id, id, input));
  } catch (err) {
    next(err);
  }
};
