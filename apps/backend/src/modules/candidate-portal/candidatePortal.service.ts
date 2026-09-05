import crypto from "node:crypto";
import { PrismaClient } from "../../../generated/tenant";
import { CandidatePortalApplicationDto, CandidatePortalRedeemResponse } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { env } from "../../config/env";

const TOKEN_TTL_MS = Number(env.CANDIDATE_PORTAL_TOKEN_TTL_HOURS) * 60 * 60 * 1000;

export type CandidateTokenPurpose = "PORTAL" | "ASSESSMENT_INVITE";

/**
 * Reuses a live (non-expired) token for this application+purpose if one exists,
 * else issues a new one. Unlike PasswordResetToken this token is multi-use — a
 * candidate needs to revisit the portal repeatedly, not just once.
 */
export async function issueOrRefreshToken(
  prisma: PrismaClient,
  applicationId: number,
  purpose: CandidateTokenPurpose
): Promise<string> {
  const existing = await prisma.candidateAccessToken.findFirst({
    where: { applicationId, purpose, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    return existing.token;
  }

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.candidateAccessToken.create({
    data: {
      applicationId,
      token,
      purpose,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });
  return token;
}

async function toCandidatePortalApplicationDto(
  prisma: PrismaClient,
  applicationId: number
): Promise<CandidatePortalApplicationDto> {
  const application = await prisma.application.findUniqueOrThrow({
    where: { id: applicationId },
    include: { job: true, assessmentInvitation: true },
  });
  return {
    applicationId: application.id,
    jobTitle: application.job.title,
    stage: application.stage as CandidatePortalApplicationDto["stage"],
    withdrawnAt: application.withdrawnAt ? application.withdrawnAt.toISOString() : null,
    hasAssessmentInvitation: Boolean(application.assessmentInvitation),
    assessmentStatus: application.assessmentInvitation
      ? (application.assessmentInvitation.status as CandidatePortalApplicationDto["assessmentStatus"])
      : null,
    assessmentScorePercent: application.assessmentInvitation?.scorePercent ?? null,
    assessmentOutcome: (application.assessmentInvitation?.outcome as CandidatePortalApplicationDto["assessmentOutcome"]) ?? null,
  };
}

export async function getPortalSnapshot(prisma: PrismaClient, applicationId: number): Promise<CandidatePortalRedeemResponse> {
  const application = await prisma.application.findUniqueOrThrow({
    where: { id: applicationId },
    include: { candidate: true },
  });
  return {
    candidateName: application.candidate.fullName,
    application: await toCandidatePortalApplicationDto(prisma, applicationId),
  };
}

export async function withdrawApplication(prisma: PrismaClient, applicationId: number, reason?: string): Promise<void> {
  const application = await prisma.application.findUniqueOrThrow({ where: { id: applicationId } });
  if (application.withdrawnAt) {
    throw ApiError.conflict("This application has already been withdrawn");
  }
  if (application.stage === "HIRED") {
    throw ApiError.conflict("A hired application cannot be withdrawn");
  }
  await prisma.$transaction([
    prisma.application.update({ where: { id: applicationId }, data: { withdrawnAt: new Date() } }),
    prisma.applicationStageHistory.create({
      data: {
        applicationId,
        fromStage: application.stage,
        toStage: application.stage,
        movedByType: "System",
        note: reason ? `Withdrawn by candidate: ${reason}` : "Withdrawn by candidate",
      },
    }),
  ]);
}
