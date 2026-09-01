import { Prisma } from "../../../generated/tenant";
import {
  AvailabilityReportDto,
  MeetingDto,
  MeetingListItemDto,
  MeetingParticipantDto,
} from "@hrm-plus/shared";

const meetingWithRelations = Prisma.validator<Prisma.MeetingDefaultArgs>()({
  include: {
    organizer: true,
    participants: {
      include: { employee: { include: { department: true } } },
      orderBy: { id: "asc" },
    },
  },
});

export type MeetingWithRelations = Prisma.MeetingGetPayload<typeof meetingWithRelations>;
export const meetingInclude = meetingWithRelations.include;

function parseSnapshot(json: string | null): AvailabilityReportDto | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as AvailabilityReportDto;
  } catch {
    return null;
  }
}

function toParticipantDto(
  participant: MeetingWithRelations["participants"][number]
): MeetingParticipantDto {
  return {
    id: participant.id,
    employeeId: participant.employeeId,
    employeeName: `${participant.employee.firstName} ${participant.employee.lastName}`,
    departmentName: participant.employee.department?.name ?? null,
    isRequired: participant.isRequired,
    responseStatus: participant.responseStatus as MeetingParticipantDto["responseStatus"],
    respondedAt: participant.respondedAt ? participant.respondedAt.toISOString() : null,
  };
}

export interface MeetingViewerContext {
  employeeId: number | null;
  role: string;
}

export function toMeetingDto(meeting: MeetingWithRelations, viewer?: MeetingViewerContext): MeetingDto {
  const isAdminOrHr = viewer?.role === "Admin" || viewer?.role === "HR";
  const isOrganizer = viewer?.employeeId != null && meeting.organizerEmployeeId === viewer.employeeId;
  const isParticipant =
    viewer?.employeeId != null && meeting.participants.some((p) => p.employeeId === viewer.employeeId);
  return {
    id: meeting.id,
    title: meeting.title,
    description: meeting.description,
    locationText: meeting.locationText,
    date: meeting.date.toISOString(),
    startAt: meeting.startAt.toISOString(),
    endAt: meeting.endAt.toISOString(),
    status: meeting.status as MeetingDto["status"],
    organizerEmployeeId: meeting.organizerEmployeeId,
    organizerName: `${meeting.organizer.firstName} ${meeting.organizer.lastName}`,
    warningsAcknowledged: meeting.warningsAcknowledged,
    conflictSnapshot: parseSnapshot(meeting.conflictSnapshotJson),
    cancelReason: meeting.cancelReason,
    participants: meeting.participants.map(toParticipantDto),
    viewerCanManage: Boolean(isAdminOrHr || isOrganizer),
    viewerIsParticipant: Boolean(isParticipant),
    createdAt: meeting.createdAt.toISOString(),
    updatedAt: meeting.updatedAt.toISOString(),
  };
}

export function toMeetingListItemDto(
  meeting: MeetingWithRelations,
  viewerEmployeeId: number | null
): MeetingListItemDto {
  const mine = meeting.participants.find((p) => p.employeeId === viewerEmployeeId);
  return {
    id: meeting.id,
    title: meeting.title,
    date: meeting.date.toISOString(),
    startAt: meeting.startAt.toISOString(),
    endAt: meeting.endAt.toISOString(),
    status: meeting.status as MeetingListItemDto["status"],
    locationText: meeting.locationText,
    organizerEmployeeId: meeting.organizerEmployeeId,
    organizerName: `${meeting.organizer.firstName} ${meeting.organizer.lastName}`,
    participantCount: meeting.participants.length,
    myResponseStatus: mine ? (mine.responseStatus as MeetingListItemDto["myResponseStatus"]) : null,
    isOrganizer: meeting.organizerEmployeeId === viewerEmployeeId,
  };
}
