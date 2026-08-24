import { TicketCategoryDto } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listTicketCategories(): Promise<TicketCategoryDto[]> {
  const res = await apiClient.get<TicketCategoryDto[]>("/ticket-categories");
  return res.data;
}
