import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(1),
  parentDepartmentId: z.number().int().nullable().optional(),
});
