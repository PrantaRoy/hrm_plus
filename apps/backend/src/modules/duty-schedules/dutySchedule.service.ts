import { PrismaClient, Prisma } from "../../../generated/tenant";
import { CreateDutyScheduleInput, DutyScheduleDto, PaginatedResult, UpdateDutyScheduleInput } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { toDutyScheduleDto } from "./dutySchedule.mapper";

export interface ListDutySchedulesOptions {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
}

export async function listDutySchedules(
  prisma: PrismaClient,
  options: ListDutySchedulesOptions
): Promise<PaginatedResult<DutyScheduleDto>> {
  const where: Prisma.DutyScheduleWhereInput = {
    ...(options.status ? { status: options.status } : {}),
    ...(options.search ? { name: { contains: options.search } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.dutySchedule.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    }),
    prisma.dutySchedule.count({ where }),
  ]);

  return {
    items: items.map(toDutyScheduleDto),
    total,
    page: options.page,
    pageSize: options.pageSize,
  };
}

export async function getDutyScheduleById(prisma: PrismaClient, id: number): Promise<DutyScheduleDto> {
  const dutySchedule = await prisma.dutySchedule.findUnique({ where: { id } });
  if (!dutySchedule) {
    throw ApiError.notFound("Duty schedule not found");
  }
  return toDutyScheduleDto(dutySchedule);
}

export async function createDutySchedule(
  prisma: PrismaClient,
  input: CreateDutyScheduleInput
): Promise<DutyScheduleDto> {
  const dutySchedule = await prisma.dutySchedule.create({
    data: {
      name: input.name,
      startTime: input.startTime,
      endTime: input.endTime,
      checkinConsiderMinutes: input.checkinConsiderMinutes ?? 0,
      checkoutConsiderMinutes: input.checkoutConsiderMinutes ?? 0,
      maxOverTimeMinutes: input.maxOverTimeMinutes ?? 0,
      earlyCheckinBufferMinutes: input.earlyCheckinBufferMinutes ?? 0,
      isTardyApplicable: input.isTardyApplicable ?? true,
      status: input.status ?? "Active",
      shortDescription: input.shortDescription ?? null,
    },
  });
  return toDutyScheduleDto(dutySchedule);
}

export async function updateDutySchedule(
  prisma: PrismaClient,
  id: number,
  input: UpdateDutyScheduleInput
): Promise<DutyScheduleDto> {
  const existing = await prisma.dutySchedule.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Duty schedule not found");
  }

  const dutySchedule = await prisma.dutySchedule.update({
    where: { id },
    data: {
      name: input.name,
      startTime: input.startTime,
      endTime: input.endTime,
      checkinConsiderMinutes: input.checkinConsiderMinutes,
      checkoutConsiderMinutes: input.checkoutConsiderMinutes,
      maxOverTimeMinutes: input.maxOverTimeMinutes,
      earlyCheckinBufferMinutes: input.earlyCheckinBufferMinutes,
      isTardyApplicable: input.isTardyApplicable,
      status: input.status,
      shortDescription: input.shortDescription,
    },
  });
  return toDutyScheduleDto(dutySchedule);
}

export async function deleteDutySchedule(prisma: PrismaClient, id: number): Promise<void> {
  const existing = await prisma.dutySchedule.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Duty schedule not found");
  }

  const assignmentCount = await prisma.dutyScheduleAssignment.count({ where: { dutyScheduleId: id } });
  if (assignmentCount > 0) {
    throw ApiError.conflict("Cannot delete a duty schedule that is used in existing roster assignments");
  }

  await prisma.dutySchedule.delete({ where: { id } });
}
