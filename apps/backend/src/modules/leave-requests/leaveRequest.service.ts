import { PrismaClient, Prisma } from "../../../generated/tenant";
import {
  CreateLeaveRequestInput,
  EmployeeLeaveAllocationDto,
  LeaveRequestDto,
  PaginatedResult,
} from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { requestInclude, toLeaveRequestDto } from "./leaveRequest.mapper";
import { listAllocationsForEmployee } from "../leave-allocations/leaveAllocation.service";

export interface ActingUser {
  id: number;
  role: string;
}

interface ApprovalStepLike {
  approverType: string;
  roleName: string | null;
}

const JS_WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

async function countLeaveDays(prisma: PrismaClient, startDate: Date, endDate: Date): Promise<number> {
  const weekDays = await prisma.weekDay.findMany();
  const weekendNames = new Set(weekDays.filter((w) => w.isWeekend).map((w) => w.name));

  const isWeekendDate = (date: Date): boolean => {
    const name = JS_WEEKDAY_NAMES[date.getUTCDay()];
    if (weekDays.length > 0) {
      return weekendNames.has(name);
    }
    return date.getUTCDay() === 0 || date.getUTCDay() === 6;
  };

  let count = 0;
  const cursor = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
  const end = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));
  while (cursor <= end) {
    if (!isWeekendDate(cursor)) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

function isEligibleForStep(
  actingUserRole: string,
  actingEmployeeId: number | null,
  applicantReportingToId: number | null,
  step: ApprovalStepLike
): boolean {
  if (actingUserRole === "Admin") return true;
  if (step.approverType === "ReportingManager") {
    return actingEmployeeId != null && applicantReportingToId === actingEmployeeId;
  }
  if (step.approverType === "Role") {
    return actingUserRole === step.roleName;
  }
  return false;
}

async function resolveActingEmployee(prisma: PrismaClient, userId: number) {
  return prisma.employee.findUnique({ where: { userId } });
}

export async function resolveEmployeeForUser(prisma: PrismaClient, userId: number) {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) {
    throw ApiError.notFound("No employee profile linked to this account");
  }
  return employee;
}

export async function listActiveAllocationsForEmployee(
  prisma: PrismaClient,
  employeeId: number
): Promise<EmployeeLeaveAllocationDto[]> {
  const allocations = await listAllocationsForEmployee(prisma, employeeId);
  return allocations.filter((a) => a.status === "Active");
}

export interface ListMyLeaveRequestsOptions {
  status?: string;
}

export async function listMyLeaveRequests(
  prisma: PrismaClient,
  employeeId: number,
  options: ListMyLeaveRequestsOptions
): Promise<LeaveRequestDto[]> {
  const requests = await prisma.leaveRequest.findMany({
    where: { employeeId, ...(options.status ? { status: options.status } : {}) },
    include: requestInclude,
    orderBy: { createdAt: "desc" },
  });
  return requests.map(toLeaveRequestDto);
}

export async function listPendingMyApproval(prisma: PrismaClient, actingUser: ActingUser): Promise<LeaveRequestDto[]> {
  const actingEmployee = await resolveActingEmployee(prisma, actingUser.id);
  const pending = await prisma.leaveRequest.findMany({
    where: { status: "Pending" },
    include: requestInclude,
    orderBy: { createdAt: "asc" },
  });

  const eligible = pending.filter((request) => {
    const currentApproval = request.approvals.find((a) => a.stepOrder === request.currentStepOrder);
    if (!currentApproval || currentApproval.status !== "Pending") return false;
    return isEligibleForStep(actingUser.role, actingEmployee?.id ?? null, request.employee.reportingToId, currentApproval);
  });

  return eligible.map(toLeaveRequestDto);
}

export interface ListLeaveRequestsOptions {
  page: number;
  pageSize: number;
  status?: string;
  employeeId?: number;
}

export async function listLeaveRequests(
  prisma: PrismaClient,
  options: ListLeaveRequestsOptions
): Promise<PaginatedResult<LeaveRequestDto>> {
  const where: Prisma.LeaveRequestWhereInput = {
    ...(options.status ? { status: options.status } : {}),
    ...(options.employeeId ? { employeeId: options.employeeId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      include: requestInclude,
      orderBy: { createdAt: "desc" },
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    }),
    prisma.leaveRequest.count({ where }),
  ]);

  return {
    items: items.map(toLeaveRequestDto),
    total,
    page: options.page,
    pageSize: options.pageSize,
  };
}

export async function getLeaveRequestById(
  prisma: PrismaClient,
  id: number,
  actingUser: ActingUser
): Promise<LeaveRequestDto> {
  const request = await prisma.leaveRequest.findUnique({ where: { id }, include: requestInclude });
  if (!request) {
    throw ApiError.notFound("Leave request not found");
  }

  if (actingUser.role === "Admin" || actingUser.role === "HR") {
    return toLeaveRequestDto(request);
  }

  const actingEmployee = await resolveActingEmployee(prisma, actingUser.id);
  if (actingEmployee && request.employeeId === actingEmployee.id) {
    return toLeaveRequestDto(request);
  }

  const isApprover = request.approvals.some((approval) =>
    isEligibleForStep(actingUser.role, actingEmployee?.id ?? null, request.employee.reportingToId, approval)
  );
  if (!isApprover) {
    throw ApiError.forbidden("Not authorized to view this leave request");
  }

  return toLeaveRequestDto(request);
}

