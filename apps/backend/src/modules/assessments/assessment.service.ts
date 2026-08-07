import { PrismaClient } from "../../../generated/tenant";
import {
  AssessmentDto,
  AssessmentInvitationDto,
  AssessmentOutcome,
  CreateOrUpdateAssessmentInput,
  GenerateAssessmentWithAiInput,
  PublicAssessmentDto,
  SubmitAssessmentAnswersInput,
} from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { logger } from "../../logger";
import { env } from "../../config/env";
import { sendAssessmentInviteEmail } from "../notifications/email.service";
import { issueOrRefreshToken } from "../candidate-portal/candidatePortal.service";
import { enqueueAssessmentGradingJob } from "../../queue/assessmentGrading.queue";
import { generateAssessmentQuestions } from "../llm/assessmentQuestionGeneration";
import * as pipelineService from "../pipeline/pipeline.service";
import {
  assessmentInclude,
  invitationInclude,
  toAssessmentDto,
  toAssessmentInvitationDto,
  toPublicAssessmentDto,
} from "./assessment.mapper";

const DEFAULT_PASS_THRESHOLD = 60;

export async function getAssessmentByJobId(prisma: PrismaClient, jobId: number): Promise<AssessmentDto> {
  const assessment = await prisma.assessment.findUnique({ where: { jobId }, include: assessmentInclude });
  if (!assessment) {
    throw ApiError.notFound("No assessment has been created for this job yet");
  }
  return toAssessmentDto(assessment);
}

async function assertJobExists(prisma: PrismaClient, jobId: number) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    throw ApiError.notFound("Job not found");
  }
  return job;
}

async function assertQuestionsEditable(prisma: PrismaClient, assessmentId: number) {
  const invitationCount = await prisma.assessmentInvitation.count({ where: { assessmentId } });
  if (invitationCount > 0) {
    throw ApiError.conflict("Cannot edit questions after candidates have been invited to this assessment");
  }
}

async function replaceQuestions(
  prisma: PrismaClient,
  assessmentId: number,
  questions: CreateOrUpdateAssessmentInput["questions"]
) {
  await prisma.assessmentQuestion.deleteMany({ where: { assessmentId } });
  await prisma.assessmentQuestion.createMany({
    data: questions.map((q, index) => ({
      assessmentId,
      type: q.type,
      prompt: q.prompt,
      options: q.type === "MCQ" ? q.options : undefined,
      correctOptionIndex: q.type === "MCQ" ? q.correctOptionIndex : undefined,
      points: q.points,
      sortOrder: q.sortOrder ?? index,
    })),
  });
}

export async function upsertAssessment(
  prisma: PrismaClient,
  jobId: number,
  input: CreateOrUpdateAssessmentInput,
  userId: number
): Promise<AssessmentDto> {
  await assertJobExists(prisma, jobId);
  const existing = await prisma.assessment.findUnique({ where: { jobId } });
  if (existing) {
    await assertQuestionsEditable(prisma, existing.id);
  }

  const assessment = await prisma.$transaction(async (tx) => {
    const record = existing
      ? await tx.assessment.update({
          where: { id: existing.id },
          data: {
            title: input.title,
            instructions: input.instructions,
            passThresholdPercent: input.passThresholdPercent,
            generationSource: existing.generationSource === "AI_GENERATED" ? "AI_GENERATED_EDITED" : existing.generationSource,
            updatedById: userId,
          },
        })
      : await tx.assessment.create({
          data: {
            jobId,
            title: input.title ?? "Assessment",
            instructions: input.instructions,
            passThresholdPercent: input.passThresholdPercent ?? DEFAULT_PASS_THRESHOLD,
            createdById: userId,
          },
        });

    await replaceQuestions(tx as unknown as PrismaClient, record.id, input.questions);
    return tx.assessment.findUniqueOrThrow({ where: { id: record.id }, include: assessmentInclude });
  });

  return toAssessmentDto(assessment);
}

export async function publishAssessment(prisma: PrismaClient, jobId: number, userId: number): Promise<AssessmentDto> {
  const assessment = await prisma.assessment.findUnique({ where: { jobId }, include: assessmentInclude });
  if (!assessment) {
    throw ApiError.notFound("No assessment has been created for this job yet");
  }
  if (assessment.status === "Published") {
    throw ApiError.conflict("Assessment is already published");
  }
  if (assessment.questions.length === 0) {
    throw ApiError.badRequest("Cannot publish an assessment with no questions");
  }

  const updated = await prisma.assessment.update({
    where: { id: assessment.id },
    data: { status: "Published", updatedById: userId },
    include: assessmentInclude,
  });
  return toAssessmentDto(updated);
}

