import { DutyScheduleDto } from "@hrm-plus/shared";

export function formatDutyScheduleOption(d: DutyScheduleDto): string {
  return `${d.name} (${d.startTime} - ${d.endTime})`;
}
