import { z } from "zod";
import {
  RECURRENCE_FREQUENCIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TIME_TYPES,
} from "@hrm-plus/shared";

const idSchema = z.coerce.number().int().positive();
const isoDateTime = z.string().datetime({ offset: true });

const taskFields = {
  title: z.string().trim().min(1).max(191),
  priority: z.enum(TASK_PRIORITIES),
  status: z.enum(TASK_STATUSES).optional(),
  timeType: z.enum(TASK_TIME_TYPES),
  budgetAmount: z.coerce.number().min(0).max(9_999_999_999.99).nullable().optional(),
  recurrenceFrequency: z.enum(RECURRENCE_FREQUENCIES).optional(),
  recurrenceIntervalDays: z.coerce.number().int().min(1).max(3650).nullable().optional(),
  totalCycles: z.coerce.number().int().min(0).max(1000).optional(),
  supervisorId: idSchema.optional(),
  description: z.string().trim().max(20000).optional(),
  progressPercentage: z.coerce.number().int().min(0).max(100).optional(),
  dueDate: isoDateTime.nullable().optional(),
  memberIds: z.array(idSchema).max(200).optional(),
  followerIds: z.array(idSchema).max(200).optional(),
};

// Cross-field rules (custom frequency needs an interval, etc.) are enforced against the
// merged task state in the service, so create and update share one implementation.
export const createTaskSchema = z.object({
  projectId: idSchema,
  ...taskFields,
  checklist: z.array(z.string().trim().min(1).max(191)).max(100).optional(),
});

export const updateTaskSchema = z
  .object(taskFields)
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

export const setTaskPeopleSchema = z.object({
  employeeIds: z.array(idSchema).max(200),
});

export const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  projectId: idSchema.optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  supervisorId: idSchema.optional(),
  memberId: idSchema.optional(),
  search: z.string().trim().max(191).optional(),
  dueBefore: isoDateTime.optional(),
  dueAfter: isoDateTime.optional(),
});

export const taskIdParamSchema = z.object({ id: idSchema });

// ── Checklists ──────────────────────────────────────────────────────────────

export const checklistParamSchema = z.object({ id: idSchema, cid: idSchema });
export const checklistTitleSchema = z.object({ title: z.string().trim().min(1).max(191) });
export const checklistToggleSchema = z.object({ value: z.boolean().default(true) });

// ── Time entries ────────────────────────────────────────────────────────────

const note = z.string().trim().max(5000).nullable().optional();

export const createTimeEntrySchema = z.object({
  startTime: isoDateTime,
  endTime: isoDateTime.nullable().optional(),
  note,
  isBillable: z.boolean().optional(),
});

export const updateTimeEntrySchema = createTimeEntrySchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

export const startTimerSchema = z.object({ note, isBillable: z.boolean().optional() });
export const stopTimerSchema = z.object({ note });

export const timeEntryParamSchema = z.object({ entryId: idSchema });
