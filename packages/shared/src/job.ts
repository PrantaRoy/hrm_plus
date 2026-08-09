import { ScreeningQuestionType } from "./screeningQuestion";

export const JOB_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "CASUAL"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const SALARY_TYPES = ["HOURLY", "ANNUAL"] as const;
export type SalaryType = (typeof SALARY_TYPES)[number];

export const JOB_STATUSES = ["Draft", "Open", "Closed", "Archived"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export interface JobScreeningQuestionInput {
  questionId: number;
  isMandatory: boolean;
  sortOrder?: number;
}

export interface JobScreeningQuestionDto {
  id: number;
  questionId: number;
  isMandatory: boolean;
  sortOrder: number;
  questionText: string;
  questionType: ScreeningQuestionType;
  questionOptions: string[] | null;
}

export interface JobDto {
  id: number;
  title: string;
  slug: string;
  vacancyCount: number;
  location: string | null;
  skills: string[];
  minExperienceYears: number | null;
  maxExperienceYears: number | null;
  jobType: JobType;
  salaryType: SalaryType;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  status: JobStatus;
  departmentId: number | null;
  departmentName: string | null;
  closesAt: string | null;
  screeningQuestions: JobScreeningQuestionDto[];
  hasPublishedAssessment: boolean;
  applicationCount: number;
  postedById: number;
  postedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobInput {
  title: string;
  vacancyCount: number;
  location?: string;
  skills: string[];
  minExperienceYears?: number;
  maxExperienceYears?: number;
  jobType: JobType;
  salaryType: SalaryType;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  departmentId?: number;
  closesAt?: string;
  screeningQuestions: JobScreeningQuestionInput[];
}

export type UpdateJobInput = Partial<CreateJobInput> & { status?: JobStatus };

export interface ListJobsQuery {
  status?: JobStatus;
  departmentId?: number;
}

export interface PublicJobScreeningQuestionDto {
  jobScreeningQuestionId: number;
  questionText: string;
  questionType: ScreeningQuestionType;
  questionOptions: string[] | null;
  isMandatory: boolean;
}

export interface PublicJobDto {
  slug: string;
  title: string;
  vacancyCount: number;
  location: string | null;
  departmentName: string | null;
  closesAt: string | null;
  skills: string[];
  minExperienceYears: number | null;
  maxExperienceYears: number | null;
  jobType: JobType;
  salaryType: SalaryType;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  screeningQuestions: PublicJobScreeningQuestionDto[];
}

export interface PublicJobListItemDto {
  slug: string;
  title: string;
  jobType: JobType;
  departmentName: string | null;
  closesAt: string | null;
  location: string | null;
}
