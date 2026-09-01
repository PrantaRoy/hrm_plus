export const MEETING_STATUSES = ["Draft", "Confirmed", "Cancelled"] as const;
export type MeetingStatus = (typeof MEETING_STATUSES)[number];

export const PARTICIPANT_RESPONSE_STATUSES = ["Pending", "Accepted", "Declined"] as const;
export type ParticipantResponseStatus = (typeof PARTICIPANT_RESPONSE_STATUSES)[number];

export const MEETING_PARTICIPANT_RESPONSES = ["Accepted", "Declined"] as const;
export type MeetingParticipantResponse = (typeof MEETING_PARTICIPANT_RESPONSES)[number];

export const CONFLICT_TYPES = [
  "APPROVED_LEAVE",
  "PENDING_LEAVE",
  "MEETING_OVERLAP",
  "OUTSIDE_SHIFT",
  "NO_ROSTER",
  "DAY_OFF",
  "HOLIDAY",
  "NOT_WORKING",
] as const;
export type ConflictType = (typeof CONFLICT_TYPES)[number];

export const CONFLICT_SEVERITIES = ["BLOCK", "WARNING"] as const;
export type ConflictSeverity = (typeof CONFLICT_SEVERITIES)[number];

export interface MeetingParticipantInput {
  employeeId: number;
  isRequired?: boolean;
}

export interface MeetingParticipantDto {
  id: number;
  employeeId: number;
  employeeName: string;
  departmentName: string | null;
  isRequired: boolean;
  responseStatus: ParticipantResponseStatus;
  respondedAt: string | null;
}

export interface ParticipantConflictDto {
  employeeId: number;
  employeeName: string;
  isRequired: boolean;
  type: ConflictType;
  severity: ConflictSeverity;
  message: string;
}

export interface AvailabilityReportDto {
  conflicts: ParticipantConflictDto[];
  canConfirm: boolean;
  hasWarnings: boolean;
}

export interface MeetingDto {
  id: number;
  title: string;
  description: string | null;
  locationText: string | null;
  date: string;
  startAt: string;
  endAt: string;
  status: MeetingStatus;
  organizerEmployeeId: number;
  organizerName: string;
  warningsAcknowledged: boolean;
  conflictSnapshot: AvailabilityReportDto | null;
  cancelReason: string | null;
  participants: MeetingParticipantDto[];
  viewerCanManage: boolean;
  viewerIsParticipant: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingListItemDto {
  id: number;
  title: string;
  date: string;
  startAt: string;
  endAt: string;
  status: MeetingStatus;
  locationText: string | null;
  organizerEmployeeId: number;
  organizerName: string;
  participantCount: number;
  myResponseStatus: ParticipantResponseStatus | null;
  isOrganizer: boolean;
}

export interface CreateMeetingInput {
  title: string;
  description?: string;
  locationText?: string;
  date: string;
  startTime: string;
  endTime: string;
  participants: MeetingParticipantInput[];
  confirmNow?: boolean;
  acknowledgeWarnings?: boolean;
}

export interface UpdateMeetingInput {
  title?: string;
  description?: string | null;
  locationText?: string | null;
  date?: string;
  startTime?: string;
  endTime?: string;
  participants?: MeetingParticipantInput[];
}

export interface CheckAvailabilityInput {
  date: string;
  startTime: string;
  endTime: string;
  participants: MeetingParticipantInput[];
  organizerEmployeeId?: number;
  excludeMeetingId?: number;
}

export interface ConfirmMeetingInput {
  acknowledgeWarnings?: boolean;
}

export interface RespondToMeetingInput {
  response: MeetingParticipantResponse;
}

export interface CancelMeetingInput {
  cancelReason?: string;
}

export interface ListMeetingsQuery {
  status?: MeetingStatus;
  employeeId?: number;
  departmentId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface ListMyMeetingsQuery {
  status?: MeetingStatus;
  startDate?: string;
  endDate?: string;
}

export interface SchedulerSettingsDto {
  id: number;
  blockOnApprovedLeave: boolean;
  blockOnPendingLeave: boolean;
  blockOnMeetingOverlap: boolean;
  blockOnOutsideShift: boolean;
  blockOnNoRoster: boolean;
  considerApprovedRostersOnly: boolean;
  optionalParticipantsCanBlock: boolean;
  updatedById: number | null;
  updatedAt: string;
}

export interface UpdateSchedulerSettingsInput {
  blockOnApprovedLeave?: boolean;
  blockOnPendingLeave?: boolean;
  blockOnMeetingOverlap?: boolean;
  blockOnOutsideShift?: boolean;
  blockOnNoRoster?: boolean;
  considerApprovedRostersOnly?: boolean;
  optionalParticipantsCanBlock?: boolean;
}
