import { PrismaClient } from "../../../generated/tenant";
import { controlClient } from "../../db/controlClient";
import { getTenantClient } from "../../db/tenantClientPool";
import { logger } from "../../logger";
import { sendAssetExpiryReminderEmail } from "../notifications/email.service";
import { listExpiringAssets } from "./asset.service";

const REMINDER_WINDOWS_DAYS = [30, 7];

const EXPIRY_FIELD_LABELS: Record<string, string> = {
  registrationExpiry: "Vehicle registration",
  wofCofExpiry: "WoF/CoF",
  testAndTagExpiry: "Test & tag",
  warrantyExpiry: "Warranty",
};

async function notifyForExpiringAsset(
  prisma: PrismaClient,
  hit: Awaited<ReturnType<typeof listExpiringAssets>>[number]
): Promise<void> {
  const { asset, expiryField, expiryDate, windowDays } = hit;

  const alreadySent = await prisma.assetReminderLog.findUnique({
    where: { assetId_expiryField_windowDays: { assetId: asset.id, expiryField, windowDays } },
  });
  if (alreadySent) return;

  const recipients = new Set<string>();
  const holderUser = asset.currentAssignment
    ? await prisma.employee.findUnique({
        where: { id: asset.currentAssignment.employeeId },
        select: { email: true },
      })
    : null;
  if (holderUser) recipients.add(holderUser.email);

  const adminAndHrUsers = await prisma.user.findMany({
    where: { role: { name: { in: ["Admin", "HR"] } }, isActive: true },
    select: { email: true },
  });
  adminAndHrUsers.forEach((u) => recipients.add(u.email));

  const daysUntil = Math.max(0, Math.ceil((expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
  const label = EXPIRY_FIELD_LABELS[expiryField] ?? expiryField;

  await Promise.all(
    Array.from(recipients).map((email) =>
      sendAssetExpiryReminderEmail(
        email,
        asset.name,
        asset.assetTag,
        label,
        expiryDate.toISOString().slice(0, 10),
        daysUntil
      )
    )
  );

  await prisma.assetReminderLog.create({
    data: { assetId: asset.id, expiryField, windowDays },
  });
}

export async function runAssetExpiryReminderCheckForTenant(prisma: PrismaClient): Promise<void> {
  const hits = await listExpiringAssets(prisma, REMINDER_WINDOWS_DAYS);
  for (const hit of hits) {
    await notifyForExpiringAsset(prisma, hit).catch((err) =>
      logger.warn({ err, assetId: hit.asset.id, expiryField: hit.expiryField }, "Failed to send asset expiry reminder")
    );
  }
}

export async function runAssetExpiryReminderCheck(): Promise<void> {
  const tenants = await controlClient.tenant.findMany({ where: { status: "Active" } });
  for (const tenant of tenants) {
    const prisma = getTenantClient(tenant.databaseName);
    await runAssetExpiryReminderCheckForTenant(prisma).catch((err) =>
      logger.error({ err, tenantSlug: tenant.slug }, "Asset expiry reminder check failed for tenant")
    );
  }
}
