import { CreateTicketCategoryInput, TicketCategoryDto, UpdateTicketCategoryInput } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listAdminTicketCategories(): Promise<TicketCategoryDto[]> {
  const res = await apiClient.get<TicketCategoryDto[]>("/saas/admin/ticket-categories");
  return res.data;
}

export async function createTicketCategory(input: CreateTicketCategoryInput): Promise<TicketCategoryDto> {
  const res = await apiClient.post<TicketCategoryDto>("/saas/admin/ticket-categories", input);
  return res.data;
}

export async function updateTicketCategory(id: number, input: UpdateTicketCategoryInput): Promise<TicketCategoryDto> {
  const res = await apiClient.patch<TicketCategoryDto>(`/saas/admin/ticket-categories/${id}`, input);
  return res.data;
}

export async function deleteTicketCategory(id: number): Promise<void> {
  await apiClient.delete(`/saas/admin/ticket-categories/${id}`);
}
