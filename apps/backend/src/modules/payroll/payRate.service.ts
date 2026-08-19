import { PrismaClient, EmployeePayRate } from "../../../generated/tenant";
import { CreateEmployeePayRateInput, EmployeePayRateDto } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";

function toEmployeePayRateDto(rate: EmployeePayRate, employeeName: string): EmployeePayRateDto {
  return {
    id: rate.id,
    employeeId: rate.employeeId,
    employeeName,
    rateType: rate.rateType as EmployeePayRateDto["rateType"],
    baseRate: Number(rate.baseRate),
    effectiveFrom: rate.effectiveFrom.toISOString(),
    effectiveTo: rate.effectiveTo ? rate.effectiveTo.toISOString() : null,
    createdAt: rate.createdAt.toISOString(),
    updatedAt: rate.updatedAt.toISOString(),
  };
}

// Stage 1: Effective-Dated Rate Resolver. Finds the rate in force on targetDate —
// effectiveFrom <= targetDate AND (effectiveTo IS NULL OR effectiveTo >= targetDate).
// If more than one row matches (an overlapping edit), the most recently-started one
// wins. Throws a descriptive error if no rate covers the date at all, since every
// downstream payroll calculation depends on this resolving unambiguously.
export async function resolveEffectivePayRate(
  prisma: PrismaClient,
  employeeId: number,
  targetDate: Date
): Promise<EmployeePayRate> {
  const rate = await prisma.employeePayRate.findFirst({
    where: {
      employeeId,
      effectiveFrom: { lte: targetDate },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: targetDate } }],
    },
    orderBy: { effectiveFrom: "desc" },
  });

  if (!rate) {
    throw ApiError.badRequest(
      `No active pay rate for employee ${employeeId} covering ${targetDate.toISOString().slice(0, 10)}`
    );
  }
  return rate;
}

export async function listPayRatesForEmployee(prisma: PrismaClient, employeeId: number): Promise<EmployeePayRateDto[]> {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) throw ApiError.notFound("Employee not found");

  const rates = await prisma.employeePayRate.findMany({
    where: { employeeId },
    orderBy: { effectiveFrom: "desc" },
  });
  const employeeName = `${employee.firstName} ${employee.lastName}`;
  return rates.map((rate) => toEmployeePayRateDto(rate, employeeName));
}

export async function createPayRate(
  prisma: PrismaClient,
  input: CreateEmployeePayRateInput,
  createdById: number
): Promise<EmployeePayRateDto> {
  const employee = await prisma.employee.findUnique({ where: { id: input.employeeId } });
  if (!employee) throw ApiError.notFound("Employee not found");

  const effectiveFrom = new Date(input.effectiveFrom);
  const effectiveTo = input.effectiveTo ? new Date(input.effectiveTo) : null;
  if (Number.isNaN(effectiveFrom.getTime())) throw ApiError.badRequest("Invalid effectiveFrom date");
  if (effectiveTo && effectiveTo < effectiveFrom) {
    throw ApiError.badRequest("effectiveTo must be on or after effectiveFrom");
  }

  const rate = await prisma.employeePayRate.create({
    data: {
      employeeId: input.employeeId,
      rateType: input.rateType,
      baseRate: input.baseRate,
      effectiveFrom,
      effectiveTo,
      createdById,
    },
  });

  return toEmployeePayRateDto(rate, `${employee.firstName} ${employee.lastName}`);
}
