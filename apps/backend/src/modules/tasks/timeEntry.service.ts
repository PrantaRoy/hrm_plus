import { Prisma, PrismaClient } from "../../../generated/tenant";
import {
  CreateTimeEntryInput,
  StartTimerInput,
  StopTimerInput,
  TimeEntryDto,
  TimeEntryListDto,
  UpdateTimeEntryInput,
} from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { Actor, loadTaskAccess, requireEmployeeId } from "../projects/projectAccess";
import { durationMinutes, timeEntryInclude, toTimeEntryDto } from "./task.mapper";

/**
 * MySQL has no partial unique index, so "one running timer per employee" is enforced by
 * serialising on the employee's row: concurrent start/create calls for the same employee
 * queue behind this lock, and the second one then sees the first one's running entry.
 */
async function lockEmployee(tx: Prisma.TransactionClient, employeeId: number): Promise<void> {
  await tx.$queryRaw`SELECT id FROM Employee WHERE id = ${employeeId} FOR UPDATE`;
}

async function assertNoOtherRunningTimer(
  tx: Prisma.TransactionClient,
  employeeId: number,
  exceptEntryId?: number
): Promise<void> {
  const running = await tx.timeEntry.findFirst({
    where: { employeeId, endTime: null, ...(exceptEntryId ? { id: { not: exceptEntryId } } : {}) },
    include: { task: { select: { taskNumber: true } } },
  });
  if (running) {
    throw ApiError.conflict(
      `You already have a running timer on ${running.task.taskNumber}. Stop it first.`,
      "TIMER_ALREADY_RUNNING"
    );
  }
}

function assertValidRange(startTime: Date, endTime: Date | null): void {
  if (endTime && endTime <= startTime) {
    throw ApiError.badRequest("End time must be after the start time", "INVALID_TIME_RANGE");
  }
}

export async function listTimeEntries(
  prisma: PrismaClient,
  actor: Actor,
  taskId: number
): Promise<TimeEntryListDto> {
  await loadTaskAccess(prisma, actor, taskId);
  const entries = await prisma.timeEntry.findMany({
    where: { taskId },
    include: timeEntryInclude,
    orderBy: [{ startTime: "desc" }, { id: "desc" }],
  });

  let totalMinutes = 0;
  let billableMinutes = 0;
  for (const entry of entries) {
    const minutes = durationMinutes(entry.startTime, entry.endTime) ?? 0;
    totalMinutes += minutes;
    if (entry.isBillable) billableMinutes += minutes;
  }
  return { items: entries.map(toTimeEntryDto), totalMinutes, billableMinutes };
}

/** Logs a finished block of time, or (endTime omitted) starts a running timer. */
export async function createTimeEntry(
  prisma: PrismaClient,
  actor: Actor,
  taskId: number,
  input: CreateTimeEntryInput
): Promise<TimeEntryDto> {
  const access = await loadTaskAccess(prisma, actor, taskId);
  if (!access.canWork) throw ApiError.forbidden("Only task members can log time");
  const employeeId = requireEmployeeId(actor);

  const startTime = new Date(input.startTime);
  const endTime = input.endTime ? new Date(input.endTime) : null;
  assertValidRange(startTime, endTime);

  const entry = await prisma.$transaction(async (tx) => {
    if (!endTime) {
      await lockEmployee(tx, employeeId);
      await assertNoOtherRunningTimer(tx, employeeId);
    }
    return tx.timeEntry.create({
      data: {
        taskId,
        employeeId,
        startTime,
        endTime,
        note: input.note?.trim() || null,
        isBillable: input.isBillable ?? true,
      },
      include: timeEntryInclude,
    });
  });
  return toTimeEntryDto(entry);
}

/** Starts a running timer. Working on a task that is still "To do" moves it to "In progress". */
export async function startTimer(
  prisma: PrismaClient,
  actor: Actor,
  taskId: number,
  input: StartTimerInput
): Promise<TimeEntryDto> {
  const entry = await createTimeEntry(prisma, actor, taskId, {
    startTime: new Date().toISOString(),
    endTime: null,
    note: input.note,
    isBillable: input.isBillable,
  });
  // Conditional on the current status so it never overrides a task someone just put on hold,
  // completed or cancelled. Project progress is unaffected: only the status label changes.
  await prisma.task.updateMany({ where: { id: taskId, status: "to_do" }, data: { status: "in_progress" } });
  return entry;
}

export async function stopTimer(
  prisma: PrismaClient,
  actor: Actor,
  taskId: number,
  input: StopTimerInput
): Promise<TimeEntryDto> {
  await loadTaskAccess(prisma, actor, taskId);
  const employeeId = requireEmployeeId(actor);

  const entry = await prisma.$transaction(async (tx) => {
    await lockEmployee(tx, employeeId);
    const running = await tx.timeEntry.findFirst({ where: { taskId, employeeId, endTime: null } });
    if (!running) throw ApiError.notFound("No running timer on this task");
    // A clock skew or an immediate stop must never produce a zero/negative duration.
    const endTime = new Date(Math.max(Date.now(), running.startTime.getTime() + 1000));
    return tx.timeEntry.update({
      where: { id: running.id },
      data: {
        endTime,
        ...(input.note !== undefined ? { note: input.note?.trim() || null } : {}),
      },
      include: timeEntryInclude,
    });
  });
  return toTimeEntryDto(entry);
}

async function loadEditableEntry(prisma: PrismaClient, actor: Actor, entryId: number) {
  const entry = await prisma.timeEntry.findUnique({ where: { id: entryId } });
  if (!entry) throw ApiError.notFound("Time entry not found");
  const access = await loadTaskAccess(prisma, actor, entry.taskId);
  const isOwner = actor.employeeId != null && entry.employeeId === actor.employeeId;
  if (!isOwner && !access.canManage) {
    throw ApiError.forbidden("You can only change your own time entries");
  }
  return entry;
}

export async function updateTimeEntry(
  prisma: PrismaClient,
  actor: Actor,
  entryId: number,
  input: UpdateTimeEntryInput
): Promise<TimeEntryDto> {
  const entry = await loadEditableEntry(prisma, actor, entryId);

  const startTime = input.startTime ? new Date(input.startTime) : entry.startTime;
  const endTime = input.endTime === undefined ? entry.endTime : input.endTime ? new Date(input.endTime) : null;
  assertValidRange(startTime, endTime);

  const updated = await prisma.$transaction(async (tx) => {
    // Re-opening a finished entry (endTime -> null) turns it back into a running timer.
    if (!endTime && entry.endTime) {
      await lockEmployee(tx, entry.employeeId);
      await assertNoOtherRunningTimer(tx, entry.employeeId, entry.id);
    }
    return tx.timeEntry.update({
      where: { id: entryId },
      data: {
        startTime,
        endTime,
        ...(input.note !== undefined ? { note: input.note?.trim() || null } : {}),
        ...(input.isBillable !== undefined ? { isBillable: input.isBillable } : {}),
      },
      include: timeEntryInclude,
    });
  });
  return toTimeEntryDto(updated);
}

export async function deleteTimeEntry(prisma: PrismaClient, actor: Actor, entryId: number): Promise<void> {
  await loadEditableEntry(prisma, actor, entryId);
  await prisma.timeEntry.delete({ where: { id: entryId } });
}
