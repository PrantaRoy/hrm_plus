import { StickyNoteDto, StickyNotePriority, StickyNoteStatus } from "@hrm-plus/shared";

interface StickyNoteRow {
  id: number;
  content: string;
  priority: string;
  deadline: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toStickyNoteDto(note: StickyNoteRow): StickyNoteDto {
  return {
    id: note.id,
    content: note.content,
    priority: note.priority as StickyNotePriority,
    deadline: note.deadline?.toISOString() ?? null,
    status: note.status as StickyNoteStatus,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}
