import { z } from "zod";
import { EMPLOYMENT_TYPES, GENDERS } from "@hrm-plus/shared";

export const listEmployeesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(20),
  search: z.string().trim().optional(),
  departmentId: z.coerce.number().int().optional(),
});

export const createEmployeeSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().email(),
  phoneNumber: z.string().trim().optional(),
  gender: z.enum(GENDERS).optional(),
  dateOfBirth: z.string().min(1).optional(),
  jobTitle: z.string().trim().optional(),
  joiningDate: z.string().min(1),
  employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
  departmentId: z.number().int().nullable().optional(),
  designationId: z.number().int().nullable().optional(),
  reportingToId: z.number().int().nullable().optional(),
  role: z.string().trim().min(1),
  password: z.string().min(8),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  phoneNumber: z.string().trim().nullable().optional(),
  gender: z.enum(GENDERS).nullable().optional(),
  dateOfBirth: z.string().min(1).nullable().optional(),
  jobTitle: z.string().trim().nullable().optional(),
  terminationDate: z.string().min(1).nullable().optional(),
  employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
  departmentId: z.number().int().nullable().optional(),
  designationId: z.number().int().nullable().optional(),
  reportingToId: z.number().int().nullable().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});
