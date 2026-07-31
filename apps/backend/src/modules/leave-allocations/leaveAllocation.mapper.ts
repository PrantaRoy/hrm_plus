import { Prisma } from "../../../generated/tenant";
import { EmployeeLeaveAllocationDto } from "@hrm-plus/shared";

const allocationWithRelations = Prisma.validator<Prisma.EmployeeLeaveAllocationDefaultArgs>()({
  include: {
    leaveType: true,
    approvalSteps: {
      include: { role: true },
      orderBy: { stepOrder: "asc" },
    },
  },
});

export type AllocationWithRelations = Prisma.EmployeeLeaveAllocationGetPayload<
  typeof allocationWithRelations
>;

export const allocationInclude = allocationWithRelations.include;

export function toLeaveAllocationDto(allocation: AllocationWithRelations): EmployeeLeaveAllocationDto {
  return {
    id: allocation.id,
    employeeId: allocation.employeeId,
    leaveTypeId: allocation.leaveTypeId,
    leaveTypeName: allocation.leaveType.name,
    year: allocation.year,
    allocatedDays: allocation.allocatedDays,
    daysUsed: allocation.daysUsed,
    remainingDays: allocation.allocatedDays - allocation.daysUsed,
    status: allocation.status as EmployeeLeaveAllocationDto["status"],
    approvalSteps: allocation.approvalSteps.map((step) => ({
      id: step.id,
      stepOrder: step.stepOrder,
      approverType: step.approverType as EmployeeLeaveAllocationDto["approvalSteps"][number]["approverType"],
      roleId: step.roleId,
      roleName: step.role?.name ?? null,
    })),
    createdAt: allocation.createdAt.toISOString(),
    updatedAt: allocation.updatedAt.toISOString(),
  };
}
