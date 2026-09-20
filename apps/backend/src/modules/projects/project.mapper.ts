import { Prisma } from "../../../generated/tenant";
import {
  ContractType,
  DeadlineType,
  ProjectDto,
  ProjectPriority,
  ProjectStatus,
} from "@hrm-plus/shared";
import { employeeName } from "./projectAccess";

const projectWithRelations = Prisma.validator<Prisma.ProjectDefaultArgs>()({
  include: {
    client: { select: { id: true, name: true } },
    supervisor: { select: { id: true, firstName: true, lastName: true } },
    members: {
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { id: "asc" },
    },
    _count: { select: { tasks: true } },
  },
});

export type ProjectWithRelations = Prisma.ProjectGetPayload<typeof projectWithRelations>;
export const projectInclude = projectWithRelations.include;

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function parseTags(value: Prisma.JsonValue): string[] {
  return Array.isArray(value) ? value.filter((t): t is string => typeof t === "string") : [];
}

export function toProjectDto(project: ProjectWithRelations): ProjectDto {
  return {
    id: project.id,
    code: project.code,
    title: project.title,
    contractType: project.contractType as ContractType,
    clientId: project.clientId,
    clientName: project.client?.name ?? null,
    status: project.status as ProjectStatus,
    totalAmount: Number(project.totalAmount),
    estimatedHours: Number(project.estimatedHours),
    deadlineType: project.deadlineType as DeadlineType,
    startDate: dateOnly(project.startDate),
    targetEndDate: project.targetEndDate ? dateOnly(project.targetEndDate) : null,
    supervisor: { id: project.supervisor.id, name: employeeName(project.supervisor) },
    priority: project.priority as ProjectPriority,
    description: project.description,
    tags: parseTags(project.tags),
    progressPercentage: project.progressPercentage,
    members: project.members.map((m) => ({ id: m.employee.id, name: employeeName(m.employee) })),
    taskCount: project._count.tasks,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}
