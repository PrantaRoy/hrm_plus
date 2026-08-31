import { Prisma } from "../../../generated/tenant";
import { DutyScheduleAssignmentDto } from "@hrm-plus/shared";

const assignmentWithRelations = Prisma.validator<Prisma.DutyScheduleAssignmentDefaultArgs>()({
  include: {
    employee: true,
    dutySchedule: true,
  },
});

export type AssignmentWithRelations = Prisma.DutyScheduleAssignmentGetPayload<
  typeof assignmentWithRelations
>;

export const assignmentInclude = assignmentWithRelations.include;

export function toAssignmentDto(assignment: AssignmentWithRelations): DutyScheduleAssignmentDto {
  return {
    id: assignment.id,
    rosterId: assignment.rosterId,
    employeeId: assignment.employeeId,
    employeeName: assignment.employee ? `${assignment.employee.firstName} ${assignment.employee.lastName}` : null,
    employeeCode: assignment.employee?.employeeCode ?? null,
    dutyScheduleId: assignment.dutyScheduleId,
    dutyScheduleName: assignment.dutySchedule?.name ?? null,
    dutyScheduleStartTime: assignment.dutySchedule?.startTime ?? null,
    dutyScheduleEndTime: assignment.dutySchedule?.endTime ?? null,
    departmentId: assignment.departmentId,
    date: assignment.date.toISOString(),
    status: assignment.status as DutyScheduleAssignmentDto["status"],
    comment: assignment.comment,
    isLeave: assignment.isLeave,
    isHoliday: assignment.isHoliday,
    isWeekend: assignment.isWeekend,
    changeRequest: assignment.changeRequest,
    createdById: assignment.createdById,
    updatedById: assignment.updatedById,
    createdAt: assignment.createdAt.toISOString(),
    updatedAt: assignment.updatedAt.toISOString(),
  };
}
