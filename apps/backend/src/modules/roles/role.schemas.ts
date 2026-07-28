import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string().trim().min(1),
  status: z.enum(["Active", "Inactive"]).optional(),
  shortDescription: z.string().trim().nullable().optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().trim().min(1).optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
  shortDescription: z.string().trim().nullable().optional(),
});
