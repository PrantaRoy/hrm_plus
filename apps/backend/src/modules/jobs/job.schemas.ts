import { z } from "zod";
import { JOB_STATUSES, JOB_TYPES, SALARY_TYPES } from "@hrm-plus/shared";

const jobScreeningQuestionInputSchema = z.object({
  questionId: z.number().int(),
  isMandatory: z.boolean(),
  sortOrder: z.number().int().optional(),
});

export const createJobSchema = z.object({
  title: z.string().trim().min(1),
  vacancyCount: z.number().int().min(1).default(1),
  skills: z.array(z.string().trim().min(1)).default([]),
  minExperienceYears: z.number().int().min(0).optional(),
  maxExperienceYears: z.number().int().min(0).optional(),
  jobType: z.enum(JOB_TYPES),
  salaryType: z.enum(SALARY_TYPES),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  description: z.string().trim().min(1),
  departmentId: z.number().int().optional(),
  closesAt: z.string().min(1).optional(),
  screeningQuestions: z.array(jobScreeningQuestionInputSchema).default([]),
});

export const updateJobSchema = createJobSchema.partial().extend({
  status: z.enum(JOB_STATUSES).optional(),
});

export const listJobsQuerySchema = z.object({
  status: z.enum(JOB_STATUSES).optional(),
  departmentId: z.coerce.number().int().optional(),
});
