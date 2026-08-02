import { z } from "zod";

export const createIpRuleSchema = z.object({
  label: z.string().trim().min(1),
  cidr: z.string().trim().min(1),
  status: z.enum(["Active", "Inactive"]).optional(),
});

export const updateIpRuleSchema = z.object({
  label: z.string().trim().min(1).optional(),
  cidr: z.string().trim().min(1).optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});
