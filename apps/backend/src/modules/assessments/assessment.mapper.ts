import { Prisma } from "../../../generated/tenant";
import { AssessmentDto, AssessmentInvitationDto, PublicAssessmentDto, PublicAssessmentQuestionDto } from "@hrm-plus/shared";

const assessmentWithRelations = Prisma.validator<Prisma.AssessmentDefaultArgs>()({
  include: { questions: { orderBy: { sortOrder: "asc" } } },
});

export type AssessmentWithRelations = Prisma.AssessmentGetPayload<typeof assessmentWithRelations>;

export const assessmentInclude = assessmentWithRelations.include;

export function toAssessmentDto(assessment: AssessmentWithRelations): AssessmentDto {
  return {
    id: assessment.id,
    jobId: assessment.jobId,
    title: assessment.title,
    instructions: assessment.instructions,
    passThresholdPercent: assessment.passThresholdPercent,
    generationSource: assessment.generationSource as AssessmentDto["generationSource"],
    status: assessment.status as AssessmentDto["status"],
    questions: assessment.questions.map((q) => ({
      id: q.id,
      type: q.type as AssessmentDto["questions"][number]["type"],
      prompt: q.prompt,
      options: (q.options as string[] | null) ?? null,
      correctOptionIndex: q.correctOptionIndex,
      points: q.points,
      sortOrder: q.sortOrder,
    })),
    createdAt: assessment.createdAt.toISOString(),
    updatedAt: assessment.updatedAt.toISOString(),
  };
}

export function toPublicAssessmentDto(
  assessment: AssessmentWithRelations,
  status: PublicAssessmentDto["status"]
): PublicAssessmentDto {
  const questions: PublicAssessmentQuestionDto[] = assessment.questions.map((q) => ({
    id: q.id,
    type: q.type as PublicAssessmentQuestionDto["type"],
    prompt: q.prompt,
    options: (q.options as string[] | null) ?? null,
    points: q.points,
  }));
  return {
    title: assessment.title,
    instructions: assessment.instructions,
    status,
    questions,
  };
}

const invitationWithRelations = Prisma.validator<Prisma.AssessmentInvitationDefaultArgs>()({
  include: { answers: { include: { question: true } } },
});

export type InvitationWithRelations = Prisma.AssessmentInvitationGetPayload<typeof invitationWithRelations>;

export const invitationInclude = invitationWithRelations.include;

export function toAssessmentInvitationDto(invitation: InvitationWithRelations): AssessmentInvitationDto {
  return {
    id: invitation.id,
    applicationId: invitation.applicationId,
    assessmentId: invitation.assessmentId,
    status: invitation.status as AssessmentInvitationDto["status"],
    totalPoints: invitation.totalPoints,
    scoredPoints: invitation.scoredPoints,
    scorePercent: invitation.scorePercent,
    outcome: invitation.outcome as AssessmentInvitationDto["outcome"],
    invitedAt: invitation.invitedAt.toISOString(),
    startedAt: invitation.startedAt ? invitation.startedAt.toISOString() : null,
    submittedAt: invitation.submittedAt ? invitation.submittedAt.toISOString() : null,
    gradedAt: invitation.gradedAt ? invitation.gradedAt.toISOString() : null,
    answers: invitation.answers.map((answer) => ({
      questionId: answer.questionId,
      type: answer.question.type as AssessmentInvitationDto["answers"][number]["type"],
      prompt: answer.question.prompt,
      selectedOptionIndex: answer.selectedOptionIndex,
      textAnswer: answer.textAnswer,
      isCorrect: answer.isCorrect,
      pointsAwarded: answer.pointsAwarded,
      points: answer.question.points,
      gradingStatus: answer.gradingStatus as AssessmentInvitationDto["answers"][number]["gradingStatus"],
      aiFeedback: answer.aiFeedback,
    })),
  };
}