export async function generateAssessmentWithAi(
  prisma: PrismaClient,
  jobId: number,
  input: GenerateAssessmentWithAiInput,
  userId: number
): Promise<AssessmentDto> {
  const job = await assertJobExists(prisma, jobId);
  const existing = await prisma.assessment.findUnique({ where: { jobId } });
  if (existing) {
    await assertQuestionsEditable(prisma, existing.id);
  }

  const generated = await generateAssessmentQuestions({
    jobTitle: job.title,
    skills: (job.skills as string[]) ?? [],
    minExperienceYears: job.minExperienceYears,
    maxExperienceYears: job.maxExperienceYears,
    description: job.description,
    mcqCount: input.mcqCount,
    shortTextCount: input.shortTextCount,
  });

  const assessment = await prisma.$transaction(async (tx) => {
    const record = existing
      ? await tx.assessment.update({
          where: { id: existing.id },
          data: {
            passThresholdPercent: input.passThresholdPercent ?? existing.passThresholdPercent,
            generationSource: "AI_GENERATED",
            updatedById: userId,
          },
        })
      : await tx.assessment.create({
          data: {
            jobId,
            passThresholdPercent: input.passThresholdPercent ?? DEFAULT_PASS_THRESHOLD,
            generationSource: "AI_GENERATED",
            createdById: userId,
          },
        });

    await tx.assessmentQuestion.deleteMany({ where: { assessmentId: record.id } });
    await tx.assessmentQuestion.createMany({
      data: generated.map((q, index) => ({
        assessmentId: record.id,
        type: q.type,
        prompt: q.prompt,
        options: q.type === "MCQ" ? q.options : undefined,
        correctOptionIndex: q.type === "MCQ" ? q.correctOptionIndex : undefined,
        points: q.points,
        sortOrder: index,
      })),
    });

    return tx.assessment.findUniqueOrThrow({ where: { id: record.id }, include: assessmentInclude });
  });

  return toAssessmentDto(assessment);
}

/**
 * Idempotent: re-inviting an application that's already INVITED just resends the
 * email against the same invitation. Used both by the AI_ASSESSMENT stage-move
 * side effect and by an admin "Resend invite" retry action.
 */
export async function inviteCandidateToAssessment(
  prisma: PrismaClient,
  applicationId: number,
  tenantSlug: string
): Promise<AssessmentInvitationDto> {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: true, candidate: true },
  });
  if (!application) {
    throw ApiError.notFound("Application not found");
  }

  const assessment = await prisma.assessment.findUnique({ where: { jobId: application.jobId } });
  if (!assessment || assessment.status !== "Published") {
    throw ApiError.conflict("This job has no published assessment");
  }

  let invitation = await prisma.assessmentInvitation.findUnique({ where: { applicationId }, include: invitationInclude });
  if (!invitation) {
    invitation = await prisma.assessmentInvitation.create({
      data: { applicationId, assessmentId: assessment.id },
      include: invitationInclude,
    });
  } else if (invitation.status !== "INVITED" && invitation.status !== "IN_PROGRESS") {
    // Already submitted/graded — nothing to (re)send, just return current state.
    return toAssessmentInvitationDto(invitation);
  }

  const token = await issueOrRefreshToken(prisma, applicationId, "ASSESSMENT_INVITE");
  const assessmentUrl = `${env.FRONTEND_BASE_URL}/candidate/${tenantSlug}/assessment?token=${token}`;
  await sendAssessmentInviteEmail(application.candidate.email, application.candidate.fullName, application.job.title, assessmentUrl);

  return toAssessmentInvitationDto(invitation);
}

export async function getAssignedAssessment(prisma: PrismaClient, applicationId: number): Promise<PublicAssessmentDto> {
  const invitation = await prisma.assessmentInvitation.findUnique({ where: { applicationId } });
  if (!invitation) {
    throw ApiError.notFound("No assessment is assigned to this application");
  }

  if (invitation.status === "INVITED") {
    await prisma.assessmentInvitation.update({
      where: { id: invitation.id },
      data: { status: "IN_PROGRESS", startedAt: new Date() },
    });
  }

  const assessment = await prisma.assessment.findUniqueOrThrow({ where: { id: invitation.assessmentId }, include: assessmentInclude });
  const status = invitation.status === "INVITED" ? "IN_PROGRESS" : (invitation.status as PublicAssessmentDto["status"]);
  return toPublicAssessmentDto(assessment, status);
}