export async function createLeaveRequest(
  prisma: PrismaClient,
  employeeId: number,
  input: CreateLeaveRequestInput,
  createdById: number
): Promise<LeaveRequestDto> {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    throw ApiError.notFound("Employee not found");
  }

  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw ApiError.badRequest("Invalid startDate/endDate");
  }
  if (endDate < startDate) {
    throw ApiError.badRequest("endDate must be on or after startDate");
  }

  const year = startDate.getUTCFullYear();
  const allocation = await prisma.employeeLeaveAllocation.findUnique({
    where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId: input.leaveTypeId, year } },
    include: { approvalSteps: { include: { role: true }, orderBy: { stepOrder: "asc" } } },
  });
  if (!allocation || allocation.status !== "Active") {
    throw ApiError.badRequest("No active leave allocation configured for this leave type/year");
  }
  if (allocation.approvalSteps.length === 0) {
    throw ApiError.conflict("This allocation has no approval chain configured");
  }

  for (const step of allocation.approvalSteps) {
    if (step.approverType === "ReportingManager" && !employee.reportingToId) {
      throw ApiError.badRequest("Employee has no reporting manager configured; cannot use this leave chain");
    }
  }

  const daysRequested = await countLeaveDays(prisma, startDate, endDate);
  if (daysRequested === 0) {
    throw ApiError.badRequest("Selected date range contains no working days");
  }
  if (daysRequested > allocation.allocatedDays - allocation.daysUsed) {
    throw ApiError.badRequest("Insufficient remaining leave balance");
  }

  const request = await prisma.$transaction(async (tx) => {
    const created = await tx.leaveRequest.create({
      data: {
        employeeId,
        allocationId: allocation.id,
        startDate,
        endDate,
        daysRequested,
        reason: input.reason ?? null,
        createdById,
      },
    });

    await tx.leaveRequestApproval.createMany({
      data: allocation.approvalSteps.map((step) => ({
        leaveRequestId: created.id,
        stepOrder: step.stepOrder,
        approverType: step.approverType,
        roleId: step.roleId,
        roleName: step.role?.name ?? null,
      })),
    });

    return tx.leaveRequest.findUniqueOrThrow({ where: { id: created.id }, include: requestInclude });
  });

  return toLeaveRequestDto(request);
}

export type LeaveRequestDecision = "Approve" | "Reject";

export async function decideLeaveRequest(
  prisma: PrismaClient,
  requestId: number,
  decision: LeaveRequestDecision,
  actingUser: ActingUser,
  comment: string | undefined
): Promise<LeaveRequestDto> {
  const request = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    include: { approvals: { orderBy: { stepOrder: "asc" } }, employee: true },
  });
  if (!request) {
    throw ApiError.notFound("Leave request not found");
  }
  if (request.status !== "Pending") {
    throw ApiError.conflict("This request is no longer pending");
  }

  const currentApproval = request.approvals.find((a) => a.stepOrder === request.currentStepOrder);
  if (!currentApproval) {
    throw ApiError.conflict("Leave request has no pending approval step");
  }
  if (currentApproval.status !== "Pending") {
    throw ApiError.conflict("This step was already decided");
  }

  const actingEmployee = await resolveActingEmployee(prisma, actingUser.id);
  const eligible = isEligibleForStep(
    actingUser.role,
    actingEmployee?.id ?? null,
    request.employee.reportingToId,
    currentApproval
  );
  if (!eligible) {
    throw ApiError.forbidden("You are not an approver for the current step");
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.leaveRequestApproval.update({
      where: { id: currentApproval.id },
      data: {
        status: decision === "Approve" ? "Approved" : "Rejected",
        decidedByUserId: actingUser.id,
        decidedAt: new Date(),
        comment: comment ?? null,
      },
    });

    if (decision === "Reject") {
      await tx.leaveRequest.update({ where: { id: requestId }, data: { status: "Rejected" } });
    } else {
      const nextStep = request.approvals.find((a) => a.stepOrder === currentApproval.stepOrder + 1);
      if (nextStep) {
        await tx.leaveRequest.update({ where: { id: requestId }, data: { currentStepOrder: nextStep.stepOrder } });
      } else {
        const allocation = await tx.employeeLeaveAllocation.findUniqueOrThrow({
          where: { id: request.allocationId },
        });
        if (request.daysRequested > allocation.allocatedDays - allocation.daysUsed) {
          throw ApiError.conflict("Insufficient remaining balance to finalize this request");
        }
        await tx.leaveRequest.update({ where: { id: requestId }, data: { status: "Approved" } });
        await tx.employeeLeaveAllocation.update({
          where: { id: request.allocationId },
          data: { daysUsed: { increment: request.daysRequested } },
        });
      }
    }

    return tx.leaveRequest.findUniqueOrThrow({ where: { id: requestId }, include: requestInclude });
  });

  return toLeaveRequestDto(updated);
}

export async function cancelLeaveRequest(
  prisma: PrismaClient,
  requestId: number,
  actingUser: ActingUser
): Promise<LeaveRequestDto> {
  const request = await prisma.leaveRequest.findUnique({ where: { id: requestId }, include: { employee: true } });
  if (!request) {
    throw ApiError.notFound("Leave request not found");
  }
  if (request.status !== "Pending") {
    throw ApiError.conflict("Only pending requests can be cancelled");
  }

  const isOwner = request.employee.userId === actingUser.id;
  const isAdminOrHr = actingUser.role === "Admin" || actingUser.role === "HR";
  if (!isOwner && !isAdminOrHr) {
    throw ApiError.forbidden("Not authorized to cancel this request");
  }

  const updated = await prisma.leaveRequest.update({
    where: { id: requestId },
    data: { status: "Cancelled" },
    include: requestInclude,
  });
  return toLeaveRequestDto(updated);
}
