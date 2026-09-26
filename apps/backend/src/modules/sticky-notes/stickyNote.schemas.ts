import { z } from "zod";
import { STICKY_NOTE_PRIORITIES, STICKY_NOTE_STATUSES } from "@hrm-plus/shared";

export const createStickyNoteSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  priority: z.enum(STICKY_NOTE_PRIORITIES).default("REGULAR"),
  deadline: z.coerce.date().optional().nullable(),
});

export const listStickyNotesQuerySchema = z.object({
  status: z.enum(STICKY_NOTE_STATUSES).optional(),
});

export const updateStickyNoteStatusSchema = z.object({
  status: z.enum(["DONE", "DISMISSED"]),
});
