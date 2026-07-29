import { SettingStatus } from "./employee";

export interface DutyScheduleDto {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  hours: number;
  checkinConsiderMinutes: number;
  checkoutConsiderMinutes: number;
  maxOverTimeMinutes: number;
  earlyCheckinBufferMinutes: number;
  isTardyApplicable: boolean;
  status: SettingStatus;
  shortDescription: string | null;
}

export interface CreateDutyScheduleInput {
  name: string;
  startTime: string;
  endTime: string;
  checkinConsiderMinutes?: number;
  checkoutConsiderMinutes?: number;
  maxOverTimeMinutes?: number;
  earlyCheckinBufferMinutes?: number;
  isTardyApplicable?: boolean;
  status?: SettingStatus;
  shortDescription?: string | null;
}

export type UpdateDutyScheduleInput = Partial<CreateDutyScheduleInput>;
