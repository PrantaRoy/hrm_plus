import { z } from "zod";

const timeString = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm 24-hour format");

export const createShiftSchema = z.object({
  name: z.string().trim().min(1),
  startTime: timeString,
  endTime: timeString,
  status: z.enum(["Active", "Inactive"]).optional(),
});

export const updateShiftSchema = z.object({
  name: z.string().trim().min(1).optional(),
  startTime: timeString.optional(),
  endTime: timeString.optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});
