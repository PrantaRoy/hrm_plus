import { PrismaClient } from "../../../generated/tenant";
import { ApplicationDto, PIPELINE_STAGES, PipelineBoardDto, PipelineStage } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { logger } from "../../logger";
import { applicationInclude, toApplicationDto } from "../applications/application.mapper";
import * as assessmentService from "../assessments/assessment.service";

const TERMINAL_STAGES = new Set<PipelineStage>(["HIRED", "REJECTED"]);

export async function getBoard(prisma: PrismaClient, jobId: number): Promise<PipelineBoardDto> {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    throw ApiError.notFound("Job not found");
  }

  const applications = await prisma.application.findMany({
    where: { jobId, withdrawnAt: null },
    include: applicationInclude,
    orderBy: { movedToStageAt: "asc" },
  });
  const dtos = applications.map(toApplicationDto);

  const columns = PIPELINE_STAGES.map((stage) => ({
    stage,
    applications: dtos.filter((a) => a.stage === stage),
  }));

  return { jobId: job.id, jobTitle: job.title, columns };
}

interface MoveStageOptions {
  note?: string;
  rejectionReason?: string;
  tenantSlug?: string;
}

/**
 * The load-bearing transition function for the whole ATS board — not a dumb status
 * setter. `movedByUserId=null` marks a system-triggered move (used by the grading
 * worker's auto-advance-on-pass), recorded as such in ApplicationStageHistory.
 */
export async function moveApplicationStage(
  prisma: PrismaClient,
  applicationId: number,
  toStage: PipelineStage,
  movedByUserId: number | null,
  opts: MoveStageOptions = {}
): Promise<ApplicationDto> {
  const application = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!application) {
    throw ApiError.notFound("Application not found");
  }
  if (application.withdrawnAt) {
    throw ApiError.conflict("This application has been withdrawn");
  }
  if (application.stage === toStage) {
    throw ApiError.conflict("Application is already in this stage");
  }
  if (TERMINAL_STAGES.has(application.stage as PipelineStage)) {
    throw ApiError.conflict("This application is in a terminal stage and cannot be moved");
  }

  // Fail closed BEFORE mutating: AI_ASSESSMENT requires a Published assessment to exist.
  if (toStage === "AI_ASSESSMENT") {
    const assessment = await prisma.assessment.findUnique({ where: { jobId: application.jobId } });
    if (!assessment || assessment.status !== "Published") {
      throw ApiError.conflict(
        "This job has no published assessment. Publish one before moving candidates into AI Assessment."
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.application.update({
      where: { id: applicationId },
      data: {
        stage: toStage,
        movedToStageAt: new Date(),
        rejectionReason: opts.rejectionReason,
      },
    });
    await tx.applicationStageHistory.create({
      data: {
        applicationId,
        fromStage: application.stage,
        toStage,
        movedByType: movedByUserId ? "User" : "System",
        movedById: movedByUserId ?? undefined,
        note: opts.note,
      },
    });
  });

  if (toStage === "AI_ASSESSMENT") {
    if (!opts.tenantSlug) {
      throw ApiError.badRequest("tenantSlug is required to move an application into AI_ASSESSMENT");
    }
    try {
      await assessmentService.inviteCandidateToAssessment(prisma, applicationId, opts.tenantSlug);
    } catch (err) {
      logger.error({ applicationId, err }, "Failed to send assessment invitation after stage move");
      // Not rethrown: the stage move already committed. An admin can retry via a
      // "Resend invite" action calling inviteCandidateToAssessment directly (it's
      // idempotent for INVITED/IN_PROGRESS).
    }
  }

  const updated = await prisma.application.findUniqueOrThrow({ where: { id: applicationId }, include: applicationInclude });
  return toApplicationDto(updated);
}

export async function autoAdvanceApplicationStage(
  prisma: PrismaClient,
  applicationId: number,
  toStage: PipelineStage,
  note: string
): Promise<ApplicationDto> {
  return moveApplicationStage(prisma, applicationId, toStage, null, { note });
}
