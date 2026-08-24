import {
  ListSupportTicketsQuery,
  SupportTicketDto,
  SupportTicketPaginatedResult,
  SupportTicketPriority,
} from "@hrm-plus/shared";
import { apiClient } from "./client";

export interface AdminTicketReplyFormInput {
  message: string;
  priority?: SupportTicketPriority;
  attachment?: File;
}

export async function listAdminSupportTickets(
  query: ListSupportTicketsQuery = {}
): Promise<SupportTicketPaginatedResult> {
  const res = await apiClient.get<SupportTicketPaginatedResult>("/saas/admin/support-tickets", { params: query });
  return res.data;
}

export async function getAdminSupportTicket(id: number): Promise<SupportTicketDto> {
  const res = await apiClient.get<SupportTicketDto>(`/saas/admin/support-tickets/${id}`);
  return res.data;
}

export async function replyToAdminSupportTicket(
  id: number,
  input: AdminTicketReplyFormInput
): Promise<SupportTicketDto> {
  const formData = new FormData();
  formData.append("message", input.message);
  if (input.priority) formData.append("priority", input.priority);
  if (input.attachment) formData.append("attachment", input.attachment);
  const res = await apiClient.post<SupportTicketDto>(`/saas/admin/support-tickets/${id}/replies`, formData);
  return res.data;
}

export async function updateAdminSupportTicketStatus(
  id: number,
  status: SupportTicketDto["status"]
): Promise<SupportTicketDto> {
  const res = await apiClient.patch<SupportTicketDto>(`/saas/admin/support-tickets/${id}/status`, { status });
  return res.data;
}
