import { AvailabilityReportDto, ParticipantConflictDto } from "@hrm-plus/shared";

export function reportFromConflicts(conflicts: ParticipantConflictDto[]): AvailabilityReportDto {
  return {
    conflicts,
    canConfirm: !conflicts.some((c) => c.severity === "BLOCK"),
    hasWarnings: conflicts.some((c) => c.severity === "WARNING"),
  };
}
