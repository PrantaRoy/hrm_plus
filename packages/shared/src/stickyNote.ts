export const STICKY_NOTE_PRIORITIES = ["HIGH", "MEDIUM", "REGULAR"] as const;
export type StickyNotePriority = (typeof STICKY_NOTE_PRIORITIES)[number];

export const STICKY_NOTE_STATUSES = ["ACTIVE", "DONE", "DISMISSED"] as const;
export type StickyNoteStatus = (typeof STICKY_NOTE_STATUSES)[number];

export interface StickyNoteDto {
  id: number;
  content: string;
  priority: StickyNotePriority;
  deadline: string | null;
  status: StickyNoteStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStickyNoteInput {
  content: string;
  priority?: StickyNotePriority;
  deadline?: string | null;
}

export interface ListStickyNotesQuery {
  status?: StickyNoteStatus;
}
