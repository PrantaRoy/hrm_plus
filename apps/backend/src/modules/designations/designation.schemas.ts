import { z } from "zod";

export const createDesignationSchema = z.object({
  name: z.string().trim().min(1),
  status: z.enum(["Active", "Inactive"]).optional(),
  shortDescription: z.string().trim().nullable().optional(),
});

export const updateDesignationSchema = z.object({
  name: z.string().trim().min(1).optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
  shortDescription: z.string().trim().nullable().optional(),
});
