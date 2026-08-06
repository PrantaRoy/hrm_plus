import { SettingStatus } from "./employee";

export interface ShiftDto {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  status: SettingStatus;
}

export interface CreateShiftInput {
  name: string;
  startTime: string;
  endTime: string;
  status?: SettingStatus;
}

export interface UpdateShiftInput {
  name?: string;
  startTime?: string;
  endTime?: string;
  status?: SettingStatus;
}

export interface WeekDayDto {
  id: number;
  name: string;
  isWeekend: boolean;
}

export interface CreateWeekDayInput {
  name: string;
  isWeekend?: boolean;
}

export interface UpdateWeekDayInput {
  name?: string;
  isWeekend?: boolean;
}

export interface LeaveTypeDto {
  id: number;
  name: string;
  assignedDays: number;
  status: SettingStatus;
}

export interface CreateLeaveTypeInput {
  name: string;
  assignedDays: number;
  status?: SettingStatus;
}

export interface UpdateLeaveTypeInput {
  name?: string;
  assignedDays?: number;
  status?: SettingStatus;
}

export interface DesignationDto {
  id: number;
  name: string;
  status: SettingStatus;
  shortDescription: string | null;
}

export interface CreateDesignationInput {
  name: string;
  status?: SettingStatus;
  shortDescription?: string | null;
}

export interface UpdateDesignationInput {
  name?: string;
  status?: SettingStatus;
  shortDescription?: string | null;
}

export const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] as const;
export type DateFormat = (typeof DATE_FORMATS)[number];

export const TIME_FORMATS = ["12h", "24h"] as const;
export type TimeFormat = (typeof TIME_FORMATS)[number];

export interface GeneralSettingsDto {
  id: number;
  siteTitle: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  timezone: string;
  currency: string;
  language: string;
  copyrightText: string | null;
  updatedById: number | null;
  updatedAt: string;
}

export interface UpdateGeneralSettingsInput {
  siteTitle?: string;
  dateFormat?: DateFormat;
  timeFormat?: TimeFormat;
  timezone?: string;
  currency?: string;
  language?: string;
  copyrightText?: string | null;
}

export interface RoleDto {
  id: number;
  name: string;
  status: SettingStatus;
  shortDescription: string | null;
  isSystem: boolean;
}

export interface CreateRoleInput {
  name: string;
  status?: SettingStatus;
  shortDescription?: string | null;
}

export interface UpdateRoleInput {
  name?: string;
  status?: SettingStatus;
  shortDescription?: string | null;
}
