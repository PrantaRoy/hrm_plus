import { z } from "zod";

export const createLeaveTypeSchema = z.object({
  name: z.string().trim().min(1),
  assignedDays: z.number().int().min(0),
  status: z.enum(["Active", "Inactive"]).optional(),
});

export const updateLeaveTypeSchema = z.object({
  name: z.string().trim().min(1).optional(),
  assignedDays: z.number().int().min(0).optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});
