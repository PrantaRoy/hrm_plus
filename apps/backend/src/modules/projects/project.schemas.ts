import { z } from "zod";
import {
  CONTRACT_TYPES,
  DEADLINE_TYPES,
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
} from "@hrm-plus/shared";
import { PROJECT_CODE_PATTERN } from "./projectCode";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");
const idSchema = z.coerce.number().int().positive();

const projectFields = {
  title: z.string().trim().min(1).max(191),
  contractType: z.enum(CONTRACT_TYPES),
  clientId: idSchema.nullable().optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  totalAmount: z.coerce.number().min(0).max(9_999_999_999.99),
  estimatedHours: z.coerce.number().min(0).max(999_999.99),
  deadlineType: z.enum(DEADLINE_TYPES),
  startDate: dateString,
  targetEndDate: dateString.nullable().optional(),
  supervisorId: idSchema,
  priority: z.enum(PROJECT_PRIORITIES),
  description: z.string().trim().max(20000).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
  memberIds: z.array(idSchema).max(200).optional(),
};

export const createProjectSchema = z.object({
  ...projectFields,
  code: z
    .string()
    .trim()
    .toLowerCase()
    .regex(PROJECT_CODE_PATTERN, "Code must be 2-10 lowercase letters/digits")
    .optional(),
});

export const updateProjectSchema = z
  .object(projectFields)
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

export const setProjectMembersSchema = z.object({
  employeeIds: z.array(idSchema).max(200),
});

export const listProjectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(PROJECT_STATUSES).optional(),
  clientId: idSchema.optional(),
  supervisorId: idSchema.optional(),
  search: z.string().trim().max(191).optional(),
});

export const projectIdParamSchema = z.object({ id: idSchema });
