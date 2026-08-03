import { PrismaClient, Prisma } from "../../../generated/tenant";
import { CreateAssignmentInput, DutyScheduleAssignmentDto, UpdateAssignmentInput } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { assignmentInclude, toAssignmentDto } from "./assignment.mapper";
import { getPublishedHolidayForDate } from "../holidays/holiday.service";

export interface ListAssignmentsOptions {
  startDate?: string;
  endDate?: string;
  employeeId?: number;
}

async function getRosterOrThrow(prisma: PrismaClient, rosterId: number) {
  const roster = await prisma.roster.findUnique({ where: { id: rosterId } });
  if (!roster) {
    throw ApiError.notFound("Roster not found");
  }
  return roster;
}

async function assertEmployeeInDepartment(prisma: PrismaClient, employeeId: number, departmentId: number) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    throw ApiError.badRequest("Unknown employeeId");
  }
  if (employee.departmentId !== departmentId) {
    throw ApiError.badRequest("Employee does not belong to this roster's department");
  }
}

export async function listAssignments(
  prisma: PrismaClient,
  rosterId: number,
  options: ListAssignmentsOptions
): Promise<DutyScheduleAssignmentDto[]> {
  await getRosterOrThrow(prisma, rosterId);

  const where: Prisma.DutyScheduleAssignmentWhereInput = {
    rosterId,
    ...(options.employeeId ? { employeeId: options.employeeId } : {}),
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
    include: assignmentInclude,
    orderBy: [{ date: "asc" }, { employeeId: "asc" }],
  });

  return assignments.map(toAssignmentDto);
}

export async function createAssignment(
  prisma: PrismaClient,
  rosterId: number,
  input: CreateAssignmentInput,
  createdById: number
): Promise<DutyScheduleAssignmentDto> {
  const roster = await getRosterOrThrow(prisma, rosterId);
  if (roster.status === "Approved") {
    throw ApiError.conflict("Cannot modify assignments on an approved roster");
  }

  await assertEmployeeInDepartment(prisma, input.employeeId, roster.departmentId);

  const date = new Date(input.date);
  if (date < roster.startDate || date > roster.endDate) {
    throw ApiError.badRequest("date must fall within the roster's date range");
  }

  const dutyScheduleId = input.dutyScheduleId ?? null;
  const holiday = await getPublishedHolidayForDate(prisma, date);

  try {
    const assignment = await prisma.dutyScheduleAssignment.create({
      data: {
        rosterId,
        employeeId: input.employeeId,
        dutyScheduleId,
        departmentId: roster.departmentId,
        date,
        comment: input.comment ?? null,
        isLeave: input.isLeave ?? false,
        isHoliday: Boolean(holiday) && dutyScheduleId === null,
        createdById,
      },
      include: assignmentInclude,
    });
    return toAssignmentDto(assignment);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw ApiError.conflict("This employee already has an assignment on this date");
    }
    throw err;
  }
}

export async function updateAssignment(
  prisma: PrismaClient,
  rosterId: number,
  assignmentId: number,
  input: UpdateAssignmentInput,
  updatedById: number
): Promise<DutyScheduleAssignmentDto> {
  const roster = await getRosterOrThrow(prisma, rosterId);
  if (roster.status === "Approved") {
    throw ApiError.conflict("Cannot modify assignments on an approved roster");
  }

  const existing = await prisma.dutyScheduleAssignment.findUnique({ where: { id: assignmentId } });
  if (!existing || existing.rosterId !== rosterId) {
    throw ApiError.notFound("Assignment not found");
  }

  if (input.employeeId !== undefined) {
    await assertEmployeeInDepartment(prisma, input.employeeId, roster.departmentId);
  }

  let resolvedDate = existing.date;
  if (input.date !== undefined) {
    resolvedDate = new Date(input.date);
    if (resolvedDate < roster.startDate || resolvedDate > roster.endDate) {
      throw ApiError.badRequest("date must fall within the roster's date range");
    }
  }

  const resolvedDutyScheduleId = input.dutyScheduleId !== undefined ? input.dutyScheduleId : existing.dutyScheduleId;
  const holiday = await getPublishedHolidayForDate(prisma, resolvedDate);

  try {
    const assignment = await prisma.dutyScheduleAssignment.update({
      where: { id: assignmentId },
      data: {
        employeeId: input.employeeId,
        dutyScheduleId: input.dutyScheduleId,
        date: input.date ? resolvedDate : undefined,
        status: input.status,
        comment: input.comment,
        isLeave: input.isLeave,
        isHoliday: Boolean(holiday) && resolvedDutyScheduleId === null,
        changeRequest: input.changeRequest,
        updatedById,
      },
      include: assignmentInclude,
    });
    return toAssignmentDto(assignment);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw ApiError.conflict("This employee already has an assignment on this date");
    }
    throw err;
  }
}

export async function deleteAssignment(
  prisma: PrismaClient,
  rosterId: number,
  assignmentId: number
): Promise<void> {
  const roster = await getRosterOrThrow(prisma, rosterId);
  if (roster.status === "Approved") {
    throw ApiError.conflict("Cannot modify assignments on an approved roster");
  }

  const existing = await prisma.dutyScheduleAssignment.findUnique({ where: { id: assignmentId } });
  if (!existing || existing.rosterId !== rosterId) {
    throw ApiError.notFound("Assignment not found");
  }

  await prisma.dutyScheduleAssignment.delete({ where: { id: assignmentId } });
}
