import { z } from "zod";
import { ROLES } from "@hrm-plus/shared";

export const listEmployeesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  departmentId: z.coerce.number().int().optional(),
});

export const createEmployeeSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().email(),
  jobTitle: z.string().trim().optional(),
  startDate: z.string().min(1),
  departmentId: z.number().int().nullable().optional(),
  managerId: z.number().int().nullable().optional(),
  role: z.enum(ROLES),
  password: z.string().min(8),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  jobTitle: z.string().trim().nullable().optional(),
  departmentId: z.number().int().nullable().optional(),
  managerId: z.number().int().nullable().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});
