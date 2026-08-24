import { ListSupportTicketsQuery, SupportTicketDto, SupportTicketPaginatedResult } from "@hrm-plus/shared";
import { apiClient } from "./client";

export interface CreateSupportTicketFormInput {
  categoryId: number;
  subject: string;
  message: string;
  attachment?: File;
}

export interface CreateTicketReplyFormInput {
  message: string;
  attachment?: File;
}

export async function listMySupportTickets(query: ListSupportTicketsQuery = {}): Promise<SupportTicketPaginatedResult> {
  const res = await apiClient.get<SupportTicketPaginatedResult>("/support-tickets", { params: query });
  return res.data;
}

export async function getMySupportTicket(id: number): Promise<SupportTicketDto> {
  const res = await apiClient.get<SupportTicketDto>(`/support-tickets/${id}`);
  return res.data;
}

export async function createSupportTicket(input: CreateSupportTicketFormInput): Promise<SupportTicketDto> {
  const formData = new FormData();
  formData.append("categoryId", String(input.categoryId));
  formData.append("subject", input.subject);
  formData.append("message", input.message);
  if (input.attachment) formData.append("attachment", input.attachment);
  const res = await apiClient.post<SupportTicketDto>("/support-tickets", formData);
  return res.data;
}

export async function replyToSupportTicket(id: number, input: CreateTicketReplyFormInput): Promise<SupportTicketDto> {
  const formData = new FormData();
  formData.append("message", input.message);
  if (input.attachment) formData.append("attachment", input.attachment);
  const res = await apiClient.post<SupportTicketDto>(`/support-tickets/${id}/replies`, formData);
  return res.data;
}
