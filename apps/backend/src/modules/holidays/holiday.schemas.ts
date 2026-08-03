import { z } from "zod";
import { HOLIDAY_STATUSES } from "@hrm-plus/shared";

export const listHolidaysQuerySchema = z.object({
  year: z.coerce.number().int().optional(),
  status: z.enum(HOLIDAY_STATUSES).optional(),
});

export const createHolidaySchema = z.object({
  name: z.string().trim().min(1),
  date: z.string().min(1),
  notes: z.string().trim().nullable().optional(),
});

export const updateHolidaySchema = z.object({
  name: z.string().trim().min(1).optional(),
  date: z.string().min(1).optional(),
  notes: z.string().trim().nullable().optional(),
});

export const importHolidaysSchema = z.object({
  country: z.enum(["NZ", "AU"]),
  year: z.coerce.number().int(),
});

export const publishYearSchema = z.object({
  year: z.coerce.number().int(),
});

export const calendarQuerySchema = z.object({
  startDate: z.string().min(1).optional(),
  endDate: z.string().min(1).optional(),
});
