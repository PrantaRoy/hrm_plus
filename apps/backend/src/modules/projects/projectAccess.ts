import { PrismaClient, Prisma } from "../../../generated/tenant";
import { ApiError } from "../../utils/ApiError";

// Who can do what with projects and tasks:
//  - Admin              everything: create/edit/delete projects and tasks, people, checklist items.
//  - HR, Manager        see every project/task and can add new tasks; they cannot edit or delete.
//  - everyone else      sees only projects/tasks they supervise, are a member of, or follow.
//  - task/project supervisor (any role) can verify checklist items and moderate comments/files;
//    editing or deleting the task/project itself stays Admin-only.
export const ADMIN_ROLE = "Admin";
export const PROJECT_VIEW_ALL_ROLES = ["Admin", "HR", "Manager"];
export const TASK_CREATOR_ROLES = ["Admin", "HR", "Manager"];

export interface Actor {
  userId: number;
  role: string;
  employeeId: number | null;
  /** Full control over projects and tasks. */
  isAdmin: boolean;
  /** Sees every project and task instead of only the ones they are involved in. */
  canViewAll: boolean;
  /** May add new tasks to any visible, open project. */
  canAddTasks: boolean;
}

export async function resolveActor(prisma: PrismaClient, user: { id: number; role: string }): Promise<Actor> {
  const employee = await prisma.employee.findUnique({ where: { userId: user.id }, select: { id: true } });
  return {
    userId: user.id,
    role: user.role,
    employeeId: employee?.id ?? null,
    isAdmin: user.role === ADMIN_ROLE,
    canViewAll: PROJECT_VIEW_ALL_ROLES.includes(user.role),
    canAddTasks: TASK_CREATOR_ROLES.includes(user.role),
  };
}

export function requireEmployeeId(actor: Actor): number {
  if (actor.employeeId == null) {
    throw ApiError.badRequest("No employee profile is linked to this account", "NO_EMPLOYEE_PROFILE");
  }
  return actor.employeeId;
}

const NOTHING_VISIBLE = { id: -1 };

export function taskVisibilityWhere(actor: Actor): Prisma.TaskWhereInput {
  if (actor.canViewAll) return {};
  const e = actor.employeeId;
  if (e == null) return NOTHING_VISIBLE;
  return {
    OR: [
      { supervisorId: e },
      { members: { some: { employeeId: e } } },
      { followers: { some: { employeeId: e } } },
      { project: { supervisorId: e } },
    ],
  };
}

export function projectVisibilityWhere(actor: Actor): Prisma.ProjectWhereInput {
  if (actor.canViewAll) return {};
  const e = actor.employeeId;
  if (e == null) return NOTHING_VISIBLE;
  return {
    OR: [
      { supervisorId: e },
      { members: { some: { employeeId: e } } },
      {
        tasks: {
          some: {
            OR: [
              { supervisorId: e },
              { members: { some: { employeeId: e } } },
              { followers: { some: { employeeId: e } } },
            ],
          },
        },
      },
    ],
  };
}

export interface ProjectAccess {
  project: { id: number; code: string; supervisorId: number; status: string };
  isSupervisor: boolean;
  /** Edit the project itself, manage members, delete (Admin only). */
  canManage: boolean;
  /** Add tasks to the project (Admin, HR, Manager). */
  canCreateTasks: boolean;
  /** Resolve/delete other people's comments and files (Admin or the project supervisor). */
  canModerate: boolean;
}

/** Throws 404 when the project does not exist *or* the actor cannot see it (no existence leak). */
export async function loadProjectAccess(
  prisma: PrismaClient,
  actor: Actor,
  projectId: number
): Promise<ProjectAccess> {
  const project = await prisma.project.findFirst({
    where: { AND: [{ id: projectId }, projectVisibilityWhere(actor)] },
    select: { id: true, code: true, supervisorId: true, status: true },
  });
  if (!project) throw ApiError.notFound("Project not found");
  const isSupervisor = actor.employeeId != null && project.supervisorId === actor.employeeId;
  return {
    project,
    isSupervisor,
    canManage: actor.isAdmin,
    canCreateTasks: actor.canAddTasks,
    canModerate: actor.isAdmin || isSupervisor,
  };
}

