import { z } from "zod";
import { ASSIGNMENT_STATUSES } from "@hrm-plus/shared";

export const listAssignmentsQuerySchema = z.object({
  startDate: z.string().min(1).optional(),
  endDate: z.string().min(1).optional(),
  employeeId: z.coerce.number().int().optional(),
});

export const createAssignmentSchema = z.object({
  employeeId: z.coerce.number().int(),
  dutyScheduleId: z.number().int().nullable().optional(),
  date: z.string().min(1),
  comment: z.string().trim().nullable().optional(),
  isLeave: z.boolean().optional(),
  isHoliday: z.boolean().optional(),
});

export const updateAssignmentSchema = z.object({
  employeeId: z.coerce.number().int().optional(),
  dutyScheduleId: z.number().int().nullable().optional(),
  date: z.string().min(1).optional(),
  status: z.enum(ASSIGNMENT_STATUSES).optional(),
  comment: z.string().trim().nullable().optional(),
  isLeave: z.boolean().optional(),
  isHoliday: z.boolean().optional(),
  changeRequest: z.string().trim().nullable().optional(),
});
