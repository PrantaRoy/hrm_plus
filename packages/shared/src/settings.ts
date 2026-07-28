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
