import { PrismaClient } from "../../../generated/tenant";
import { CreatePayCycleInput, PayCycleDto, UpdatePayCycleInput } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { payCycleInclude, toPayCycleDto } from "./payCycle.mapper";

export async function listPayCycles(prisma: PrismaClient): Promise<PayCycleDto[]> {
  const payCycles = await prisma.payCycle.findMany({ include: payCycleInclude, orderBy: { createdAt: "desc" } });
  return payCycles.map(toPayCycleDto);
}

export async function getPayCycleById(prisma: PrismaClient, id: number): Promise<PayCycleDto> {
  const payCycle = await prisma.payCycle.findUnique({ where: { id }, include: payCycleInclude });
  if (!payCycle) throw ApiError.notFound("Pay cycle not found");
  return toPayCycleDto(payCycle);
}

export async function createPayCycle(
  prisma: PrismaClient,
  input: CreatePayCycleInput,
  createdById: number
): Promise<PayCycleDto> {
  const payCycle = await prisma.payCycle.create({
    data: { name: input.name, frequency: input.frequency, createdById },
    include: payCycleInclude,
  });
  return toPayCycleDto(payCycle);
}

export async function updatePayCycle(
  prisma: PrismaClient,
  id: number,
  input: UpdatePayCycleInput,
  updatedById: number
): Promise<PayCycleDto> {
  const existing = await prisma.payCycle.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Pay cycle not found");

  const payCycle = await prisma.payCycle.update({
    where: { id },
    data: { ...input, updatedById },
    include: payCycleInclude,
  });
  return toPayCycleDto(payCycle);
}

export async function assignEmployeesToPayCycle(
  prisma: PrismaClient,
  id: number,
  employeeIds: number[]
): Promise<PayCycleDto> {
  const existing = await prisma.payCycle.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Pay cycle not found");

  await prisma.employee.updateMany({ where: { id: { in: employeeIds } }, data: { payCycleId: id } });
  return getPayCycleById(prisma, id);
}
