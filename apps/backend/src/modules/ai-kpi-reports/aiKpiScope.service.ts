import { PrismaClient } from "../../../generated/tenant";
import { AI_KPI_MAX_CUSTOM_DAYS, AiKpiScopeType, GenerateAiKpiReportInput } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { toDateOnlyUTC } from "../../utils/date";

export const MAX_SCOPE_EMPLOYEES = 200;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface ResolvedPeriod {
  startDate: Date; // date-only UTC, inclusive
  endDate: Date; // date-only UTC, inclusive
}

export function resolvePeriod(period: GenerateAiKpiReportInput["period"], now = new Date()): ResolvedPeriod {
  const today = toDateOnlyUTC(now);

  if (period.type === "LAST_2_WEEKS" || period.type === "LAST_4_WEEKS") {
    const days = period.type === "LAST_2_WEEKS" ? 14 : 28;
    return { startDate: new Date(today.getTime() - (days - 1) * DAY_MS), endDate: today };
  }

  const startDate = new Date(period.startDate!);
  const endDate = new Date(period.endDate!);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw ApiError.badRequest("Invalid custom date range", "INVALID_PERIOD");
  }
  if (startDate.getTime() > endDate.getTime()) {
    throw ApiError.badRequest("Start date must be on or before end date", "INVALID_PERIOD");
  }
  if (endDate.getTime() > today.getTime()) {
    throw ApiError.badRequest("End date cannot be in the future", "INVALID_PERIOD");
  }
  const spanDays = Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS) + 1;
  if (spanDays > AI_KPI_MAX_CUSTOM_DAYS) {
    throw ApiError.badRequest(`Custom range cannot exceed ${AI_KPI_MAX_CUSTOM_DAYS} days`, "INVALID_PERIOD");
  }
  return { startDate, endDate };
}

export interface ResolvedScope {
  label: string;
  employees: Array<{ id: number; name: string }>;
}

async function departmentAndDescendantIds(prisma: PrismaClient, rootId: number): Promise<number[]> {
  const all = await prisma.department.findMany({ select: { id: true, parentDepartmentId: true } });
  const childrenOf = new Map<number, number[]>();
  for (const d of all) {
    if (d.parentDepartmentId == null) continue;
    childrenOf.set(d.parentDepartmentId, [...(childrenOf.get(d.parentDepartmentId) ?? []), d.id]);
  }
  const ids = [rootId];
  for (let i = 0; i < ids.length; i++) ids.push(...(childrenOf.get(ids[i]) ?? []));
  return ids;
}

export async function resolveScope(
  prisma: PrismaClient,
  scope: { type: AiKpiScopeType; id: number }
): Promise<ResolvedScope> {
  let label: string;
  let rows: Array<{ id: number; firstName: string; lastName: string }>;
  const select = { id: true, firstName: true, lastName: true } as const;

  if (scope.type === "EMPLOYEE") {
    const employee = await prisma.employee.findUnique({ where: { id: scope.id }, select });
    if (!employee) throw ApiError.notFound("Employee not found");
    label = `${employee.firstName} ${employee.lastName}`;
    rows = [employee];
  } else if (scope.type === "DEPARTMENT") {
    const department = await prisma.department.findUnique({ where: { id: scope.id } });
    if (!department) throw ApiError.notFound("Department not found");
    label = `${department.name} department`;
    const departmentIds = await departmentAndDescendantIds(prisma, scope.id);
    rows = await prisma.employee.findMany({
      where: { departmentId: { in: departmentIds }, status: "Active" },
      select,
      orderBy: { id: "asc" },
    });
  } else {
    const designation = await prisma.designation.findUnique({ where: { id: scope.id } });
    if (!designation) throw ApiError.notFound("Designation not found");
    label = `${designation.name} designation`;
    rows = await prisma.employee.findMany({
      where: { designationId: scope.id, status: "Active" },
      select,
      orderBy: { id: "asc" },
    });
  }

  if (rows.length === 0) throw ApiError.badRequest("No active employees found for the selected scope", "EMPTY_SCOPE");
  if (rows.length > MAX_SCOPE_EMPLOYEES) {
    throw ApiError.badRequest(
      `Scope has ${rows.length} employees; reports are limited to ${MAX_SCOPE_EMPLOYEES}. Pick a narrower scope.`,
      "SCOPE_TOO_LARGE"
    );
  }
  return { label, employees: rows.map((r) => ({ id: r.id, name: `${r.firstName} ${r.lastName}` })) };
}
