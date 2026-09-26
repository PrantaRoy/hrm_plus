import { CreateStickyNoteInput, ListStickyNotesQuery, StickyNoteDto, StickyNoteStatus } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listStickyNotes(params?: ListStickyNotesQuery): Promise<StickyNoteDto[]> {
  const res = await apiClient.get<StickyNoteDto[]>("/sticky-notes", { params });
  return res.data;
}

export async function createStickyNote(input: CreateStickyNoteInput): Promise<StickyNoteDto> {
  const res = await apiClient.post<StickyNoteDto>("/sticky-notes", input);
  return res.data;
}

export async function updateStickyNoteStatus(
  id: number,
  status: Extract<StickyNoteStatus, "DONE" | "DISMISSED">
): Promise<StickyNoteDto> {
  const res = await apiClient.patch<StickyNoteDto>(`/sticky-notes/${id}/status`, { status });
  return res.data;
}
