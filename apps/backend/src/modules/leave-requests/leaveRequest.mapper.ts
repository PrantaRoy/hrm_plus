import { Prisma } from "../../../generated/tenant";
import { LeaveRequestDto } from "@hrm-plus/shared";

const requestWithRelations = Prisma.validator<Prisma.LeaveRequestDefaultArgs>()({
  include: {
    employee: true,
    allocation: { include: { leaveType: true } },
    approvals: {
      include: { decidedBy: { include: { employee: true } } },
      orderBy: { stepOrder: "asc" },
    },
  },
});

export type LeaveRequestWithRelations = Prisma.LeaveRequestGetPayload<typeof requestWithRelations>;

export const requestInclude = requestWithRelations.include;

function userDisplayName(
  user: { email: string; employee: { firstName: string; lastName: string } | null } | null
): string | null {
  if (!user) return null;
  return user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user.email;
}

export function toLeaveRequestDto(request: LeaveRequestWithRelations): LeaveRequestDto {
  return {
    id: request.id,
    employeeId: request.employeeId,
    employeeName: `${request.employee.firstName} ${request.employee.lastName}`,
    allocationId: request.allocationId,
    leaveTypeId: request.allocation.leaveTypeId,
    leaveTypeName: request.allocation.leaveType.name,
    startDate: request.startDate.toISOString(),
    endDate: request.endDate.toISOString(),
    daysRequested: request.daysRequested,
    reason: request.reason,
    status: request.status as LeaveRequestDto["status"],
    currentStepOrder: request.currentStepOrder,
    approvals: request.approvals.map((approval) => ({
      id: approval.id,
      stepOrder: approval.stepOrder,
      approverType: approval.approverType as LeaveRequestDto["approvals"][number]["approverType"],
      roleId: approval.roleId,
      roleName: approval.roleName,
      status: approval.status as LeaveRequestDto["approvals"][number]["status"],
      decidedByUserId: approval.decidedByUserId,
      decidedByName: userDisplayName(approval.decidedBy),
      decidedAt: approval.decidedAt ? approval.decidedAt.toISOString() : null,
      comment: approval.comment,
    })),
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
  };
}
