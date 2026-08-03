import { z } from "zod";

export const trendsQuerySchema = z.object({
  days: z.coerce.number().int().refine((v) => v === 7 || v === 30, "days must be 7 or 30").default(7),
});

export const calendarQuerySchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});
