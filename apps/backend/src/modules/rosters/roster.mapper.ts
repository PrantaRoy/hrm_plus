import { Prisma } from "../../../generated/tenant";
import { RosterDto } from "@hrm-plus/shared";

const rosterWithRelations = Prisma.validator<Prisma.RosterDefaultArgs>()({
  include: {
    department: true,
    generatedBy: { include: { employee: true } },
    approvedBy: { include: { employee: true } },
    createdBy: { include: { employee: true } },
    updatedBy: { include: { employee: true } },
  },
});

export type RosterWithRelations = Prisma.RosterGetPayload<typeof rosterWithRelations>;

export const rosterInclude = rosterWithRelations.include;

function userDisplayName(
  user: { email: string; employee: { firstName: string; lastName: string } | null } | null
): string | null {
  if (!user) return null;
  return user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user.email;
}

export function toRosterDto(roster: RosterWithRelations): RosterDto {
  return {
    id: roster.id,
    departmentId: roster.departmentId,
    departmentName: roster.department?.name ?? null,
    periodType: roster.periodType as RosterDto["periodType"],
    startDate: roster.startDate.toISOString(),
    endDate: roster.endDate.toISOString(),
    status: roster.status as RosterDto["status"],
    generatedById: roster.generatedById,
    generatedByName: userDisplayName(roster.generatedBy),
    approvedById: roster.approvedById,
    approvedByName: userDisplayName(roster.approvedBy),
    approvedAt: roster.approvedAt ? roster.approvedAt.toISOString() : null,
    createdById: roster.createdById,
    createdByName: userDisplayName(roster.createdBy),
    updatedById: roster.updatedById,
    updatedByName: userDisplayName(roster.updatedBy),
    createdAt: roster.createdAt.toISOString(),
    updatedAt: roster.updatedAt.toISOString(),
  };
}
