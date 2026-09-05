import { Prisma } from "../../../generated/tenant";
import { JobDto, PublicJobDto, PublicJobListItemDto } from "@hrm-plus/shared";

const jobWithRelations = Prisma.validator<Prisma.JobDefaultArgs>()({
  include: {
    department: true,
    postedBy: { include: { employee: true } },
    assessment: { select: { status: true } },
    screeningQuestions: {
      include: { question: true },
      orderBy: { sortOrder: "asc" },
    },
    _count: { select: { applications: true } },
  },
});

export type JobWithRelations = Prisma.JobGetPayload<typeof jobWithRelations>;

export const jobInclude = jobWithRelations.include;

function userDisplayName(
  user: { email: string; employee: { firstName: string; lastName: string } | null } | null
): string | null {
  if (!user) return null;
  return user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user.email;
}

export function toJobDto(job: JobWithRelations): JobDto {
  return {
    id: job.id,
    title: job.title,
    slug: job.slug,
    vacancyCount: job.vacancyCount,
    location: job.location,
    skills: (job.skills as string[]) ?? [],
    minExperienceYears: job.minExperienceYears,
    maxExperienceYears: job.maxExperienceYears,
    jobType: job.jobType as JobDto["jobType"],
    salaryType: job.salaryType as JobDto["salaryType"],
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    description: job.description,
    status: job.status as JobDto["status"],
    departmentId: job.departmentId,
    departmentName: job.department?.name ?? null,
    closesAt: job.closesAt ? job.closesAt.toISOString() : null,
    assessmentDeadlineDays: job.assessmentDeadlineDays,
    screeningQuestions: job.screeningQuestions.map((link) => ({
      id: link.id,
      questionId: link.questionId,
      isMandatory: link.isMandatory,
      sortOrder: link.sortOrder,
      questionText: link.question.text,
      questionType: link.question.type as JobDto["screeningQuestions"][number]["questionType"],
      questionOptions: (link.question.options as string[] | null) ?? null,
    })),
    hasPublishedAssessment: job.assessment?.status === "Published",
    applicationCount: job._count.applications,
    postedById: job.postedById,
    postedByName: userDisplayName(job.postedBy),
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

export function toPublicJobDto(job: JobWithRelations): PublicJobDto {
  return {
    slug: job.slug,
    title: job.title,
    vacancyCount: job.vacancyCount,
    location: job.location,
    departmentName: job.department?.name ?? null,
    closesAt: job.closesAt ? job.closesAt.toISOString() : null,
    skills: (job.skills as string[]) ?? [],
    minExperienceYears: job.minExperienceYears,
    maxExperienceYears: job.maxExperienceYears,
    jobType: job.jobType as PublicJobDto["jobType"],
    salaryType: job.salaryType as PublicJobDto["salaryType"],
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    description: job.description,
    screeningQuestions: job.screeningQuestions.map((link) => ({
      jobScreeningQuestionId: link.id,
      questionText: link.question.text,
      questionType: link.question.type as PublicJobDto["screeningQuestions"][number]["questionType"],
      questionOptions: (link.question.options as string[] | null) ?? null,
      isMandatory: link.isMandatory,
    })),
  };
}

export function toPublicJobListItem(job: JobDto): PublicJobListItemDto {
  return {
    slug: job.slug,
    title: job.title,
    jobType: job.jobType,
    departmentName: job.departmentName,
    closesAt: job.closesAt,
    location: job.location,
  };
}
