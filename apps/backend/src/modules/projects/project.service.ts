import { PrismaClient, Prisma } from "../../../generated/tenant";
import { CreateProjectInput, PaginatedResult, ProjectDto, UpdateProjectInput } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { projectInclude, toProjectDto } from "./project.mapper";
import {
  Actor,
  assertEmployeesExist,
  loadProjectAccess,
  projectVisibilityWhere,
} from "./projectAccess";
import { generateUniqueProjectCode } from "./projectCode";
import { deleteStoredFiles, purgeOwnedRecords } from "./ownedRecords";

export interface ListProjectsOptions {
  page: number;
  pageSize: number;
  status?: string;
  clientId?: number;
  supervisorId?: number;
  search?: string;
}

// Update/member changes are manager-only, so the caller can manage and create tasks.
const MANAGER_VIEWER = { canManage: true, canCreateTasks: true };

function dayFromDateString(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function assertManager(actor: Actor): void {
  if (!actor.isManager) throw ApiError.forbidden("Only Admin, HR or Manager users can manage projects");
}

function assertDeadline(deadlineType: string, startDate: Date, targetEndDate: Date | null): void {
  if (deadlineType === "fixed" && !targetEndDate) {
    throw ApiError.badRequest("A fixed deadline requires a target end date", "TARGET_END_DATE_REQUIRED");
  }
  if (targetEndDate && targetEndDate < startDate) {
    throw ApiError.badRequest("Target end date cannot be before the start date", "INVALID_DATE_RANGE");
  }
}

async function assertClientExists(prisma: PrismaClient, clientId: number | null | undefined): Promise<void> {
  if (clientId == null) return;
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
  if (!client) throw ApiError.badRequest("Client does not exist", "INVALID_CLIENT");
}

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

export async function listProjects(
  prisma: PrismaClient,
  actor: Actor,
  options: ListProjectsOptions
): Promise<PaginatedResult<ProjectDto>> {
  const where: Prisma.ProjectWhereInput = {
    AND: [
      projectVisibilityWhere(actor),
      ...(options.status ? [{ status: options.status }] : []),
      ...(options.clientId ? [{ clientId: options.clientId }] : []),
      ...(options.supervisorId ? [{ supervisorId: options.supervisorId }] : []),
      ...(options.search
        ? [{ OR: [{ title: { contains: options.search } }, { code: { contains: options.search } }] }]
        : []),
    ],
  };

  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: projectInclude,
      orderBy: { createdAt: "desc" },
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    }),
    prisma.project.count({ where }),
  ]);

  return { items: items.map(toProjectDto), total, page: options.page, pageSize: options.pageSize };
}

export async function getProject(prisma: PrismaClient, actor: Actor, id: number): Promise<ProjectDto> {
  const access = await loadProjectAccess(prisma, actor, id);
  const project = await prisma.project.findUniqueOrThrow({ where: { id }, include: projectInclude });
  return { ...toProjectDto(project), viewer: { canManage: access.canManage, canCreateTasks: access.canCreateTasks } };
}

export async function createProject(
  prisma: PrismaClient,
  actor: Actor,
  input: CreateProjectInput
): Promise<ProjectDto> {
  assertManager(actor);

  const startDate = dayFromDateString(input.startDate);
  const targetEndDate = input.targetEndDate ? dayFromDateString(input.targetEndDate) : null;
  assertDeadline(input.deadlineType, startDate, targetEndDate);

  const memberIds = Array.from(new Set(input.memberIds ?? []));
  await assertEmployeesExist(prisma, [input.supervisorId, ...memberIds]);
  await assertClientExists(prisma, input.clientId);

  if (input.code) {
    const taken = await prisma.project.findUnique({ where: { code: input.code }, select: { id: true } });
    if (taken) throw ApiError.conflict("Project code is already in use", "PROJECT_CODE_TAKEN");
  }

  // A generated code can still race with a concurrent create; retry with a fresh candidate.
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = input.code ?? (await generateUniqueProjectCode(prisma, input.title));
    try {
      const created = await prisma.project.create({
        data: {
          code,
          title: input.title,
          contractType: input.contractType,
          clientId: input.clientId ?? null,
          status: input.status ?? "not_started",
          totalAmount: input.totalAmount,
          estimatedHours: input.estimatedHours,
          deadlineType: input.deadlineType,
          startDate,
          targetEndDate,
          supervisorId: input.supervisorId,
          priority: input.priority,
          description: input.description ?? "",
          tags: input.tags ?? [],
          createdById: actor.userId,
          members: { create: memberIds.map((employeeId) => ({ employeeId })) },
        },
        include: projectInclude,
      });
      return toProjectDto(created);
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      if (input.code) throw ApiError.conflict("Project code is already in use", "PROJECT_CODE_TAKEN");
    }
  }
  throw ApiError.conflict("Could not allocate a unique project code, please retry", "PROJECT_CODE_TAKEN");
}

