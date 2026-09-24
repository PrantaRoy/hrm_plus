import { Prisma, PrismaClient } from "../../../generated/tenant";
import { MyWorkDashboardDto, ProjectDto, TaskDto } from "@hrm-plus/shared";
import { projectInclude, toProjectDto } from "../projects/project.mapper";
import { Actor } from "../projects/projectAccess";
import { taskInclude, toTaskDto } from "./task.mapper";

const LIMIT = 10;

// Work that is still ahead of someone; finished/cancelled tasks never show up.
const ACTIVE_TASK_STATUSES = ["to_do", "in_progress", "on_hold"];
// Tasks in these projects are hidden; a completed project still lists its open tasks.
const CLOSED_PROJECT_STATUSES = ["archived", "cancelled"];
const ENDED_PROJECT_STATUSES = ["completed", "cancelled", "archived"];

// Soonest due first, undated last.
const TASK_ORDER: Prisma.TaskOrderByWithRelationInput[] = [
  { dueDate: { sort: "asc", nulls: "last" } },
  { id: "asc" },
];
const PROJECT_ORDER: Prisma.ProjectOrderByWithRelationInput[] = [
  { targetEndDate: { sort: "asc", nulls: "last" } },
  { id: "asc" },
];

const EMPTY: MyWorkDashboardDto = {
  runningTimer: null,
  inProgressTasks: [],
  upcomingTasks: [],
  supervisedProjects: [],
  supervisedTasks: [],
  followedTasks: [],
  totals: { inProgressTasks: 0, upcomingTasks: 0, supervisedProjects: 0, supervisedTasks: 0, followedTasks: 0 },
};

async function taskList(prisma: PrismaClient, where: Prisma.TaskWhereInput): Promise<[TaskDto[], number]> {
  const [rows, total] = await Promise.all([
    prisma.task.findMany({ where, include: taskInclude, orderBy: TASK_ORDER, take: LIMIT }),
    prisma.task.count({ where }),
  ]);
  return [rows.map(toTaskDto), total];
}

async function projectList(
  prisma: PrismaClient,
  where: Prisma.ProjectWhereInput
): Promise<[ProjectDto[], number]> {
  const [rows, total] = await Promise.all([
    prisma.project.findMany({ where, include: projectInclude, orderBy: PROJECT_ORDER, take: LIMIT }),
    prisma.project.count({ where }),
  ]);
  return [rows.map(toProjectDto), total];
}

/**
 * The caller's own project/task picture: what they work on (member), supervise and follow.
 * Deliberately scoped to the caller's employee for every role — managers see the
 * organisation-wide view elsewhere. A user without an employee profile gets empty lists.
 */
export async function getMyWorkDashboard(prisma: PrismaClient, actor: Actor): Promise<MyWorkDashboardDto> {
  const me = actor.employeeId;
  if (me == null) return EMPTY;

  const inOpenProject: Prisma.TaskWhereInput = { project: { status: { notIn: CLOSED_PROJECT_STATUSES } } };
  const asMember: Prisma.TaskWhereInput = { ...inOpenProject, members: { some: { employeeId: me } } };

  const [running, inProgress, upcoming, supervisedProjects, supervisedTasks, followed] = await Promise.all([
    prisma.timeEntry.findFirst({
      where: { employeeId: me, endTime: null },
      include: { task: { select: { taskNumber: true, title: true } } },
    }),
    taskList(prisma, { ...asMember, status: "in_progress" }),
    taskList(prisma, { ...asMember, status: "to_do" }),
    projectList(prisma, { supervisorId: me, status: { notIn: ENDED_PROJECT_STATUSES } }),
    taskList(prisma, { ...inOpenProject, supervisorId: me, status: { in: ACTIVE_TASK_STATUSES } }),
    taskList(prisma, {
      ...inOpenProject,
      followers: { some: { employeeId: me } },
      status: { in: ACTIVE_TASK_STATUSES },
    }),
  ]);

  return {
    runningTimer: running
      ? {
          entryId: running.id,
          taskId: running.taskId,
          taskNumber: running.task.taskNumber,
          taskTitle: running.task.title,
          startTime: running.startTime.toISOString(),
        }
      : null,
    inProgressTasks: inProgress[0],
    upcomingTasks: upcoming[0],
    supervisedProjects: supervisedProjects[0],
    supervisedTasks: supervisedTasks[0],
    followedTasks: followed[0],
    totals: {
      inProgressTasks: inProgress[1],
      upcomingTasks: upcoming[1],
      supervisedProjects: supervisedProjects[1],
      supervisedTasks: supervisedTasks[1],
      followedTasks: followed[1],
    },
  };
}
