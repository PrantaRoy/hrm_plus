import { PrismaClient } from "../../../generated/tenant";
import { SchedulerSettingsDto, UpdateSchedulerSettingsInput } from "@hrm-plus/shared";
import { toSchedulerSettingsDto } from "./schedulerSettings.mapper";

// SchedulerSettings is a tenant-wide singleton (meeting conflict-matrix rules); enforced
// via get-or-create, matching the AttendanceSettings / GeneralSettings pattern.
export async function getOrCreateSettings(prisma: PrismaClient) {
  const existing = await prisma.schedulerSettings.findFirst();
  if (existing) return existing;
  return prisma.schedulerSettings.create({ data: {} });
}

export async function getSchedulerSettings(prisma: PrismaClient): Promise<SchedulerSettingsDto> {
  return toSchedulerSettingsDto(await getOrCreateSettings(prisma));
}

export async function updateSchedulerSettings(
  prisma: PrismaClient,
  input: UpdateSchedulerSettingsInput,
  updatedById: number
): Promise<SchedulerSettingsDto> {
  const existing = await getOrCreateSettings(prisma);
  const updated = await prisma.schedulerSettings.update({
    where: { id: existing.id },
    data: { ...input, updatedById },
  });
  return toSchedulerSettingsDto(updated);
}
