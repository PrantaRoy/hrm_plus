import { PrismaClient, Prisma } from "../../../generated/tenant";
import { CreateJobInput, JobDto, JobScreeningQuestionInput, ListJobsQuery, PublicJobDto, UpdateJobInput } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { generateUniqueSlug } from "../../utils/slug";
import { jobInclude, toJobDto, toPublicJobDto } from "./job.mapper";

async function generateUniqueJobSlug(prisma: PrismaClient, title: string): Promise<string> {
  return generateUniqueSlug(title, "job", async (slug) => Boolean(await prisma.job.findUnique({ where: { slug } })));
}

async function assertScreeningQuestionsValid(prisma: PrismaClient, questions: JobScreeningQuestionInput[]) {
  if (questions.length === 0) return;
  const ids = questions.map((q) => q.questionId);
  const found = await prisma.screeningQuestion.findMany({ where: { id: { in: ids } } });
  if (found.length !== new Set(ids).size) {
    throw ApiError.badRequest("One or more screeningQuestions questionId are unknown");
  }
}

export async function listJobs(prisma: PrismaClient, query: ListJobsQuery): Promise<JobDto[]> {
  const where: Prisma.JobWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.departmentId ? { departmentId: query.departmentId } : {}),
  };
  const jobs = await prisma.job.findMany({ where, include: jobInclude, orderBy: { createdAt: "desc" } });
  return jobs.map(toJobDto);
}

export async function getJobById(prisma: PrismaClient, id: number): Promise<JobDto> {
  const job = await prisma.job.findUnique({ where: { id }, include: jobInclude });
  if (!job) {
    throw ApiError.notFound("Job not found");
  }
  return toJobDto(job);
}

export async function getPublicJobBySlug(prisma: PrismaClient, slug: string): Promise<PublicJobDto> {
  const job = await prisma.job.findUnique({ where: { slug }, include: jobInclude });
  if (!job || job.status !== "Open") {
    throw ApiError.notFound("Job not found");
  }
  return toPublicJobDto(job);
}

export async function createJob(prisma: PrismaClient, input: CreateJobInput, postedById: number): Promise<JobDto> {
  await assertScreeningQuestionsValid(prisma, input.screeningQuestions);
  const slug = await generateUniqueJobSlug(prisma, input.title);

  const job = await prisma.$transaction(async (tx) => {
    const created = await tx.job.create({
      data: {
        title: input.title,
        slug,
        vacancyCount: input.vacancyCount,
        location: input.location,
        skills: input.skills,
        minExperienceYears: input.minExperienceYears,
        maxExperienceYears: input.maxExperienceYears,
        jobType: input.jobType,
        salaryType: input.salaryType,
        salaryMin: input.salaryMin,
        salaryMax: input.salaryMax,
        description: input.description,
        departmentId: input.departmentId,
        closesAt: input.closesAt ? new Date(input.closesAt) : undefined,
        postedById,
      },
    });
    if (input.screeningQuestions.length > 0) {
      await tx.jobScreeningQuestion.createMany({
        data: input.screeningQuestions.map((q, index) => ({
          jobId: created.id,
          questionId: q.questionId,
          isMandatory: q.isMandatory,
          sortOrder: q.sortOrder ?? index,
        })),
      });
    }
    return tx.job.findUniqueOrThrow({ where: { id: created.id }, include: jobInclude });
  });

  return toJobDto(job);
}

async function getJobOrThrow(prisma: PrismaClient, id: number) {
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) {
    throw ApiError.notFound("Job not found");
  }
  return job;
}

export async function updateJob(prisma: PrismaClient, id: number, input: UpdateJobInput, updatedById: number): Promise<JobDto> {
  await getJobOrThrow(prisma, id);

  if (input.screeningQuestions !== undefined) {
    await assertScreeningQuestionsValid(prisma, input.screeningQuestions);
    const applicationCount = await prisma.application.count({ where: { jobId: id } });
    if (applicationCount > 0) {
      throw ApiError.conflict("Cannot change screening questions after applications have been received");
    }
  }

  const job = await prisma.$transaction(async (tx) => {
    await tx.job.update({
      where: { id },
      data: {
        title: input.title,
        vacancyCount: input.vacancyCount,
        location: input.location,
        skills: input.skills,
        minExperienceYears: input.minExperienceYears,
        maxExperienceYears: input.maxExperienceYears,
        jobType: input.jobType,
        salaryType: input.salaryType,
        salaryMin: input.salaryMin,
        salaryMax: input.salaryMax,
        description: input.description,
        departmentId: input.departmentId,
        closesAt: input.closesAt ? new Date(input.closesAt) : undefined,
        status: input.status,
        updatedById,
      },
    });

    if (input.screeningQuestions !== undefined) {
      await tx.jobScreeningQuestion.deleteMany({ where: { jobId: id } });
      if (input.screeningQuestions.length > 0) {
        await tx.jobScreeningQuestion.createMany({
          data: input.screeningQuestions.map((q, index) => ({
            jobId: id,
            questionId: q.questionId,
            isMandatory: q.isMandatory,
            sortOrder: q.sortOrder ?? index,
          })),
        });
      }
    }

    return tx.job.findUniqueOrThrow({ where: { id }, include: jobInclude });
  });

  return toJobDto(job);
}

export async function publishJob(prisma: PrismaClient, id: number, updatedById: number): Promise<JobDto> {
  const existing = await getJobOrThrow(prisma, id);
  if (existing.status === "Open") {
    throw ApiError.conflict("Job is already open");
  }
  const job = await prisma.job.update({ where: { id }, data: { status: "Open", updatedById }, include: jobInclude });
  return toJobDto(job);
}

export async function closeJob(prisma: PrismaClient, id: number, updatedById: number): Promise<JobDto> {
  const existing = await getJobOrThrow(prisma, id);
  if (existing.status === "Closed") {
    throw ApiError.conflict("Job is already closed");
  }
  const job = await prisma.job.update({ where: { id }, data: { status: "Closed", updatedById }, include: jobInclude });
  return toJobDto(job);
}

export async function deleteJob(prisma: PrismaClient, id: number): Promise<void> {
  const existing = await getJobOrThrow(prisma, id);
  if (existing.status !== "Draft") {
    throw ApiError.conflict("Only draft jobs can be deleted");
  }
  const applicationCount = await prisma.application.count({ where: { jobId: id } });
  if (applicationCount > 0) {
    throw ApiError.conflict("Cannot delete a job that has applications");
  }
  await prisma.$transaction([
    prisma.jobScreeningQuestion.deleteMany({ where: { jobId: id } }),
    prisma.job.delete({ where: { id } }),
  ]);
}
