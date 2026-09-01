import { SchedulerSettingsDto } from "@hrm-plus/shared";

export function toSchedulerSettingsDto(settings: {
  id: number;
  blockOnApprovedLeave: boolean;
  blockOnPendingLeave: boolean;
  blockOnMeetingOverlap: boolean;
  blockOnOutsideShift: boolean;
  blockOnNoRoster: boolean;
  considerApprovedRostersOnly: boolean;
  optionalParticipantsCanBlock: boolean;
  updatedById: number | null;
  updatedAt: Date;
}): SchedulerSettingsDto {
  return {
    id: settings.id,
    blockOnApprovedLeave: settings.blockOnApprovedLeave,
    blockOnPendingLeave: settings.blockOnPendingLeave,
    blockOnMeetingOverlap: settings.blockOnMeetingOverlap,
    blockOnOutsideShift: settings.blockOnOutsideShift,
    blockOnNoRoster: settings.blockOnNoRoster,
    considerApprovedRostersOnly: settings.considerApprovedRostersOnly,
    optionalParticipantsCanBlock: settings.optionalParticipantsCanBlock,
    updatedById: settings.updatedById,
    updatedAt: settings.updatedAt.toISOString(),
  };
}
