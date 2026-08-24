import { z } from "zod";

export const createTicketCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const updateTicketCategorySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});
