import { PrismaClient, Prisma } from "../../../generated/tenant";
import { CreateTaskInput, PaginatedResult, TaskDto, UpdateTaskInput } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import {
  Actor,
  assertEmployeesExist,
  loadProjectAccess,
  loadTaskAccess,
  TaskAccess,
  requireEmployeeId,
  taskVisibilityWhere,
} from "../projects/projectAccess";
import { deleteStoredFiles, purgeOwnedRecords } from "../projects/ownedRecords";
import { recalculateProjectProgress } from "../projects/projectProgress";
import { taskInclude, toTaskDto } from "./task.mapper";
import { resolveRecurrence, RecurrenceState } from "./recurrence";
import { createTaskWithNumber } from "./taskNumber.service";

export interface ListTasksOptions {
  page: number;
  pageSize: number;
  projectId?: number;
  status?: string;
  priority?: string;
  supervisorId?: number;
  memberId?: number;
  search?: string;
  dueBefore?: string;
  dueAfter?: string;
}

// Everyone except an Admin may only report progress on a task (status, progress %).
const MEMBER_EDITABLE_FIELDS = ["status", "progressPercentage"];

const CLOSED_PROJECT_STATUSES = ["archived", "cancelled"];

function withViewer(
  dto: TaskDto,
  access: Pick<TaskAccess, "canManage" | "canWork" | "canVerify" | "canModerate">
): TaskDto {
  return {
    ...dto,
    viewer: {
      canManage: access.canManage,
      canWork: access.canWork,
      canVerify: access.canVerify,
      canModerate: access.canModerate,
    },
  };
}

function unique(ids: number[] | undefined): number[] {
  return Array.from(new Set(ids ?? []));
}

function progressFor(status: string | undefined, progress: number | undefined): number | undefined {
  return status === "completed" && progress === undefined ? 100 : progress;
}

async function listWhere(
  prisma: PrismaClient,
  base: Prisma.TaskWhereInput,
  options: ListTasksOptions
): Promise<PaginatedResult<TaskDto>> {
  const where: Prisma.TaskWhereInput = {
    AND: [
      base,
      ...(options.projectId ? [{ projectId: options.projectId }] : []),
      ...(options.status ? [{ status: options.status }] : []),
      ...(options.priority ? [{ priority: options.priority }] : []),
      ...(options.supervisorId ? [{ supervisorId: options.supervisorId }] : []),
      ...(options.memberId ? [{ members: { some: { employeeId: options.memberId } } }] : []),
      ...(options.search
        ? [{ OR: [{ title: { contains: options.search } }, { taskNumber: { contains: options.search } }] }]
        : []),
      ...(options.dueBefore ? [{ dueDate: { lte: new Date(options.dueBefore) } }] : []),
      ...(options.dueAfter ? [{ dueDate: { gte: new Date(options.dueAfter) } }] : []),
    ],
  };

  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    }),
    prisma.task.count({ where }),
  ]);

  return { items: items.map(toTaskDto), total, page: options.page, pageSize: options.pageSize };
}

export function listTasks(
  prisma: PrismaClient,
  actor: Actor,
  options: ListTasksOptions
): Promise<PaginatedResult<TaskDto>> {
  return listWhere(prisma, taskVisibilityWhere(actor), options);
}

/** Tasks the caller supervises or is a member of (followers excluded). */
export function listMyTasks(
  prisma: PrismaClient,
  actor: Actor,
  options: ListTasksOptions
): Promise<PaginatedResult<TaskDto>> {
  const employeeId = requireEmployeeId(actor);
  return listWhere(
    prisma,
    { OR: [{ supervisorId: employeeId }, { members: { some: { employeeId } } }] },
    options
  );
}

export async function getTask(prisma: PrismaClient, actor: Actor, id: number): Promise<TaskDto> {
  const access = await loadTaskAccess(prisma, actor, id);
  return withViewer(toTaskDto(await prisma.task.findUniqueOrThrow({ where: { id }, include: taskInclude })), access);
}

