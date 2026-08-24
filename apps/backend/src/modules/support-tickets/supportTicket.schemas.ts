import { z } from "zod";
import { SUPPORT_TICKET_PRIORITIES, SUPPORT_TICKET_STATUSES } from "@hrm-plus/shared";

export const createSupportTicketSchema = z.object({
  categoryId: z.coerce.number().int(),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
});

export const createTicketReplySchema = z.object({
  message: z.string().trim().min(1).max(5000),
  priority: z.enum(SUPPORT_TICKET_PRIORITIES).optional(),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(SUPPORT_TICKET_STATUSES),
});

const baseListQuery = {
  status: z.enum(SUPPORT_TICKET_STATUSES).optional(),
  priority: z.enum(SUPPORT_TICKET_PRIORITIES).optional(),
  categoryId: z.coerce.number().int().optional(),
  dateFrom: z.string().min(1).optional(),
  dateTo: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
};

export const listTenantTicketsQuerySchema = z.object(baseListQuery);

export const listSaasTicketsQuerySchema = z.object({
  ...baseListQuery,
  tenantId: z.coerce.number().int().optional(),
});
