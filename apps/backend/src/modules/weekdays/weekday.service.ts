import { PrismaClient } from "../../../generated/tenant";
import { CreateWeekDayInput, UpdateWeekDayInput, WeekDayDto } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";

function toWeekDayDto(weekDay: { id: number; name: string; isWeekend: boolean }): WeekDayDto {
  return { id: weekDay.id, name: weekDay.name, isWeekend: weekDay.isWeekend };
}

export async function listWeekDays(prisma: PrismaClient): Promise<WeekDayDto[]> {
  const weekDays = await prisma.weekDay.findMany({ orderBy: { id: "asc" } });
  return weekDays.map(toWeekDayDto);
}

export async function getWeekDayById(prisma: PrismaClient, id: number): Promise<WeekDayDto> {
  const weekDay = await prisma.weekDay.findUnique({ where: { id } });
  if (!weekDay) {
    throw ApiError.notFound("Week day not found");
  }
  return toWeekDayDto(weekDay);
}

export async function createWeekDay(prisma: PrismaClient, input: CreateWeekDayInput): Promise<WeekDayDto> {
  const weekDay = await prisma.weekDay.create({
    data: { name: input.name, isWeekend: input.isWeekend ?? false },
  });
  return toWeekDayDto(weekDay);
}

export async function updateWeekDay(
  prisma: PrismaClient,
  id: number,
  input: UpdateWeekDayInput
): Promise<WeekDayDto> {
  const existing = await prisma.weekDay.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Week day not found");
  }

  const weekDay = await prisma.weekDay.update({
    where: { id },
    data: { name: input.name, isWeekend: input.isWeekend },
  });
  return toWeekDayDto(weekDay);
}

export async function deleteWeekDay(prisma: PrismaClient, id: number): Promise<void> {
  const existing = await prisma.weekDay.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Week day not found");
  }
  await prisma.weekDay.delete({ where: { id } });
}