export async function submitAssessmentAnswers(
  prisma: PrismaClient,
  applicationId: number,
  input: SubmitAssessmentAnswersInput,
  tenantSlug: string
): Promise<AssessmentInvitationDto> {
  const invitation = await prisma.assessmentInvitation.findUnique({ where: { applicationId } });
  if (!invitation) {
    throw ApiError.notFound("No assessment is assigned to this application");
  }
  if (invitation.status !== "INVITED" && invitation.status !== "IN_PROGRESS") {
    throw ApiError.conflict("This assessment has already been submitted");
  }

  const questions = await prisma.assessmentQuestion.findMany({ where: { assessmentId: invitation.assessmentId } });
  const questionsById = new Map(questions.map((q) => [q.id, q]));

  const queuedAnswerQuestionIds: number[] = [];

  await prisma.$transaction(async (tx) => {
    for (const answer of input.answers) {
      const question = questionsById.get(answer.questionId);
      if (!question) {
        throw ApiError.badRequest("One or more answers reference an unknown question");
      }

      if (question.type === "MCQ") {
        const isCorrect = answer.selectedOptionIndex === question.correctOptionIndex;
        await tx.assessmentAnswer.create({
          data: {
            invitationId: invitation.id,
            questionId: question.id,
            selectedOptionIndex: answer.selectedOptionIndex,
            isCorrect,
            pointsAwarded: isCorrect ? question.points : 0,
            gradingStatus: "INSTANT",
            gradedAt: new Date(),
          },
        });
      } else {
        await tx.assessmentAnswer.create({
          data: {
            invitationId: invitation.id,
            questionId: question.id,
            textAnswer: answer.textAnswer,
            gradingStatus: "QUEUED",
          },
        });
        queuedAnswerQuestionIds.push(question.id);
      }
    }

    await tx.assessmentInvitation.update({
      where: { id: invitation.id },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });
  });

  if (queuedAnswerQuestionIds.length > 0) {
    await prisma.assessmentInvitation.update({ where: { id: invitation.id }, data: { status: "GRADING" } });
    const queuedAnswers = await prisma.assessmentAnswer.findMany({
      where: { invitationId: invitation.id, gradingStatus: "QUEUED" },
    });
    for (const answer of queuedAnswers) {
      await enqueueAssessmentGradingJob({ tenantSlug, answerId: answer.id });
    }
  } else {
    await finalizeInvitationIfComplete(prisma, invitation.id);
  }

  const updated = await prisma.assessmentInvitation.findUniqueOrThrow({ where: { id: invitation.id }, include: invitationInclude });
  return toAssessmentInvitationDto(updated);
}

export async function finalizeInvitationIfComplete(prisma: PrismaClient, invitationId: number): Promise<void> {
  const invitation = await prisma.assessmentInvitation.findUnique({
    where: { id: invitationId },
    include: { answers: { include: { question: true } }, assessment: true },
  });
  if (!invitation) return;

  const pending = invitation.answers.some((a) => a.gradingStatus === "PENDING" || a.gradingStatus === "QUEUED");
  if (pending) return; // FAILED (retries exhausted) does NOT block finalization

  const totalPoints = invitation.answers.reduce((sum, a) => sum + a.question.points, 0);
  const scoredPoints = invitation.answers.reduce((sum, a) => sum + (a.pointsAwarded ?? 0), 0);
  const scorePercent = totalPoints > 0 ? (scoredPoints / totalPoints) * 100 : 0;
  const shortTextPoints = invitation.answers
    .filter((a) => a.question.type === "SHORT_TEXT")
    .reduce((sum, a) => sum + a.question.points, 0);
  const shortTextShare = totalPoints > 0 ? shortTextPoints / totalPoints : 0;

  const threshold = invitation.assessment.passThresholdPercent;
  const borderlineBand = Number(env.ASSESSMENT_BORDERLINE_BAND_PERCENT);

  let outcome: AssessmentOutcome;
  if (scorePercent >= threshold) {
    outcome = shortTextShare >= 0.5 || scorePercent < threshold + borderlineBand ? "PASSED_PENDING_REVIEW" : "PASSED";
  } else {
    outcome = "FAILED"; // no auto-rejection — left for human review
  }

  await prisma.assessmentInvitation.update({
    where: { id: invitationId },
    data: { status: "GRADED", gradedAt: new Date(), scoredPoints, scorePercent, outcome, totalPoints },
  });

  if (outcome === "PASSED") {
    try {
      await pipelineService.autoAdvanceApplicationStage(
        prisma,
        invitation.applicationId,
        "VIRTUAL_INTERVIEW",
        "Auto-advanced: assessment score met the passing threshold"
      );
    } catch (err) {
      logger.error({ invitationId, err }, "Failed to auto-advance application after passing assessment");
    }
  }
}
