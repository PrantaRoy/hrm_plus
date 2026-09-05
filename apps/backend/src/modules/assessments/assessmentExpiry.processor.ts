import { PrismaClient } from "../../../generated/tenant";
import { controlClient } from "../../db/controlClient";
import { getTenantClient } from "../../db/tenantClientPool";
import { logger } from "../../logger";
import { expireInvitation } from "./assessment.service";

export async function runAssessmentExpiryCheckForTenant(prisma: PrismaClient): Promise<void> {
  const now = new Date();

  const timedOut = await prisma.assessmentInvitation.findMany({
    where: { status: "IN_PROGRESS", examExpiresAt: { lt: now } },
    select: { id: true },
  });
  for (const invitation of timedOut) {
    await expireInvitation(prisma, invitation.id).catch((err) =>
      logger.error({ err, invitationId: invitation.id }, "Failed to auto-expire timed-out assessment invitation")
    );
  }

  await prisma.assessmentInvitation.updateMany({
    where: { status: "INVITED", participationDeadlineAt: { lt: now } },
    data: { status: "EXPIRED" },
  });
}

export async function runAssessmentExpiryCheck(): Promise<void> {
  const tenants = await controlClient.tenant.findMany({ where: { status: "Active" } });
  for (const tenant of tenants) {
    const prisma = getTenantClient(tenant.databaseName);
    await runAssessmentExpiryCheckForTenant(prisma).catch((err) =>
      logger.error({ err, tenantSlug: tenant.slug }, "Assessment expiry check failed for tenant")
    );
  }
}
