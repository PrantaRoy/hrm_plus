import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import {
  createStickyNoteHandler,
  listStickyNotesHandler,
  updateStickyNoteStatusHandler,
} from "./stickyNote.controller";

export const stickyNoteRouter = Router();

stickyNoteRouter.use(requireAuth);

stickyNoteRouter.get("/", listStickyNotesHandler);
stickyNoteRouter.post("/", createStickyNoteHandler);
stickyNoteRouter.patch("/:id/status", updateStickyNoteStatusHandler);
