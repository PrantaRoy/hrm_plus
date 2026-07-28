import { PrismaClient } from "../../../generated/tenant";
import { CreateShiftInput, ShiftDto, UpdateShiftInput } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";

function toShiftDto(shift: {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  status: string;
}): ShiftDto {
  return {
    id: shift.id,
    name: shift.name,
    startTime: shift.startTime,
    endTime: shift.endTime,
    status: shift.status as ShiftDto["status"],
  };
}

export async function listShifts(prisma: PrismaClient): Promise<ShiftDto[]> {
  const shifts = await prisma.shift.findMany({ orderBy: { name: "asc" } });
  return shifts.map(toShiftDto);
}

export async function getShiftById(prisma: PrismaClient, id: number): Promise<ShiftDto> {
  const shift = await prisma.shift.findUnique({ where: { id } });
  if (!shift) {
    throw ApiError.notFound("Shift not found");
  }
  return toShiftDto(shift);
}

export async function createShift(prisma: PrismaClient, input: CreateShiftInput): Promise<ShiftDto> {
  const shift = await prisma.shift.create({
    data: {
      name: input.name,
      startTime: input.startTime,
      endTime: input.endTime,
      status: input.status ?? "Active",
    },
  });
  return toShiftDto(shift);
}

export async function updateShift(
  prisma: PrismaClient,
  id: number,
  input: UpdateShiftInput
): Promise<ShiftDto> {
  const existing = await prisma.shift.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Shift not found");
  }

  const shift = await prisma.shift.update({
    where: { id },
    data: {
      name: input.name,
      startTime: input.startTime,
      endTime: input.endTime,
      status: input.status,
    },
  });
  return toShiftDto(shift);
}

export async function deleteShift(prisma: PrismaClient, id: number): Promise<void> {
  const existing = await prisma.shift.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Shift not found");
  }
  await prisma.shift.delete({ where: { id } });
}
