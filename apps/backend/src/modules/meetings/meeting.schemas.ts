import { z } from "zod";
import { MEETING_STATUSES, MEETING_PARTICIPANT_RESPONSES } from "@hrm-plus/shared";

const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:mm format");
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

const participantSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  isRequired: z.boolean().optional().default(true),
});

export const createMeetingSchema = z.object({
  title: z.string().trim().min(1).max(191),
  description: z.string().trim().max(5000).optional(),
  locationText: z.string().trim().max(191).optional(),
  date: dateString,
  startTime: timeString,
  endTime: timeString,
  participants: z.array(participantSchema).max(100).default([]),
  confirmNow: z.boolean().optional(),
  acknowledgeWarnings: z.boolean().optional(),
});

export const updateMeetingSchema = z
  .object({
    title: z.string().trim().min(1).max(191).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    locationText: z.string().trim().max(191).nullable().optional(),
    date: dateString.optional(),
    startTime: timeString.optional(),
    endTime: timeString.optional(),
    participants: z.array(participantSchema).max(100).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

export const checkAvailabilitySchema = z.object({
  date: dateString,
  startTime: timeString,
  endTime: timeString,
  participants: z.array(participantSchema).max(100).default([]),
  organizerEmployeeId: z.coerce.number().int().positive().optional(),
  excludeMeetingId: z.coerce.number().int().positive().optional(),
});

export const confirmMeetingSchema = z.object({
  acknowledgeWarnings: z.boolean().optional(),
});

export const respondToMeetingSchema = z.object({
  response: z.enum(MEETING_PARTICIPANT_RESPONSES),
});

export const cancelMeetingSchema = z.object({
  cancelReason: z.string().trim().max(500).optional(),
});

export const listMyMeetingsQuerySchema = z.object({
  status: z.enum(MEETING_STATUSES).optional(),
  startDate: dateString.optional(),
  endDate: dateString.optional(),
});

export const listMeetingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(MEETING_STATUSES).optional(),
  employeeId: z.coerce.number().int().positive().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  startDate: dateString.optional(),
  endDate: dateString.optional(),
});
