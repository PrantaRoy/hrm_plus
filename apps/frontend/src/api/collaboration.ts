import {
  AttachmentDto,
  CommentDto,
  CreateCommentInput,
  UpdateCommentInput,
} from "@hrm-plus/shared";
import { apiClient } from "./client";

/** Comments and attachments are polymorphic; they hang off either a task or a project. */
export type OwnerKind = "task" | "project";

const base = (kind: OwnerKind, id: number) => `/${kind === "task" ? "tasks" : "projects"}/${id}`;

export async function listComments(kind: OwnerKind, id: number): Promise<CommentDto[]> {
  const res = await apiClient.get<CommentDto[]>(`${base(kind, id)}/comments`);
  return res.data;
}

export async function createComment(kind: OwnerKind, id: number, input: CreateCommentInput): Promise<CommentDto> {
  const res = await apiClient.post<CommentDto>(`${base(kind, id)}/comments`, input);
  return res.data;
}

export async function updateComment(commentId: number, input: UpdateCommentInput): Promise<CommentDto> {
  const res = await apiClient.patch<CommentDto>(`/comments/${commentId}`, input);
  return res.data;
}

export async function deleteComment(commentId: number): Promise<void> {
  await apiClient.delete(`/comments/${commentId}`);
}

export async function listAttachments(kind: OwnerKind, id: number): Promise<AttachmentDto[]> {
  const res = await apiClient.get<AttachmentDto[]>(`${base(kind, id)}/attachments`);
  return res.data;
}

export async function uploadAttachment(kind: OwnerKind, id: number, file: File): Promise<AttachmentDto> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiClient.post<AttachmentDto>(`${base(kind, id)}/attachments`, form);
  return res.data;
}

export async function deleteAttachment(attachmentId: number): Promise<void> {
  await apiClient.delete(`/attachments/${attachmentId}`);
}
