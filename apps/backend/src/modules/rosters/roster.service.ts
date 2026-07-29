import { PrismaClient, Prisma } from "../../../generated/tenant";
import {
  AutoGenerateRosterResult,
  CreateRosterInput,
  PaginatedResult,
  RosterDto,
  UpdateRosterInput,
} from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { rosterInclude, toRosterDto } from "./roster.mapper";
import { toAssignmentDto } from "./assignment.mapper";
import { DutyScheduleAssignmentDto } from "@hrm-plus/shared";

export interface ListRostersOptions {
  page: number;
  pageSize: number;
  departmentId?: number;
  status?: string;
}

const PERIOD_MAX_DAYS: Record<string, number> = {
  Weekly: 10,
  Fortnightly: 20,
  Monthly: 35,
};

export async function listRosters(
  prisma: PrismaClient,
  options: ListRostersOptions
): Promise<PaginatedResult<RosterDto>> {
  const where: Prisma.RosterWhereInput = {
    ...(options.departmentId ? { departmentId: options.departmentId } : {}),
    ...(options.status ? { status: options.status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.roster.findMany({
      where,
      include: rosterInclude,
      orderBy: { createdAt: "desc" },
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    }),
    prisma.roster.count({ where }),
  ]);

  return {
    items: items.map(toRosterDto),
    total,
    page: options.page,
    pageSize: options.pageSize,
  };
}

export async function getRosterById(prisma: PrismaClient, id: number): Promise<RosterDto> {
  const roster = await prisma.roster.findUnique({ where: { id }, include: rosterInclude });
  if (!roster) {
    throw ApiError.notFound("Roster not found");
  }
  return toRosterDto(roster);
}

function validateDateRange(periodType: string, startDate: Date, endDate: Date) {
  if (endDate < startDate) {
    throw ApiError.badRequest("endDate must be on or after startDate");
  }
  const days = Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const maxDays = PERIOD_MAX_DAYS[periodType] ?? 35;
  if (days > maxDays) {
    throw ApiError.badRequest(`${periodType} rosters cannot span more than ${maxDays} days`);
  }
}

export async function createRoster(
  prisma: PrismaClient,
  input: CreateRosterInput,
  createdById: number
): Promise<RosterDto> {
  const department = await prisma.department.findUnique({ where: { id: input.departmentId } });
  if (!department) {
    throw ApiError.badRequest("Unknown departmentId");
  }

  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);
  validateDateRange(input.periodType, startDate, endDate);

  const roster = await prisma.roster.create({
    data: {
      departmentId: input.departmentId,
      periodType: input.periodType,
      startDate,
      endDate,
      status: "Draft",
      createdById,
    },
    include: rosterInclude,
  });

  return toRosterDto(roster);
}

export async function updateRoster(
  prisma: PrismaClient,
  id: number,
  input: UpdateRosterInput,
  updatedById: number
): Promise<RosterDto> {
  const existing = await prisma.roster.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Roster not found");
  }
  if (existing.status !== "Draft") {
    throw ApiError.conflict("Only draft rosters can be edited");
  }

  const periodType = input.periodType ?? existing.periodType;
  const startDate = input.startDate ? new Date(input.startDate) : existing.startDate;
  const endDate = input.endDate ? new Date(input.endDate) : existing.endDate;
  validateDateRange(periodType, startDate, endDate);

  const roster = await prisma.roster.update({
    where: { id },
    data: { periodType, startDate, endDate, updatedById },
    include: rosterInclude,
  });

  return toRosterDto(roster);
}

export async function deleteRoster(prisma: PrismaClient, id: number): Promise<void> {
  const existing = await prisma.roster.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Roster not found");
  }
  if (existing.status !== "Draft") {
    throw ApiError.conflict("Only draft rosters can be deleted");
  }
  await prisma.$transaction([
    prisma.dutyScheduleAssignment.deleteMany({ where: { rosterId: id } }),
    prisma.roster.delete({ where: { id } }),
  ]);
}

export async function approveRoster(
  prisma: PrismaClient,
  id: number,
  approvedById: number
): Promise<RosterDto> {
  const existing = await prisma.roster.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Roster not found");
  }
  if (existing.status === "Approved") {
    throw ApiError.conflict("Roster is already approved");
  }

  const assignmentCount = await prisma.dutyScheduleAssignment.count({ where: { rosterId: id } });
  if (assignmentCount === 0) {
    throw ApiError.conflict("Cannot approve a roster with no assignments");
  }

  const roster = await prisma.roster.update({
    where: { id },
    data: { status: "Approved", approvedById, approvedAt: new Date() },
    include: rosterInclude,
  });

  return toRosterDto(roster);
}

