import { Prisma } from "../../../generated/tenant";
import { ApplicationDto } from "@hrm-plus/shared";

const applicationWithRelations = Prisma.validator<Prisma.ApplicationDefaultArgs>()({
  include: {
    job: true,
    candidate: true,
    assessmentInvitation: true,
    answers: {
      include: { jobScreeningQuestion: { include: { question: true } } },
    },
  },
});

export type ApplicationWithRelations = Prisma.ApplicationGetPayload<typeof applicationWithRelations>;

export const applicationInclude = applicationWithRelations.include;

export function toApplicationDto(application: ApplicationWithRelations): ApplicationDto {
  return {
    id: application.id,
    jobId: application.jobId,
    jobTitle: application.job.title,
    candidateId: application.candidateId,
    candidateName: application.candidate.fullName,
    candidateEmail: application.candidate.email,
    candidatePhoneNumber: application.candidate.phoneNumber,
    resumeFileUrl: application.resumeFileUrl,
    coverLetter: application.coverLetter,
    stage: application.stage as ApplicationDto["stage"],
    movedToStageAt: application.movedToStageAt.toISOString(),
    withdrawnAt: application.withdrawnAt ? application.withdrawnAt.toISOString() : null,
    rejectionReason: application.rejectionReason,
    assessmentOutcome: application.assessmentInvitation
      ? (application.assessmentInvitation.outcome as ApplicationDto["assessmentOutcome"])
      : null,
    assessmentInvitationStatus: application.assessmentInvitation
      ? (application.assessmentInvitation.status as ApplicationDto["assessmentInvitationStatus"])
      : null,
    answers: application.answers.map((answer) => ({
      jobScreeningQuestionId: answer.jobScreeningQuestionId,
      questionText: answer.jobScreeningQuestion.question.text,
      answerText: answer.answerText,
      answerOptions: (answer.answerOptions as string[] | null) ?? null,
    })),
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  };
}
