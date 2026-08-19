import { PrismaClient, PayrollSettings } from "../../../generated/tenant";
import { PayrollSettingsDto, UpdatePayrollSettingsInput } from "@hrm-plus/shared";

function toPayrollSettingsDto(settings: PayrollSettings): PayrollSettingsDto {
  return {
    overtimeMultiplier: Number(settings.overtimeMultiplier),
    region: settings.region as PayrollSettingsDto["region"],
    updatedAt: settings.updatedAt.toISOString(),
  };
}

// PayrollSettings is a tenant-wide singleton, same get-or-create pattern as
// GeneralSettings/AttendanceSettings.
export async function getOrCreatePayrollSettings(prisma: PrismaClient): Promise<PayrollSettings> {
  const existing = await prisma.payrollSettings.findFirst();
  if (existing) return existing;
  return prisma.payrollSettings.create({ data: {} });
}

export async function getPayrollSettings(prisma: PrismaClient): Promise<PayrollSettingsDto> {
  return toPayrollSettingsDto(await getOrCreatePayrollSettings(prisma));
}

export async function updatePayrollSettings(
  prisma: PrismaClient,
  input: UpdatePayrollSettingsInput,
  updatedById: number
): Promise<PayrollSettingsDto> {
  const existing = await getOrCreatePayrollSettings(prisma);
  const updated = await prisma.payrollSettings.update({
    where: { id: existing.id },
    data: { ...input, updatedById },
  });
  return toPayrollSettingsDto(updated);
}
