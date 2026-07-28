import { z } from "zod";

export const createWeekDaySchema = z.object({
  name: z.string().trim().min(1),
  isWeekend: z.boolean().optional(),
});

export const updateWeekDaySchema = z.object({
  name: z.string().trim().min(1).optional(),
  isWeekend: z.boolean().optional(),
});
