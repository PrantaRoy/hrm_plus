import { PrismaClient } from "../../../generated/tenant";
import { CreateLeaveTypeInput, LeaveTypeDto, UpdateLeaveTypeInput } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";

function toLeaveTypeDto(leaveType: {
  id: number;
  name: string;
  assignedDays: number;
  status: string;
}): LeaveTypeDto {
  return {
    id: leaveType.id,
    name: leaveType.name,
    assignedDays: leaveType.assignedDays,
    status: leaveType.status as LeaveTypeDto["status"],
  };
}

export async function listLeaveTypes(prisma: PrismaClient): Promise<LeaveTypeDto[]> {
  const leaveTypes = await prisma.leaveType.findMany({ orderBy: { name: "asc" } });
  return leaveTypes.map(toLeaveTypeDto);
}

export async function getLeaveTypeById(prisma: PrismaClient, id: number): Promise<LeaveTypeDto> {
  const leaveType = await prisma.leaveType.findUnique({ where: { id } });
  if (!leaveType) {
    throw ApiError.notFound("Leave type not found");
  }
  return toLeaveTypeDto(leaveType);
}

export async function createLeaveType(
  prisma: PrismaClient,
  input: CreateLeaveTypeInput
): Promise<LeaveTypeDto> {
  const leaveType = await prisma.leaveType.create({
    data: {
      name: input.name,
      assignedDays: input.assignedDays,
      status: input.status ?? "Active",
    },
  });
  return toLeaveTypeDto(leaveType);
}

export async function updateLeaveType(
  prisma: PrismaClient,
  id: number,
  input: UpdateLeaveTypeInput
): Promise<LeaveTypeDto> {
  const existing = await prisma.leaveType.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Leave type not found");
  }

  const leaveType = await prisma.leaveType.update({
    where: { id },
    data: {
      name: input.name,
      assignedDays: input.assignedDays,
      status: input.status,
    },
  });
  return toLeaveTypeDto(leaveType);
}

export async function deleteLeaveType(prisma: PrismaClient, id: number): Promise<void> {
  const existing = await prisma.leaveType.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Leave type not found");
  }
  await prisma.leaveType.delete({ where: { id } });
}
