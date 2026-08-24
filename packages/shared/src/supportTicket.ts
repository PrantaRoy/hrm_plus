import { PaginatedResult } from "./employee";

export const SUPPORT_TICKET_STATUSES = ["Pending", "Open", "Hold", "Closed"] as const;
export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

export const SUPPORT_TICKET_PRIORITIES = ["Urgent", "High", "Medium", "Normal", "Low"] as const;
export type SupportTicketPriority = (typeof SUPPORT_TICKET_PRIORITIES)[number];

export type SupportTicketAuthorType = "Tenant" | "SaasAdmin";

export interface TicketCategoryDto {
  id: number;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CreateTicketCategoryInput {
  name: string;
}

export interface UpdateTicketCategoryInput {
  name?: string;
  isActive?: boolean;
}

export interface SupportTicketReplyDto {
  id: number;
  ticketId: number;
  authorType: SupportTicketAuthorType;
  authorName: string;
  message: string;
  attachmentFileUrl: string | null;
  createdAt: string;
}

export interface SupportTicketDto {
  id: number;
  tenantId: number;
  tenantName: string;
  categoryId: number;
  categoryName: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority | null;
  attachmentFileUrl: string | null;
  createdByUserId: number;
  createdByName: string;
  createdByEmail: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  replies?: SupportTicketReplyDto[];
}

export interface CreateSupportTicketInput {
  categoryId: number;
  subject: string;
  message: string;
}

export interface CreateTicketReplyInput {
  message: string;
  priority?: SupportTicketPriority;
}

export interface UpdateTicketStatusInput {
  status: SupportTicketStatus;
}

export interface ListSupportTicketsQuery {
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  categoryId?: number;
  tenantId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export type SupportTicketPaginatedResult = PaginatedResult<SupportTicketDto>;
