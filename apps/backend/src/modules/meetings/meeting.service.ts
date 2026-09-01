import { PrismaClient, Prisma } from "../../../generated/tenant";
import {
  AvailabilityReportDto,
  CreateMeetingInput,
  MeetingDto,
  MeetingListItemDto,
  MeetingParticipantResponse,
  PaginatedResult,
  UpdateMeetingInput,
} from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { combineDateAndTimeInZone } from "../../utils/date";
import { getTenantTimezone } from "../general-settings/generalSettings.service";
import { resolveEmployeeForUser } from "../leave-requests/leaveRequest.service";
import { checkAvailability, AvailabilityParticipant } from "./meetingConflict.service";
import { meetingInclude, toMeetingDto, toMeetingListItemDto } from "./meeting.mapper";

export interface ActingUser {
  id: number;
  role: string;
}

function isAdminOrHr(role: string): boolean {
  return role === "Admin" || role === "HR";
}

function dayFromDateString(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

// Resolves a proposed date + HH:mm window to UTC instants using the tenant timezone.
async function resolveWindow(
  prisma: PrismaClient,
  dateStr: string,
  startTime: string,
  endTime: string
): Promise<{ day: Date; startAt: Date; endAt: Date }> {
  if (endTime <= startTime) {
    throw ApiError.badRequest("A meeting must start and end on the same day, with end after start");
  }
  const timezone = await getTenantTimezone(prisma);
  const day = dayFromDateString(dateStr);
  return {
    day,
    startAt: combineDateAndTimeInZone(day, startTime, timezone),
    endAt: combineDateAndTimeInZone(day, endTime, timezone),
  };
}

interface NormalizedParticipant {
  employeeId: number;
  isRequired: boolean;
}

// Dedupes participants and always includes the organizer as a required attendee.
async function normalizeParticipants(
  prisma: PrismaClient,
  organizerEmployeeId: number,
  raw: { employeeId: number; isRequired?: boolean }[]
): Promise<NormalizedParticipant[]> {
  const byId = new Map<number, boolean>();
  byId.set(organizerEmployeeId, true);
  for (const p of raw) {
    const existing = byId.get(p.employeeId);
    byId.set(p.employeeId, (existing ?? false) || (p.isRequired ?? true));
  }

  const ids = [...byId.keys()];
  const employees = await prisma.employee.findMany({ where: { id: { in: ids } } });
  const found = new Set(employees.map((e) => e.id));
  for (const id of ids) {
    if (!found.has(id)) throw ApiError.badRequest(`Participant employee #${id} does not exist`);
  }
  const inactive = employees.filter((e) => e.status !== "Active").map((e) => e.id);
  if (inactive.length > 0) {
    throw ApiError.badRequest(`Cannot invite inactive employee(s): ${inactive.join(", ")}`);
  }

  return ids.map((employeeId) => ({ employeeId, isRequired: byId.get(employeeId)! }));
}

function toAvailabilityParticipants(participants: NormalizedParticipant[]): AvailabilityParticipant[] {
  return participants.map((p) => ({ employeeId: p.employeeId, isRequired: p.isRequired }));
}

async function loadMeetingOrThrow(prisma: PrismaClient, id: number) {
  const meeting = await prisma.meeting.findUnique({ where: { id }, include: meetingInclude });
  if (!meeting) throw ApiError.notFound("Meeting not found");
  return meeting;
}

async function meetingDto(
  prisma: PrismaClient,
  id: number,
  actingUser: ActingUser
): Promise<MeetingDto> {
  const meeting = await loadMeetingOrThrow(prisma, id);
  const emp = await prisma.employee.findUnique({
    where: { userId: actingUser.id },
    select: { id: true },
  });
  return toMeetingDto(meeting, { employeeId: emp?.id ?? null, role: actingUser.role });
}

function assertCanManage(meeting: { organizerEmployeeId: number }, actingEmployeeId: number | null, role: string) {
  if (isAdminOrHr(role)) return;
  if (actingEmployeeId != null && meeting.organizerEmployeeId === actingEmployeeId) return;
  throw ApiError.forbidden("Only the organizer or an Admin/HR user can manage this meeting");
}

// --- public API -----------------------------------------------------------

export async function previewAvailability(
  prisma: PrismaClient,
  input: {
    date: string;
    startTime: string;
    endTime: string;
    participants: { employeeId: number; isRequired?: boolean }[];
    organizerEmployeeId?: number;
    excludeMeetingId?: number;
    fallbackOrganizerEmployeeId: number;
  }
): Promise<AvailabilityReportDto> {
  const organizerEmployeeId = input.organizerEmployeeId ?? input.fallbackOrganizerEmployeeId;
  const { startAt, endAt } = await resolveWindow(prisma, input.date, input.startTime, input.endTime);
  const participants = await normalizeParticipants(prisma, organizerEmployeeId, input.participants);
  return checkAvailability(prisma, {
    startAt,
    endAt,
    participants: toAvailabilityParticipants(participants),
    excludeMeetingId: input.excludeMeetingId,
  });
}

export async function createMeeting(
  prisma: PrismaClient,
  organizerEmployeeId: number,
  input: CreateMeetingInput,
  actingUser: ActingUser
): Promise<MeetingDto> {
  const { day, startAt, endAt } = await resolveWindow(prisma, input.date, input.startTime, input.endTime);
  const participants = await normalizeParticipants(prisma, organizerEmployeeId, input.participants);

  const created = await prisma.$transaction(async (tx) => {
    const meeting = await tx.meeting.create({
      data: {
        title: input.title,
        description: input.description ?? null,
        locationText: input.locationText ?? null,
        date: day,
        startAt,
        endAt,
        status: "Draft",
        organizerEmployeeId,
        createdById: actingUser.id,
        participants: {
          create: participants.map((p) => ({
            employeeId: p.employeeId,
            isRequired: p.isRequired,
          })),
        },
      },
    });
    return meeting;
  });

  if (input.confirmNow) {
    return confirmMeeting(prisma, created.id, actingUser, input.acknowledgeWarnings, {
      skipManageCheck: true,
    });
  }

  return meetingDto(prisma, created.id, actingUser);
}

export async function confirmMeeting(
  prisma: PrismaClient,
  meetingId: number,
  actingUser: ActingUser,
  acknowledgeWarnings: boolean | undefined,
  opts: { skipManageCheck?: boolean } = {}
): Promise<MeetingDto> {
  const meeting = await loadMeetingOrThrow(prisma, meetingId);

  if (!opts.skipManageCheck) {
    const actingEmployee = await prisma.employee.findUnique({ where: { userId: actingUser.id } });
    assertCanManage(meeting, actingEmployee?.id ?? null, actingUser.role);
  }

  if (meeting.status === "Cancelled") {
    throw ApiError.badRequest("A cancelled meeting cannot be confirmed");
  }

  const report = await checkAvailability(prisma, {
    startAt: meeting.startAt,
    endAt: meeting.endAt,
    participants: meeting.participants.map((p) => ({ employeeId: p.employeeId, isRequired: p.isRequired })),
    excludeMeetingId: meeting.id,
  });

  if (!report.canConfirm) {
    throw ApiError.conflict(
      "Meeting cannot be confirmed — a required participant is unavailable",
      "MEETING_CONFLICT",
      { conflicts: report.conflicts }
    );
  }

  if (report.hasWarnings && !acknowledgeWarnings) {
    throw ApiError.badRequest(
      "Acknowledge the scheduling warnings to confirm this meeting",
      "MEETING_WARNINGS_UNACKNOWLEDGED",
      { conflicts: report.conflicts }
    );
  }

  await prisma.meeting.update({
    where: { id: meeting.id },
    data: {
      status: "Confirmed",
      warningsAcknowledged: report.hasWarnings,
      conflictSnapshotJson: JSON.stringify(report),
      updatedById: actingUser.id,
    },
  });

  return meetingDto(prisma, meeting.id, actingUser);
}

export async function updateMeeting(
  prisma: PrismaClient,
  meetingId: number,
  actingUser: ActingUser,
  input: UpdateMeetingInput
): Promise<MeetingDto> {
  const meeting = await loadMeetingOrThrow(prisma, meetingId);
  const actingEmployee = await prisma.employee.findUnique({ where: { userId: actingUser.id } });
  assertCanManage(meeting, actingEmployee?.id ?? null, actingUser.role);

  if (meeting.status === "Cancelled") {
    throw ApiError.badRequest("A cancelled meeting cannot be edited");
  }

  const dateStr = input.date ?? meeting.date.toISOString().slice(0, 10);
  const data: Prisma.MeetingUpdateInput = { updatedBy: { connect: { id: actingUser.id } } };

  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.locationText !== undefined) data.locationText = input.locationText;

  const timeChanged =
    input.date !== undefined || input.startTime !== undefined || input.endTime !== undefined;
  if (timeChanged) {
    const startTime = input.startTime ?? formatTime(meeting.startAt, await getTenantTimezone(prisma));
    const endTime = input.endTime ?? formatTime(meeting.endAt, await getTenantTimezone(prisma));
    const { day, startAt, endAt } = await resolveWindow(prisma, dateStr, startTime, endTime);
    data.date = day;
    data.startAt = startAt;
    data.endAt = endAt;
  }

  const normalized =
    input.participants !== undefined
      ? await normalizeParticipants(prisma, meeting.organizerEmployeeId, input.participants)
      : null;

  await prisma.$transaction(async (tx) => {
    if (normalized) {
      const desired = new Map(normalized.map((p) => [p.employeeId, p.isRequired]));
      const current = new Map(meeting.participants.map((p) => [p.employeeId, p]));

      const toRemove = meeting.participants.filter((p) => !desired.has(p.employeeId)).map((p) => p.id);
      if (toRemove.length > 0) {
        await tx.meetingParticipant.deleteMany({ where: { id: { in: toRemove } } });
      }
      for (const [employeeId, isRequired] of desired) {
        const existing = current.get(employeeId);
        if (!existing) {
          await tx.meetingParticipant.create({ data: { meetingId: meeting.id, employeeId, isRequired } });
        } else if (existing.isRequired !== isRequired) {
          await tx.meetingParticipant.update({ where: { id: existing.id }, data: { isRequired } });
        }
      }
    }

    // Any material change invalidates a prior confirmation.
    if (meeting.status === "Confirmed" && (timeChanged || input.participants !== undefined)) {
      data.status = "Draft";
      data.warningsAcknowledged = false;
      data.conflictSnapshotJson = null;
    }

    await tx.meeting.update({ where: { id: meeting.id }, data });
  });

  return meetingDto(prisma, meeting.id, actingUser);
}

function formatTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export async function cancelMeeting(
  prisma: PrismaClient,
  meetingId: number,
  actingUser: ActingUser,
  cancelReason: string | undefined
): Promise<MeetingDto> {
  const meeting = await loadMeetingOrThrow(prisma, meetingId);
  const actingEmployee = await prisma.employee.findUnique({ where: { userId: actingUser.id } });
  assertCanManage(meeting, actingEmployee?.id ?? null, actingUser.role);

  if (meeting.status === "Cancelled") {
    throw ApiError.badRequest("Meeting is already cancelled");
  }

  await prisma.meeting.update({
    where: { id: meeting.id },
    data: { status: "Cancelled", cancelReason: cancelReason ?? null, updatedById: actingUser.id },
  });

  return meetingDto(prisma, meeting.id, actingUser);
}

export async function respondToMeeting(
  prisma: PrismaClient,
  meetingId: number,
  actingUser: ActingUser,
  employeeId: number,
  response: MeetingParticipantResponse
): Promise<MeetingDto> {
  const meeting = await loadMeetingOrThrow(prisma, meetingId);
  const participant = meeting.participants.find((p) => p.employeeId === employeeId);
  if (!participant) {
    throw ApiError.forbidden("You are not a participant of this meeting");
  }
  if (meeting.status === "Cancelled") {
    throw ApiError.badRequest("This meeting has been cancelled");
  }

  await prisma.meetingParticipant.update({
    where: { id: participant.id },
    data: { responseStatus: response, respondedAt: new Date() },
  });

  return meetingDto(prisma, meeting.id, actingUser);
}

