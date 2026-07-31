import { z } from "zod";
import { LEAVE_REQUEST_STATUSES } from "@hrm-plus/shared";

export const createLeaveRequestSchema = z.object({
  leaveTypeId: z.coerce.number().int(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().trim().optional(),
});

export const decideLeaveRequestSchema = z.object({
  comment: z.string().trim().optional(),
});

export const listMyLeaveRequestsQuerySchema = z.object({
  status: z.enum(LEAVE_REQUEST_STATUSES).optional(),
});

export const listLeaveRequestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(LEAVE_REQUEST_STATUSES).optional(),
  employeeId: z.coerce.number().int().optional(),
});
