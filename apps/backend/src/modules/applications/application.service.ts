import { PrismaClient, Prisma } from "../../../generated/tenant";
import { ApplicationDto, ListApplicationsQuery, SubmitJobApplicationInput } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { getStorageDriver } from "../../storage";
import { logger } from "../../logger";
import { env } from "../../config/env";
import { sendApplicationReceivedEmail } from "../notifications/email.service";
import { applicationInclude, toApplicationDto } from "./application.mapper";
import { findOrCreateCandidate } from "./candidate.repository";
import { issueOrRefreshToken } from "../candidate-portal/candidatePortal.service";

export interface ResumeFile {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

function assertMandatoryAnswersProvided(
  screeningQuestions: Array<{ id: number; isMandatory: boolean }>,
  answers: SubmitJobApplicationInput["answers"]
) {
  const answeredIds = new Set(answers.map((a) => a.jobScreeningQuestionId));
  for (const question of screeningQuestions) {
    if (question.isMandatory && !answeredIds.has(question.id)) {
      throw ApiError.badRequest("An answer is required for one or more mandatory screening questions");
    }
  }
}

export async function submitApplication(
  prisma: PrismaClient,
  jobSlug: string,
  input: SubmitJobApplicationInput,
  resumeFile: ResumeFile | undefined,
  tenantSlug: string
): Promise<ApplicationDto> {
  const job = await prisma.job.findUnique({
    where: { slug: jobSlug },
    include: { screeningQuestions: true },
  });
  if (!job || job.status !== "Open") {
    throw ApiError.notFound("Job not found");
  }

  assertMandatoryAnswersProvided(job.screeningQuestions, input.answers);

  const candidate = await findOrCreateCandidate(prisma, {
    fullName: input.fullName,
    email: input.email,
    phoneNumber: input.phoneNumber,
  });

  let resumeFileUrl: string | undefined;
  let resumeFileKey: string | undefined;
  if (resumeFile) {
    const stored = await getStorageDriver().save({
      buffer: resumeFile.buffer,
      originalName: resumeFile.originalName,
      mimeType: resumeFile.mimeType,
      folder: "resumes",
    });
    resumeFileUrl = stored.url;
    resumeFileKey = stored.key;
  }

  let applicationId: number;
  try {
    applicationId = await prisma.$transaction(async (tx) => {
      const application = await tx.application.create({
        data: {
          jobId: job.id,
          candidateId: candidate.id,
          resumeFileUrl,
          resumeFileKey,
          coverLetter: input.coverLetter,
        },
      });

      if (input.answers.length > 0) {
        await tx.applicationAnswer.createMany({
          data: input.answers.map((answer) => ({
            applicationId: application.id,
            jobScreeningQuestionId: answer.jobScreeningQuestionId,
            answerText: answer.answerText,
            answerOptions: answer.answerOptions ?? undefined,
          })),
        });
      }

      await tx.applicationStageHistory.create({
        data: { applicationId: application.id, toStage: "APPLICATION_RECEIVED", movedByType: "System" },
      });

      return application.id;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw ApiError.conflict("You have already applied to this job");
    }
    throw err;
  }

  try {
    const token = await issueOrRefreshToken(prisma, applicationId, "PORTAL");
    const portalUrl = `${env.FRONTEND_BASE_URL}/candidate/${tenantSlug}/portal?token=${token}`;
    await sendApplicationReceivedEmail(candidate.email, candidate.fullName, job.title, portalUrl);
  } catch (err) {
    logger.error({ applicationId, err }, "Failed to send application-received email");
  }

  const application = await prisma.application.findUniqueOrThrow({ where: { id: applicationId }, include: applicationInclude });
  return toApplicationDto(application);
}

export async function listApplications(prisma: PrismaClient, query: ListApplicationsQuery): Promise<ApplicationDto[]> {
  const where: Prisma.ApplicationWhereInput = {
    ...(query.jobId ? { jobId: query.jobId } : {}),
    ...(query.stage ? { stage: query.stage } : {}),
  };
  const applications = await prisma.application.findMany({ where, include: applicationInclude, orderBy: { createdAt: "desc" } });
  return applications.map(toApplicationDto);
}

export async function getApplicationById(prisma: PrismaClient, id: number): Promise<ApplicationDto> {
  const application = await prisma.application.findUnique({ where: { id }, include: applicationInclude });
  if (!application) {
    throw ApiError.notFound("Application not found");
  }
  return toApplicationDto(application);
}