export async function getMeetingById(
  prisma: PrismaClient,
  id: number,
  actingUser: ActingUser
): Promise<MeetingDto> {
  const meeting = await loadMeetingOrThrow(prisma, id);
  const actingEmployee = await prisma.employee.findUnique({
    where: { userId: actingUser.id },
    select: { id: true },
  });
  const eid = actingEmployee?.id ?? null;
  const privileged = isAdminOrHr(actingUser.role) || actingUser.role === "Manager";
  if (!privileged) {
    const visible =
      eid != null &&
      (meeting.organizerEmployeeId === eid || meeting.participants.some((p) => p.employeeId === eid));
    if (!visible) throw ApiError.forbidden("You do not have access to this meeting");
  }
  return toMeetingDto(meeting, { employeeId: eid, role: actingUser.role });
}

export interface ListMyMeetingsOptions {
  status?: string;
  startDate?: string;
  endDate?: string;
}

export async function listMyMeetings(
  prisma: PrismaClient,
  employeeId: number,
  options: ListMyMeetingsOptions
): Promise<MeetingListItemDto[]> {
  const where: Prisma.MeetingWhereInput = {
    OR: [{ organizerEmployeeId: employeeId }, { participants: { some: { employeeId } } }],
    ...(options.status ? { status: options.status } : {}),
    ...(options.startDate || options.endDate
      ? {
          date: {
            ...(options.startDate ? { gte: dayFromDateString(options.startDate) } : {}),
            ...(options.endDate ? { lte: dayFromDateString(options.endDate) } : {}),
          },
        }
      : {}),
  };

  const meetings = await prisma.meeting.findMany({
    where,
    include: meetingInclude,
    orderBy: { startAt: "desc" },
  });
  return meetings.map((m) => toMeetingListItemDto(m, employeeId));
}