function enumerateDates(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(
    Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate())
  );
  const end = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));
  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

const JS_WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function autoGenerateRoster(
  prisma: PrismaClient,
  id: number,
  overwriteExisting: boolean,
  generatedById: number
): Promise<AutoGenerateRosterResult> {
  const roster = await prisma.roster.findUnique({ where: { id } });
  if (!roster) {
    throw ApiError.notFound("Roster not found");
  }
  if (roster.status !== "Draft") {
    throw ApiError.conflict("Only draft rosters can be auto-generated");
  }

  const existingCount = await prisma.dutyScheduleAssignment.count({ where: { rosterId: id } });
  if (existingCount > 0 && !overwriteExisting) {
    throw ApiError.conflict("Roster already has assignments; pass overwriteExisting=true to regenerate");
  }

  const employees = await prisma.employee.findMany({
    where: { departmentId: roster.departmentId, status: "Active" },
    orderBy: { id: "asc" },
  });
  if (employees.length === 0) {
    throw ApiError.badRequest("This department has no active employees to schedule");
  }

  const dutySchedules = await prisma.dutySchedule.findMany({
    where: { status: "Active" },
    orderBy: { id: "asc" },
  });
  if (dutySchedules.length === 0) {
    throw ApiError.badRequest("Create at least one active duty schedule before generating a roster");
  }

  const weekDays = await prisma.weekDay.findMany();
  const weekendNames = new Set(weekDays.filter((w) => w.isWeekend).map((w) => w.name));

  const isWeekendDate = (date: Date): boolean => {
    const name = JS_WEEKDAY_NAMES[date.getUTCDay()];
    if (weekDays.length > 0) {
      return weekendNames.has(name);
    }
    return date.getUTCDay() === 0 || date.getUTCDay() === 6;
  };

  const dates = enumerateDates(roster.startDate, roster.endDate);

  const assignmentsCreated = await prisma.$transaction(async (tx) => {
    if (existingCount > 0) {
      await tx.dutyScheduleAssignment.deleteMany({ where: { rosterId: id } });
    }

    let created = 0;
    for (let e = 0; e < employees.length; e += 1) {
      const employee = employees[e];
      for (let d = 0; d < dates.length; d += 1) {
        const date = dates[d];
        const weekend = isWeekendDate(date);
        try {
          await tx.dutyScheduleAssignment.create({
            data: {
              rosterId: id,
              employeeId: employee.id,
              dutyScheduleId: weekend ? null : dutySchedules[(e + d) % dutySchedules.length].id,
              departmentId: roster.departmentId,
              date,
              status: "Scheduled",
              isWeekend: weekend,
              createdById: generatedById,
            },
          });
          created += 1;
        } catch (err) {
          if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            throw ApiError.conflict(
              `Employee ${employee.firstName} ${employee.lastName} already has an assignment on ${
                date.toISOString().split("T")[0]
              } from another roster`
            );
          }
          throw err;
        }
      }
    }
    return created;
  });

  await prisma.roster.update({ where: { id }, data: { generatedById } });

  const updated = await prisma.roster.findUniqueOrThrow({ where: { id }, include: rosterInclude });

  return { roster: toRosterDto(updated), assignmentsCreated };
}

export interface MyScheduleOptions {
  startDate?: string;
  endDate?: string;
}

export async function getMyScheduleForEmployee(
  prisma: PrismaClient,
  employeeId: number,
  options: MyScheduleOptions
): Promise<DutyScheduleAssignmentDto[]> {
  const where: Prisma.DutyScheduleAssignmentWhereInput = {
    employeeId,
    roster: { status: "Approved" },
    ...(options.startDate || options.endDate
      ? {
          date: {
            ...(options.startDate ? { gte: new Date(options.startDate) } : {}),
            ...(options.endDate ? { lte: new Date(options.endDate) } : {}),
          },
        }
      : {}),
  };

  const assignments = await prisma.dutyScheduleAssignment.findMany({
    where,
    include: { employee: true, dutySchedule: true },
    orderBy: { date: "asc" },
  });

  return assignments.map(toAssignmentDto);
}
