import { Prisma } from "../../../generated/tenant";
import { HolidayDto } from "@hrm-plus/shared";

const holidayWithRelations = Prisma.validator<Prisma.HolidayDefaultArgs>()({
  include: {
    createdBy: { include: { employee: true } },
    publishedBy: { include: { employee: true } },
  },
});

export type HolidayWithRelations = Prisma.HolidayGetPayload<typeof holidayWithRelations>;

export const holidayInclude = holidayWithRelations.include;

function userDisplayName(
  user: { email: string; employee: { firstName: string; lastName: string } | null } | null
): string | null {
  if (!user) return null;
  return user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user.email;
}

export function toHolidayDto(holiday: HolidayWithRelations): HolidayDto {
  return {
    id: holiday.id,
    name: holiday.name,
    date: holiday.date.toISOString(),
    year: holiday.year,
    source: holiday.source as HolidayDto["source"],
    status: holiday.status as HolidayDto["status"],
    notes: holiday.notes,
    createdById: holiday.createdById,
    createdByName: userDisplayName(holiday.createdBy),
    publishedById: holiday.publishedById,
    publishedByName: userDisplayName(holiday.publishedBy),
    publishedAt: holiday.publishedAt ? holiday.publishedAt.toISOString() : null,
    createdAt: holiday.createdAt.toISOString(),
    updatedAt: holiday.updatedAt.toISOString(),
  };
}
