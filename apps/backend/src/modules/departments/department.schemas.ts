import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(1),
  status: z.enum(["Active", "Inactive"]).optional(),
  shortDescription: z.string().trim().nullable().optional(),
  parentDepartmentId: z.number().int().nullable().optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().trim().min(1).optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
  shortDescription: z.string().trim().nullable().optional(),
  parentDepartmentId: z.number().int().nullable().optional(),
});
