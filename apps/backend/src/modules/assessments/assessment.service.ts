import { PrismaClient } from "../../../generated/tenant";
import {
  AssessmentDto,
  AssessmentInvitationDto,
  AssessmentOutcome,
  CreateOrUpdateAssessmentInput,
  GenerateAssessmentWithAiInput,
  PublicAssessmentMetaDto,
  PublicCurrentQuestionDto,
  SubmitCurrentAnswerInput,
  SubmitCurrentAnswerResponse,
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
  toPublicAssessmentMetaDto,
  toPublicCurrentQuestionDto,
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

const TRUE_FALSE_OPTIONS = ["True", "False"];

function questionOptionFields(q: CreateOrUpdateAssessmentInput["questions"][number]) {
  switch (q.type) {
    case "MCQ":
      return { options: q.options, correctOptionIndex: q.correctOptionIndex, correctOptionIndexes: undefined };
    case "TRUE_FALSE":
      // Options are always ["True", "False"] — never accepted from the client (see assessment.schemas.ts).
      return { options: TRUE_FALSE_OPTIONS, correctOptionIndex: q.correctOptionIndex, correctOptionIndexes: undefined };
    case "MULTIPLE_SELECT":
      return { options: q.options, correctOptionIndex: undefined, correctOptionIndexes: q.correctOptionIndexes };
    case "SHORT_TEXT":
      return { options: undefined, correctOptionIndex: undefined, correctOptionIndexes: undefined };
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
      points: q.points,
      sortOrder: q.sortOrder ?? index,
      ...questionOptionFields(q),
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
            timeLimitMinutes: input.timeLimitMinutes,
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
            timeLimitMinutes: input.timeLimitMinutes,
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
  if (input.mcqCount + input.trueFalseCount + input.shortTextCount === 0) {
    throw ApiError.badRequest("Request at least one question to generate");
  }
  const existing = await prisma.assessment.findUnique({ where: { jobId } });
  if (existing) {
    await assertQuestionsEditable(prisma, existing.id);
  }

  const generated = await generateAssessmentQuestions(prisma, {
    jobTitle: job.title,
    skills: (job.skills as string[]) ?? [],
    minExperienceYears: job.minExperienceYears,
    maxExperienceYears: job.maxExperienceYears,
    description: job.description,
    mcqCount: input.mcqCount,
    trueFalseCount: input.trueFalseCount,
    shortTextCount: input.shortTextCount,
    customPrompt: input.customPrompt,
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
        options: q.type === "MCQ" ? q.options : q.type === "TRUE_FALSE" ? TRUE_FALSE_OPTIONS : undefined,
        correctOptionIndex: q.type === "MCQ" || q.type === "TRUE_FALSE" ? q.correctOptionIndex : undefined,
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
    // Snapshotted at invite time (not recomputed later) so a subsequent edit to
    // Job.assessmentDeadlineDays never retroactively moves a deadline already
    // communicated to the candidate.
    const participationDeadlineAt = application.job.assessmentDeadlineDays
      ? new Date(application.createdAt.getTime() + application.job.assessmentDeadlineDays * 24 * 60 * 60 * 1000)
      : null;

    invitation = await prisma.assessmentInvitation.create({
      data: { applicationId, assessmentId: assessment.id, participationDeadlineAt },
      include: invitationInclude,
    });
  } else if (invitation.status !== "INVITED" && invitation.status !== "IN_PROGRESS") {
    // Already submitted/graded/expired — nothing to (re)send, just return current state.
    return toAssessmentInvitationDto(invitation);
  }

  const token = await issueOrRefreshToken(prisma, applicationId, "ASSESSMENT_INVITE");
  const assessmentUrl = `${env.FRONTEND_BASE_URL}/candidate/${tenantSlug}/assessment?token=${token}`;
  await sendAssessmentInviteEmail(application.candidate.email, application.candidate.fullName, application.job.title, assessmentUrl);

  return toAssessmentInvitationDto(invitation);
}

type LiveInvitation = NonNullable<Awaited<ReturnType<typeof loadInvitationRow>>>;

function loadInvitationRow(prisma: PrismaClient, applicationId: number) {
  return prisma.assessmentInvitation.findUnique({ where: { applicationId } });
}

/**
 * Single choke point for deadline/timeout enforcement — every candidate-facing
 * assessment action loads through here first. Fails closed: a lapsed deadline or
 * timer flips the invitation to its terminal state and throws before the caller
 * can read/mutate anything further.
 */
async function loadLiveInvitationOrExpire(prisma: PrismaClient, applicationId: number): Promise<LiveInvitation> {
  const invitation = await loadInvitationRow(prisma, applicationId);
  if (!invitation) {
    throw ApiError.notFound("No assessment is assigned to this application");
  }

  const now = new Date();

  if (invitation.status === "EXPIRED") {
    throw ApiError.gone("This assessment's participation deadline has passed");
  }
  if (invitation.status === "SUBMITTED" || invitation.status === "GRADING" || invitation.status === "GRADED") {
    throw ApiError.conflict("This assessment has already been submitted");
  }

  if (invitation.status === "INVITED" && invitation.participationDeadlineAt && invitation.participationDeadlineAt < now) {
    await prisma.assessmentInvitation.update({ where: { id: invitation.id }, data: { status: "EXPIRED" } });
    throw ApiError.gone("This assessment's participation deadline has passed");
  }

  if (invitation.status === "IN_PROGRESS" && invitation.examExpiresAt && invitation.examExpiresAt < now) {
    await expireInvitation(prisma, invitation.id);
    throw ApiError.gone("Time's up — this assessment has been closed and submitted automatically");
  }

  return invitation;
}

async function finalizeOrMarkGrading(prisma: PrismaClient, invitationId: number): Promise<void> {
  const pendingCount = await prisma.assessmentAnswer.count({
    where: { invitationId, gradingStatus: { in: ["PENDING", "QUEUED"] } },
  });
  if (pendingCount > 0) {
    await prisma.assessmentInvitation.update({ where: { id: invitationId }, data: { status: "GRADING" } });
  } else {
    await finalizeInvitationIfComplete(prisma, invitationId);
  }
}

/**
 * Called both synchronously (candidate hits the API after their timer ran out) and
 * from the BullMQ safety-net sweep (candidate simply closed the tab). Whatever was
 * answered stands; unanswered questions score 0 via finalizeInvitationIfComplete.
 */
export async function expireInvitation(prisma: PrismaClient, invitationId: number): Promise<void> {
  const invitation = await prisma.assessmentInvitation.findUnique({ where: { id: invitationId } });
  if (!invitation || invitation.status !== "IN_PROGRESS") return;

  await prisma.assessmentInvitation.update({
    where: { id: invitationId },
    data: { status: "SUBMITTED", submittedAt: invitation.submittedAt ?? new Date() },
  });
  await finalizeOrMarkGrading(prisma, invitationId);
}

export async function getAssignedAssessment(prisma: PrismaClient, applicationId: number): Promise<PublicAssessmentMetaDto> {
  let invitation = await loadLiveInvitationOrExpire(prisma, applicationId);
  const assessment = await prisma.assessment.findUniqueOrThrow({ where: { id: invitation.assessmentId }, include: assessmentInclude });

  if (invitation.status === "INVITED") {
    const startedAt = new Date();
    const examExpiresAt = assessment.timeLimitMinutes ? new Date(startedAt.getTime() + assessment.timeLimitMinutes * 60 * 1000) : null;
    invitation = await prisma.assessmentInvitation.update({
      where: { id: invitation.id },
      data: { status: "IN_PROGRESS", startedAt, examExpiresAt },
    });
  }

  return toPublicAssessmentMetaDto(assessment, invitation);
}

export async function getCurrentQuestion(prisma: PrismaClient, applicationId: number): Promise<PublicCurrentQuestionDto> {
  const invitation = await loadLiveInvitationOrExpire(prisma, applicationId);
  if (invitation.status !== "IN_PROGRESS") {
    throw ApiError.conflict("This assessment has not been started yet");
  }

  const assessment = await prisma.assessment.findUniqueOrThrow({ where: { id: invitation.assessmentId }, include: assessmentInclude });
  const current = toPublicCurrentQuestionDto(assessment, invitation);
  if (!current) {
    throw ApiError.conflict("This assessment has already been completed");
  }
  return current;
}

export async function submitCurrentAnswer(
  prisma: PrismaClient,
  applicationId: number,
  input: SubmitCurrentAnswerInput,
  tenantSlug: string
): Promise<SubmitCurrentAnswerResponse> {
  const invitation = await loadLiveInvitationOrExpire(prisma, applicationId);
  if (invitation.status !== "IN_PROGRESS") {
    throw ApiError.conflict("This assessment has not been started yet");
  }

  const assessment = await prisma.assessment.findUniqueOrThrow({ where: { id: invitation.assessmentId }, include: assessmentInclude });
  const question = assessment.questions[invitation.currentQuestionIndex];
  if (!question) {
    throw ApiError.conflict("This assessment has already been completed");
  }
  // Server-authoritative: reject any attempt to answer out of order (skip/replay/jump).
  if (input.questionId !== question.id) {
    throw ApiError.badRequest("This answer does not match the current question", "QUESTION_MISMATCH");
  }

  let queued = false;
  if (question.type === "MCQ" || question.type === "TRUE_FALSE") {
    const isCorrect = input.selectedOptionIndex === question.correctOptionIndex;
    await prisma.assessmentAnswer.create({
      data: {
        invitationId: invitation.id,
        questionId: question.id,
        selectedOptionIndex: input.selectedOptionIndex,
        isCorrect,
        pointsAwarded: isCorrect ? question.points : 0,
        gradingStatus: "INSTANT",
        gradedAt: new Date(),
      },
    });
  } else if (question.type === "MULTIPLE_SELECT") {
    const correctSet = new Set((question.correctOptionIndexes as number[] | null) ?? []);
    const selectedIndexes = input.selectedOptionIndexes ?? [];
    const selectedSet = new Set(selectedIndexes);
    const isCorrect = correctSet.size === selectedSet.size && [...correctSet].every((i) => selectedSet.has(i));
    await prisma.assessmentAnswer.create({
      data: {
        invitationId: invitation.id,
        questionId: question.id,
        selectedOptionIndexes: selectedIndexes,
        isCorrect,
        pointsAwarded: isCorrect ? question.points : 0,
        gradingStatus: "INSTANT",
        gradedAt: new Date(),
      },
    });
  } else {
    await prisma.assessmentAnswer.create({
      data: {
        invitationId: invitation.id,
        questionId: question.id,
        textAnswer: input.textAnswer,
        gradingStatus: "QUEUED",
      },
    });
    queued = true;
  }

  const nextIndex = invitation.currentQuestionIndex + 1;
  const isComplete = nextIndex >= assessment.questions.length;

  const updated = await prisma.assessmentInvitation.update({
    where: { id: invitation.id },
    data: {
      currentQuestionIndex: nextIndex,
      ...(isComplete ? { status: "SUBMITTED" as const, submittedAt: new Date() } : {}),
    },
  });

  if (queued) {
    const answer = await prisma.assessmentAnswer.findUniqueOrThrow({
      where: { invitationId_questionId: { invitationId: invitation.id, questionId: question.id } },
    });
    await enqueueAssessmentGradingJob({ tenantSlug, answerId: answer.id });
  }

  if (isComplete) {
    await finalizeOrMarkGrading(prisma, invitation.id);
    return { isComplete: true, nextQuestion: null };
  }

  const nextQuestion = toPublicCurrentQuestionDto(assessment, updated);
  return { isComplete: false, nextQuestion };
}

export async function finalizeInvitationIfComplete(prisma: PrismaClient, invitationId: number): Promise<void> {
  const invitation = await prisma.assessmentInvitation.findUnique({
    where: { id: invitationId },
    include: { answers: { include: { question: true } }, assessment: { include: assessmentInclude } },
  });
  if (!invitation) return;

  const pending = invitation.answers.some((a) => a.gradingStatus === "PENDING" || a.gradingStatus === "QUEUED");
  if (pending) return; // FAILED (retries exhausted) does NOT block finalization

  // Scored over ALL of the assessment's questions, not just the ones answered —
  // a question never reached (timeout, or any other partial submission) counts as 0,
  // rather than being excluded from the denominator.
  const allQuestions = invitation.assessment.questions;
  const pointsByQuestionId = new Map(invitation.answers.map((a) => [a.questionId, a.pointsAwarded ?? 0]));
  const totalPoints = allQuestions.reduce((sum, q) => sum + q.points, 0);
  const scoredPoints = allQuestions.reduce((sum, q) => sum + (pointsByQuestionId.get(q.id) ?? 0), 0);
  const scorePercent = totalPoints > 0 ? (scoredPoints / totalPoints) * 100 : 0;
  const shortTextPoints = allQuestions.filter((q) => q.type === "SHORT_TEXT").reduce((sum, q) => sum + q.points, 0);
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
