import { Prisma } from "../../../generated/tenant";
import { PayCycleDto } from "@hrm-plus/shared";

const payCycleWithCount = Prisma.validator<Prisma.PayCycleDefaultArgs>()({
  include: { _count: { select: { employees: true } } },
});
export type PayCycleWithCount = Prisma.PayCycleGetPayload<typeof payCycleWithCount>;
export const payCycleInclude = payCycleWithCount.include;

export function toPayCycleDto(payCycle: PayCycleWithCount): PayCycleDto {
  return {
    id: payCycle.id,
    name: payCycle.name,
    frequency: payCycle.frequency as PayCycleDto["frequency"],
    status: payCycle.status as PayCycleDto["status"],
    employeeCount: payCycle._count.employees,
    createdAt: payCycle.createdAt.toISOString(),
    updatedAt: payCycle.updatedAt.toISOString(),
  };
}
