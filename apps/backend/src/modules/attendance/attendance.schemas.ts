import { z } from "zod";
import { ATTENDANCE_METHODS } from "@hrm-plus/shared";

export const checkInSchema = z.object({
  method: z.enum(ATTENDANCE_METHODS),
  reason: z.string().trim().optional(),
});

export const checkOutSchema = z.object({
  method: z.enum(ATTENDANCE_METHODS),
  reason: z.string().trim().optional(),
});

export const updateAttendanceSettingsSchema = z.object({
  pressAndHoldEnabled: z.boolean().optional(),
});

export const setEmployeeMethodsSchema = z.object({
  methods: z.array(z.enum(ATTENDANCE_METHODS)),
});

export const listAttendanceQuerySchema = z.object({
  startDate: z.string().min(1).optional(),
  endDate: z.string().min(1).optional(),
  employeeId: z.coerce.number().int().optional(),
  departmentId: z.coerce.number().int().optional(),
});