export async function updateProject(
  prisma: PrismaClient,
  actor: Actor,
  id: number,
  input: UpdateProjectInput
): Promise<ProjectDto> {
  assertManager(actor);
  await loadProjectAccess(prisma, actor, id);
  const existing = await prisma.project.findUniqueOrThrow({ where: { id } });

  const startDate = input.startDate ? dayFromDateString(input.startDate) : existing.startDate;
  const targetEndDate =
    input.targetEndDate === undefined
      ? existing.targetEndDate
      : input.targetEndDate
        ? dayFromDateString(input.targetEndDate)
        : null;
  assertDeadline(input.deadlineType ?? existing.deadlineType, startDate, targetEndDate);

  const memberIds = input.memberIds ? Array.from(new Set(input.memberIds)) : undefined;
  await assertEmployeesExist(prisma, [
    ...(input.supervisorId !== undefined ? [input.supervisorId] : []),
    ...(memberIds ?? []),
  ]);
  if (input.clientId !== undefined) await assertClientExists(prisma, input.clientId);

  const updated = await prisma.$transaction(async (tx) => {
    if (memberIds) {
      await tx.projectMember.deleteMany({ where: { projectId: id } });
      await tx.projectMember.createMany({ data: memberIds.map((employeeId) => ({ projectId: id, employeeId })) });
    }
    return tx.project.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.contractType !== undefined ? { contractType: input.contractType } : {}),
        ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.totalAmount !== undefined ? { totalAmount: input.totalAmount } : {}),
        ...(input.estimatedHours !== undefined ? { estimatedHours: input.estimatedHours } : {}),
        ...(input.deadlineType !== undefined ? { deadlineType: input.deadlineType } : {}),
        startDate,
        targetEndDate,
        ...(input.supervisorId !== undefined ? { supervisorId: input.supervisorId } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
      },
      include: projectInclude,
    });
  });
  return { ...toProjectDto(updated), viewer: MANAGER_VIEWER };
}

export async function setProjectMembers(
  prisma: PrismaClient,
  actor: Actor,
  id: number,
  employeeIds: number[]
): Promise<ProjectDto> {
  assertManager(actor);
  await loadProjectAccess(prisma, actor, id);
  const unique = Array.from(new Set(employeeIds));
  await assertEmployeesExist(prisma, unique);

  await prisma.$transaction([
    prisma.projectMember.deleteMany({ where: { projectId: id } }),
    prisma.projectMember.createMany({ data: unique.map((employeeId) => ({ projectId: id, employeeId })) }),
  ]);
  const project = await prisma.project.findUniqueOrThrow({ where: { id }, include: projectInclude });
  return { ...toProjectDto(project), viewer: MANAGER_VIEWER };
}

/** Projects that have tasks are archived (status = "archived") instead of deleted. */
export async function deleteProject(prisma: PrismaClient, actor: Actor, id: number): Promise<void> {
  assertManager(actor);
  await loadProjectAccess(prisma, actor, id);

  const taskCount = await prisma.task.count({ where: { projectId: id } });
  if (taskCount > 0) {
    throw ApiError.conflict(
      "This project has tasks and cannot be deleted. Archive it instead.",
      "PROJECT_HAS_TASKS"
    );
  }

  const fileKeys = await prisma.$transaction(async (tx) => {
    const keys = await purgeOwnedRecords(tx, "project", id);
    await tx.project.delete({ where: { id } });
    return keys;
  });
  await deleteStoredFiles(fileKeys);
}
