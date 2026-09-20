import { Prisma } from "../../../generated/tenant";
import {
  ChecklistDto,
  RecurrenceFrequency,
  TaskDto,
  TaskPriority,
  TaskStatus,
  TaskTimeType,
  TimeEntryDto,
} from "@hrm-plus/shared";
import { employeeName } from "../projects/projectAccess";

const employeeRef = { select: { id: true, firstName: true, lastName: true } } as const;

const taskWithRelations = Prisma.validator<Prisma.TaskDefaultArgs>()({
  include: {
    project: { select: { id: true, title: true } },
    supervisor: employeeRef,
    members: { include: { employee: employeeRef }, orderBy: { id: "asc" } },
    followers: { include: { employee: employeeRef }, orderBy: { id: "asc" } },
    checklists: { orderBy: { id: "asc" } },
  },
});

export type TaskWithRelations = Prisma.TaskGetPayload<typeof taskWithRelations>;
export const taskInclude = taskWithRelations.include;

export function toChecklistDto(item: {
  id: number;
  taskId: number;
  title: string;
  isCompleted: boolean;
  isVerified: boolean;
}): ChecklistDto {
  return {
    id: item.id,
    taskId: item.taskId,
    title: item.title,
    isCompleted: item.isCompleted,
    isVerified: item.isVerified,
  };
}

export function toTaskDto(task: TaskWithRelations): TaskDto {
  return {
    id: task.id,
    projectId: task.projectId,
    projectTitle: task.project.title,
    taskNumber: task.taskNumber,
    title: task.title,
    priority: task.priority as TaskPriority,
    status: task.status as TaskStatus,
    timeType: task.timeType as TaskTimeType,
    budgetAmount: task.budgetAmount != null ? Number(task.budgetAmount) : null,
    recurrenceFrequency: task.recurrenceFrequency as RecurrenceFrequency,
    recurrenceIntervalDays: task.recurrenceIntervalDays,
    totalCycles: task.totalCycles,
    nextRecurrenceAt: task.nextRecurrenceAt ? task.nextRecurrenceAt.toISOString() : null,
    recurrenceParentId: task.recurrenceParentId,
    supervisor: { id: task.supervisor.id, name: employeeName(task.supervisor) },
    description: task.description,
    progressPercentage: task.progressPercentage,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    members: task.members.map((m) => ({ id: m.employee.id, name: employeeName(m.employee) })),
    followers: task.followers.map((f) => ({ id: f.employee.id, name: employeeName(f.employee) })),
    checklists: task.checklists.map(toChecklistDto),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

const timeEntryWithRelations = Prisma.validator<Prisma.TimeEntryDefaultArgs>()({
  include: { employee: employeeRef, task: { select: { taskNumber: true } } },
});

export type TimeEntryWithRelations = Prisma.TimeEntryGetPayload<typeof timeEntryWithRelations>;
export const timeEntryInclude = timeEntryWithRelations.include;

export function durationMinutes(startTime: Date, endTime: Date | null): number | null {
  return endTime ? Math.max(0, Math.round((endTime.getTime() - startTime.getTime()) / 60000)) : null;
}

export function toTimeEntryDto(entry: TimeEntryWithRelations): TimeEntryDto {
  return {
    id: entry.id,
    taskId: entry.taskId,
    taskNumber: entry.task.taskNumber,
    employee: { id: entry.employee.id, name: employeeName(entry.employee) },
    startTime: entry.startTime.toISOString(),
    endTime: entry.endTime ? entry.endTime.toISOString() : null,
    note: entry.note,
    isBillable: entry.isBillable,
    isRunning: entry.endTime == null,
    durationMinutes: durationMinutes(entry.startTime, entry.endTime),
  };
}