export async function createTask(prisma: PrismaClient, actor: Actor, input: CreateTaskInput): Promise<TaskDto> {
  const access = await loadProjectAccess(prisma, actor, input.projectId);
  if (!access.canCreateTasks) {
    throw ApiError.forbidden("Only Admin, HR or Manager users can add tasks");
  }
  if (CLOSED_PROJECT_STATUSES.includes(access.project.status)) {
    throw ApiError.conflict("Tasks cannot be added to an archived or cancelled project", "PROJECT_CLOSED");
  }

  const supervisorId = input.supervisorId ?? access.project.supervisorId;
  const memberIds = unique(input.memberIds);
  const followerIds = unique(input.followerIds);
  await assertEmployeesExist(prisma, [supervisorId, ...memberIds, ...followerIds]);

  const recurrence = resolveRecurrence(
    null,
    {
      frequency: input.recurrenceFrequency,
      intervalDays: input.recurrenceIntervalDays,
      totalCycles: input.totalCycles,
    },
    new Date()
  );
  const status = input.status ?? "to_do";

  const task = await prisma.$transaction(async (tx) => {
    const created = await createTaskWithNumber(tx, {
      projectId: input.projectId,
      title: input.title,
      priority: input.priority,
      status,
      timeType: input.timeType,
      budgetAmount: input.budgetAmount ?? null,
      recurrenceFrequency: recurrence.frequency,
      recurrenceIntervalDays: recurrence.intervalDays,
      totalCycles: recurrence.totalCycles,
      nextRecurrenceAt: recurrence.nextRecurrenceAt,
      supervisorId,
      description: input.description ?? "",
      progressPercentage: progressFor(status, input.progressPercentage) ?? 0,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      completedAt: status === "completed" ? new Date() : null,
      createdById: actor.userId,
    });

    if (memberIds.length) {
      await tx.taskMember.createMany({ data: memberIds.map((employeeId) => ({ taskId: created.id, employeeId })) });
    }
    if (followerIds.length) {
      await tx.taskFollower.createMany({ data: followerIds.map((employeeId) => ({ taskId: created.id, employeeId })) });
    }
    if (input.checklist?.length) {
      await tx.checklist.createMany({ data: input.checklist.map((title) => ({ taskId: created.id, title })) });
    }

    await recalculateProjectProgress(tx, input.projectId);
    return tx.task.findUniqueOrThrow({ where: { id: created.id }, include: taskInclude });
  });

  // What the creator may do with the task depends on their role (HR/Manager can add but not edit).
  return withViewer(toTaskDto(task), await loadTaskAccess(prisma, actor, task.id));
}

