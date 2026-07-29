import { z } from "zod";

const timeString = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm 24-hour format");

export const listDutySchedulesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});

export const createDutyScheduleSchema = z.object({
  name: z.string().trim().min(1),
  startTime: timeString,
  endTime: timeString,
  checkinConsiderMinutes: z.coerce.number().int().min(0).optional(),
  checkoutConsiderMinutes: z.coerce.number().int().min(0).optional(),
  maxOverTimeMinutes: z.coerce.number().int().min(0).optional(),
  earlyCheckinBufferMinutes: z.coerce.number().int().min(0).optional(),
  isTardyApplicable: z.boolean().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
  shortDescription: z.string().trim().nullable().optional(),
});

export const updateDutyScheduleSchema = z.object({
  name: z.string().trim().min(1).optional(),
  startTime: timeString.optional(),
  endTime: timeString.optional(),
  checkinConsiderMinutes: z.coerce.number().int().min(0).optional(),
  checkoutConsiderMinutes: z.coerce.number().int().min(0).optional(),
  maxOverTimeMinutes: z.coerce.number().int().min(0).optional(),
  earlyCheckinBufferMinutes: z.coerce.number().int().min(0).optional(),
  isTardyApplicable: z.boolean().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
  shortDescription: z.string().trim().nullable().optional(),
});
