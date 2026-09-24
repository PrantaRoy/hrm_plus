import { z } from "zod";
import { ATTENDANCE_METHODS } from "@hrm-plus/shared";

const geoFields = {
  deviceToken: z.string().trim().min(1).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  qrToken: z.string().trim().min(1).optional(),
};

export const checkInSchema = z.object({
  method: z.enum(ATTENDANCE_METHODS),
  reason: z.string().trim().optional(),
  ...geoFields,
});

export const checkOutSchema = z.object({
  method: z.enum(ATTENDANCE_METHODS),
  reason: z.string().trim().optional(),
  ...geoFields,
});

export const updateAttendanceSettingsSchema = z.object({
  pressAndHoldEnabled: z.boolean().optional(),
  qrCodeEnabled: z.boolean().optional(),
});

export const createQrKioskSessionSchema = z.object({
  label: z.string().trim().max(100).optional(),
});

export const setEmployeeMethodsSchema = z.object({
  methods: z.array(z.enum(ATTENDANCE_METHODS)),
});

export const listAttendanceQuerySchema = z.object({
  startDate: z.string().min(1).optional(),
  endDate: z.string().min(1).optional(),
  employeeId: z.coerce.number().int().optional(),
  departmentId: z.coerce.number().int().optional(),
  dutyScheduleId: z.coerce.number().int().optional(),
});

export const shiftAttendanceLogQuerySchema = z.object({
  startDate: z.string().min(1).optional(),
  endDate: z.string().min(1).optional(),
});

export const worksheetQuerySchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  employeeId: z.coerce.number().int().optional(),
  departmentId: z.coerce.number().int().optional(),
});

export const setEmployeeRulesSchema = z.object({
  ipBindingEnabled: z.boolean(),
  locationBindingEnabled: z.boolean(),
  deviceBindingEnabled: z.boolean(),
  ipRuleIds: z.array(z.number().int()),
  locationIds: z.array(z.number().int()),
});

const timeString = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm 24-hour format");

export const manualAttendanceSchema = z.object({
  date: z.string().min(1),
  checkInTime: timeString,
  checkOutTime: timeString.optional(),
  note: z.string().trim().max(500).optional(),
});