export async function updateTask(
  prisma: PrismaClient,
  actor: Actor,
  id: number,
  input: UpdateTaskInput
): Promise<TaskDto> {
  const access = await loadTaskAccess(prisma, actor, id);
  if (!access.canManage) {
    if (!access.canWork) throw ApiError.forbidden("Only an Admin can edit this task");
    const disallowed = Object.keys(input).filter((key) => !MEMBER_EDITABLE_FIELDS.includes(key));
    if (disallowed.length > 0) {
      throw ApiError.forbidden(`Only an Admin can edit a task. You can update: ${MEMBER_EDITABLE_FIELDS.join(", ")}`);
    }
  }

  const existing = await prisma.task.findUniqueOrThrow({ where: { id } });

  const memberIds = input.memberIds ? unique(input.memberIds) : undefined;
  const followerIds = input.followerIds ? unique(input.followerIds) : undefined;
  await assertEmployeesExist(prisma, [
    ...(input.supervisorId !== undefined ? [input.supervisorId] : []),
    ...(memberIds ?? []),
    ...(followerIds ?? []),
  ]);

  const touchesRecurrence =
    input.recurrenceFrequency !== undefined ||
    input.recurrenceIntervalDays !== undefined ||
    input.totalCycles !== undefined;
  let recurrence: RecurrenceState | null = null;
  if (touchesRecurrence) {
    recurrence = resolveRecurrence(
      {
        frequency: existing.recurrenceFrequency as RecurrenceState["frequency"],
        intervalDays: existing.recurrenceIntervalDays,
        totalCycles: existing.totalCycles,
        nextRecurrenceAt: existing.nextRecurrenceAt,
      },
      {
        frequency: input.recurrenceFrequency,
        intervalDays: input.recurrenceIntervalDays,
        totalCycles: input.totalCycles,
      },
      new Date()
    );
  }

  const progress = progressFor(input.status, input.progressPercentage);

  const updated = await prisma.$transaction(async (tx) => {
    if (memberIds) {
      await tx.taskMember.deleteMany({ where: { taskId: id } });
      await tx.taskMember.createMany({ data: memberIds.map((employeeId) => ({ taskId: id, employeeId })) });
    }
    if (followerIds) {
      await tx.taskFollower.deleteMany({ where: { taskId: id } });
      await tx.taskFollower.createMany({ data: followerIds.map((employeeId) => ({ taskId: id, employeeId })) });
    }

    const task = await tx.task.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        // Stamp the moment a task becomes completed (kept if it already was), clear it when reopened.
        ...(input.status !== undefined
          ? { completedAt: input.status === "completed" ? (existing.completedAt ?? new Date()) : null }
          : {}),
        ...(input.timeType !== undefined ? { timeType: input.timeType } : {}),
        ...(input.budgetAmount !== undefined ? { budgetAmount: input.budgetAmount } : {}),
        ...(recurrence
          ? {
              recurrenceFrequency: recurrence.frequency,
              recurrenceIntervalDays: recurrence.intervalDays,
              totalCycles: recurrence.totalCycles,
              nextRecurrenceAt: recurrence.nextRecurrenceAt,
            }
          : {}),
        ...(input.supervisorId !== undefined ? { supervisorId: input.supervisorId } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(progress !== undefined ? { progressPercentage: progress } : {}),
        ...(input.dueDate !== undefined ? { dueDate: input.dueDate ? new Date(input.dueDate) : null } : {}),
      },
      include: taskInclude,
    });

    if (input.status !== undefined || progress !== undefined) {
      await recalculateProjectProgress(tx, task.projectId);
    }
    return task;
  });

  return withViewer(toTaskDto(updated), access);
}

export async function setTaskPeople(
  prisma: PrismaClient,
  actor: Actor,
  id: number,
  kind: "members" | "followers",
  employeeIds: number[]
): Promise<TaskDto> {
  const access = await loadTaskAccess(prisma, actor, id);
  if (!access.canManage) throw ApiError.forbidden("Only an Admin can change task members and followers");

  const ids = unique(employeeIds);
  await assertEmployeesExist(prisma, ids);

  await prisma.$transaction(async (tx) => {
    if (kind === "members") {
      await tx.taskMember.deleteMany({ where: { taskId: id } });
      await tx.taskMember.createMany({ data: ids.map((employeeId) => ({ taskId: id, employeeId })) });
    } else {
      await tx.taskFollower.deleteMany({ where: { taskId: id } });
      await tx.taskFollower.createMany({ data: ids.map((employeeId) => ({ taskId: id, employeeId })) });
    }
  });

  return withViewer(toTaskDto(await prisma.task.findUniqueOrThrow({ where: { id }, include: taskInclude })), access);
}

/**
 * Deleting a task that has logged time would silently destroy billable/payroll data, so
 * those tasks must be cancelled instead. Generated recurrence cycles survive (their
 * recurrenceParentId is set to NULL by the FK).
 */
export async function deleteTask(prisma: PrismaClient, actor: Actor, id: number): Promise<void> {
  const access = await loadTaskAccess(prisma, actor, id);
  if (!access.canManage) throw ApiError.forbidden("Only an Admin can delete tasks");

  const loggedEntries = await prisma.timeEntry.count({ where: { taskId: id } });
  if (loggedEntries > 0) {
    throw ApiError.conflict(
      "This task has logged time and cannot be deleted. Cancel it instead.",
      "TASK_HAS_TIME_ENTRIES"
    );
  }

  const fileKeys = await prisma.$transaction(async (tx) => {
    const keys = await purgeOwnedRecords(tx, "task", id);
    await tx.task.delete({ where: { id } });
    await recalculateProjectProgress(tx, access.task.projectId);
    return keys;
  });
  await deleteStoredFiles(fileKeys);
}