export interface TaskAccess {
  task: {
    id: number;
    projectId: number;
    taskNumber: string;
    supervisorId: number;
    status: string;
    recurrenceParentId: number | null;
  };
  projectSupervisorId: number;
  isSupervisor: boolean;
  isMember: boolean;
  isFollower: boolean;
  /** Edit or delete the task, change its people, add/rename/delete checklist items (Admin only). */
  canManage: boolean;
  /** Verify checklist items (Admin or the task/project supervisor). */
  canVerify: boolean;
  /** Resolve/delete other people's comments and files (Admin or the task/project supervisor). */
  canModerate: boolean;
  /** Update status/progress, tick checklist items, log time (Admin, supervisors and members). */
  canWork: boolean;
}

/** Throws 404 when the task does not exist *or* the actor cannot see it. */
export async function loadTaskAccess(prisma: PrismaClient, actor: Actor, taskId: number): Promise<TaskAccess> {
  const row = await prisma.task.findFirst({
    where: { AND: [{ id: taskId }, taskVisibilityWhere(actor)] },
    select: {
      id: true,
      projectId: true,
      taskNumber: true,
      supervisorId: true,
      status: true,
      recurrenceParentId: true,
      project: { select: { supervisorId: true } },
      members: { select: { employeeId: true } },
      followers: { select: { employeeId: true } },
    },
  });
  if (!row) throw ApiError.notFound("Task not found");

  const e = actor.employeeId;
  const isSupervisor = e != null && (row.supervisorId === e || row.project.supervisorId === e);
  const isMember = e != null && row.members.some((m) => m.employeeId === e);
  const isFollower = e != null && row.followers.some((f) => f.employeeId === e);
  const canVerify = actor.isAdmin || isSupervisor;

  return {
    task: {
      id: row.id,
      projectId: row.projectId,
      taskNumber: row.taskNumber,
      supervisorId: row.supervisorId,
      status: row.status,
      recurrenceParentId: row.recurrenceParentId,
    },
    projectSupervisorId: row.project.supervisorId,
    isSupervisor,
    isMember,
    isFollower,
    canManage: actor.isAdmin,
    canVerify,
    canModerate: canVerify,
    canWork: actor.isAdmin || isSupervisor || isMember,
  };
}

export type OwnerType = "task" | "project";

export interface OwnerAccess {
  /** Comment on / upload to / read the owner (anyone who can see it). */
  canContribute: boolean;
  /** Moderate: resolve comments, delete others' comments/files. */
  canModerate: boolean;
}

/** Resolves access for a polymorphic owner. Throws 404 if it does not exist or is not visible. */
export async function loadOwnerAccess(
  prisma: PrismaClient,
  actor: Actor,
  type: OwnerType,
  id: number
): Promise<OwnerAccess> {
  if (type === "task") {
    const access = await loadTaskAccess(prisma, actor, id);
    return { canContribute: true, canModerate: access.canModerate };
  }
  const access = await loadProjectAccess(prisma, actor, id);
  return { canContribute: true, canModerate: access.canModerate };
}

export async function assertEmployeesExist(
  prisma: Pick<PrismaClient, "employee">,
  employeeIds: number[]
): Promise<void> {
  const unique = Array.from(new Set(employeeIds));
  if (unique.length === 0) return;
  const found = await prisma.employee.count({ where: { id: { in: unique } } });
  if (found !== unique.length) {
    throw ApiError.badRequest("One or more employees do not exist", "INVALID_EMPLOYEE");
  }
}

export function employeeName(employee: { firstName: string; lastName: string }): string {
  return `${employee.firstName} ${employee.lastName}`;
}
