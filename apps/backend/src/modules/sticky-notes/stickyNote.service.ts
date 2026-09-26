import { PrismaClient } from "../../../generated/tenant";
import { ListStickyNotesQuery, StickyNoteDto } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { toStickyNoteDto } from "./stickyNote.mapper";
import { createStickyNoteSchema, updateStickyNoteStatusSchema } from "./stickyNote.schemas";
import { z } from "zod";

type CreateStickyNoteInput = z.infer<typeof createStickyNoteSchema>;
type UpdateStickyNoteStatusInput = z.infer<typeof updateStickyNoteStatusSchema>;

export async function createStickyNote(
  prisma: PrismaClient,
  userId: number,
  input: CreateStickyNoteInput
): Promise<StickyNoteDto> {
  const note = await prisma.stickyNote.create({
    data: {
      userId,
      content: input.content,
      priority: input.priority,
      deadline: input.deadline ?? null,
    },
  });
  return toStickyNoteDto(note);
}

export async function listStickyNotes(
  prisma: PrismaClient,
  userId: number,
  query: ListStickyNotesQuery
): Promise<StickyNoteDto[]> {
  const notes = await prisma.stickyNote.findMany({
    where: { userId, status: query.status ?? "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  return notes.map(toStickyNoteDto);
}

export async function updateStickyNoteStatus(
  prisma: PrismaClient,
  userId: number,
  noteId: number,
  input: UpdateStickyNoteStatusInput
): Promise<StickyNoteDto> {
  const note = await prisma.stickyNote.findUnique({ where: { id: noteId } });
  if (!note || note.userId !== userId) {
    throw ApiError.notFound("Sticky note not found");
  }
  const updated = await prisma.stickyNote.update({
    where: { id: noteId },
    data: { status: input.status },
  });
  return toStickyNoteDto(updated);
}