export interface ListMeetingsOptions {
  page: number;
  pageSize: number;
  status?: string;
  employeeId?: number;
  departmentId?: number;
  startDate?: string;
  endDate?: string;
}

export async function listMeetings(
  prisma: PrismaClient,
  options: ListMeetingsOptions,
  viewerEmployeeId: number | null
): Promise<PaginatedResult<MeetingListItemDto>> {
  const participantFilter: Prisma.MeetingParticipantWhereInput = {
    ...(options.employeeId ? { employeeId: options.employeeId } : {}),
    ...(options.departmentId ? { employee: { departmentId: options.departmentId } } : {}),
  };

  const where: Prisma.MeetingWhereInput = {
    ...(options.status ? { status: options.status } : {}),
    ...(Object.keys(participantFilter).length > 0 ? { participants: { some: participantFilter } } : {}),
    ...(options.startDate || options.endDate
      ? {
          date: {
            ...(options.startDate ? { gte: dayFromDateString(options.startDate) } : {}),
            ...(options.endDate ? { lte: dayFromDateString(options.endDate) } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.meeting.findMany({
      where,
      include: meetingInclude,
      orderBy: { startAt: "desc" },
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    }),
    prisma.meeting.count({ where }),
  ]);

  return {
    items: items.map((m) => toMeetingListItemDto(m, viewerEmployeeId)),
    total,
    page: options.page,
    pageSize: options.pageSize,
  };
}

export { resolveEmployeeForUser };
