import { PrismaClient, Prisma } from "../../../generated/tenant";
import { ApprovalStepInput, CreateLeaveAllocationInput, EmployeeLeaveAllocationDto, UpdateLeaveAllocationInput } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { allocationInclude, toLeaveAllocationDto } from "./leaveAllocation.mapper";

async function assertEmployeeExists(prisma: PrismaClient, employeeId: number) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    throw ApiError.notFound("Employee not found");
  }
  return employee;
}

async function assertLeaveTypeActive(prisma: PrismaClient, leaveTypeId: number) {
  const leaveType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
  if (!leaveType) {
    throw ApiError.badRequest("Unknown leaveTypeId");
  }
  if (leaveType.status !== "Active") {
    throw ApiError.badRequest("Cannot allocate an inactive leave type");
  }
}

async function assertApprovalStepsValid(prisma: PrismaClient, steps: ApprovalStepInput[]) {
  const roleIds = steps.filter((s) => s.approverType === "Role").map((s) => s.roleId!);
  if (roleIds.length === 0) return;
  const roles = await prisma.role.findMany({ where: { id: { in: roleIds } } });
  if (roles.length !== new Set(roleIds).size) {
    throw ApiError.badRequest("One or more approval step roleIds are unknown");
  }
}

async function getAllocationOrThrow(prisma: PrismaClient, employeeId: number, allocationId: number) {
  const allocation = await prisma.employeeLeaveAllocation.findUnique({ where: { id: allocationId } });
  if (!allocation || allocation.employeeId !== employeeId) {
    throw ApiError.notFound("Leave allocation not found");
  }
  return allocation;
}

export async function listAllocationsForEmployee(
  prisma: PrismaClient,
  employeeId: number
): Promise<EmployeeLeaveAllocationDto[]> {
  await assertEmployeeExists(prisma, employeeId);
  const allocations = await prisma.employeeLeaveAllocation.findMany({
    where: { employeeId },
    include: allocationInclude,
    orderBy: [{ year: "desc" }, { id: "asc" }],
  });
  return allocations.map(toLeaveAllocationDto);
}

export async function getAllocationById(
  prisma: PrismaClient,
  employeeId: number,
  allocationId: number
): Promise<EmployeeLeaveAllocationDto> {
  await getAllocationOrThrow(prisma, employeeId, allocationId);
  const allocation = await prisma.employeeLeaveAllocation.findUniqueOrThrow({
    where: { id: allocationId },
    include: allocationInclude,
  });
  return toLeaveAllocationDto(allocation);
}

export async function createAllocation(
  prisma: PrismaClient,
  employeeId: number,
  input: CreateLeaveAllocationInput,
  createdById: number
): Promise<EmployeeLeaveAllocationDto> {
  await assertEmployeeExists(prisma, employeeId);
  await assertLeaveTypeActive(prisma, input.leaveTypeId);
  await assertApprovalStepsValid(prisma, input.approvalSteps);

  try {
    const allocation = await prisma.$transaction(async (tx) => {
      const created = await tx.employeeLeaveAllocation.create({
        data: {
          employeeId,
          leaveTypeId: input.leaveTypeId,
          year: input.year,
          allocatedDays: input.allocatedDays,
          createdById,
        },
      });
      await tx.leaveApprovalStep.createMany({
        data: input.approvalSteps.map((step, index) => ({
          allocationId: created.id,
          stepOrder: index + 1,
          approverType: step.approverType,
          roleId: step.approverType === "Role" ? step.roleId! : null,
        })),
      });
      return tx.employeeLeaveAllocation.findUniqueOrThrow({
        where: { id: created.id },
        include: allocationInclude,
      });
    });
    return toLeaveAllocationDto(allocation);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw ApiError.conflict("This employee already has an allocation for this leave type and year");
    }
    throw err;
  }
}

export async function updateAllocation(
  prisma: PrismaClient,
  employeeId: number,
  allocationId: number,
  input: UpdateLeaveAllocationInput,
  updatedById: number
): Promise<EmployeeLeaveAllocationDto> {
  await getAllocationOrThrow(prisma, employeeId, allocationId);

  if (input.approvalSteps !== undefined || input.allocatedDays !== undefined) {
    const pendingCount = await prisma.leaveRequest.count({
      where: { allocationId, status: "Pending" },
    });
    if (pendingCount > 0) {
      throw ApiError.conflict(
        "Cannot change allocated days or the approval chain while a leave request against this allocation is pending"
      );
    }
  }

  if (input.approvalSteps !== undefined) {
    await assertApprovalStepsValid(prisma, input.approvalSteps);
  }

  const allocation = await prisma.$transaction(async (tx) => {
    await tx.employeeLeaveAllocation.update({
      where: { id: allocationId },
      data: {
        allocatedDays: input.allocatedDays,
        status: input.status,
        updatedById,
      },
    });

    if (input.approvalSteps !== undefined) {
      await tx.leaveApprovalStep.deleteMany({ where: { allocationId } });
      await tx.leaveApprovalStep.createMany({
        data: input.approvalSteps.map((step, index) => ({
          allocationId,
          stepOrder: index + 1,
          approverType: step.approverType,
          roleId: step.approverType === "Role" ? step.roleId! : null,
        })),
      });
    }

    return tx.employeeLeaveAllocation.findUniqueOrThrow({
      where: { id: allocationId },
      include: allocationInclude,
    });
  });

  return toLeaveAllocationDto(allocation);
}

export async function deleteAllocation(prisma: PrismaClient, employeeId: number, allocationId: number): Promise<void> {
  await getAllocationOrThrow(prisma, employeeId, allocationId);

  const requestCount = await prisma.leaveRequest.count({
    where: { allocationId, status: { in: ["Pending", "Approved"] } },
  });
  if (requestCount > 0) {
    throw ApiError.conflict(
      "Cannot delete an allocation with pending or approved leave requests; set it to Inactive instead"
    );
  }

  await prisma.employeeLeaveAllocation.delete({ where: { id: allocationId } });
}
