import { DutyScheduleDto } from "@hrm-plus/shared";

interface DutyScheduleRow {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  checkinConsiderMinutes: number;
  checkoutConsiderMinutes: number;
  maxOverTimeMinutes: number;
  earlyCheckinBufferMinutes: number;
  isTardyApplicable: boolean;
  status: string;
  shortDescription: string | null;
}

function computeHours(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMinute;
  let endMinutes = endHour * 60 + endMinute;
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  return Math.round(((endMinutes - startMinutes) / 60) * 100) / 100;
}

export function toDutyScheduleDto(dutySchedule: DutyScheduleRow): DutyScheduleDto {
  return {
    id: dutySchedule.id,
    name: dutySchedule.name,
    startTime: dutySchedule.startTime,
    endTime: dutySchedule.endTime,
    hours: computeHours(dutySchedule.startTime, dutySchedule.endTime),
    checkinConsiderMinutes: dutySchedule.checkinConsiderMinutes,
    checkoutConsiderMinutes: dutySchedule.checkoutConsiderMinutes,
    maxOverTimeMinutes: dutySchedule.maxOverTimeMinutes,
    earlyCheckinBufferMinutes: dutySchedule.earlyCheckinBufferMinutes,
    isTardyApplicable: dutySchedule.isTardyApplicable,
    status: dutySchedule.status as DutyScheduleDto["status"],
    shortDescription: dutySchedule.shortDescription,
  };
}
