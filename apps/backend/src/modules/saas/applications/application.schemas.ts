import { z } from "zod";

const slugPattern = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

export const submitApplicationSchema = z.object({
  companyName: z.string().trim().min(1),
  companyType: z.string().trim().min(1),
  overview: z.string().trim().min(1),
  numberOfEmployees: z.coerce.number().int().positive(),
  contactEmail: z.string().email(),
  subdomainSlug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(63)
    .regex(slugPattern, "Use lowercase letters, numbers, and hyphens only"),
  packageId: z.coerce.number().int().positive(),
});

export const updateApplicationSchema = z.object({
  companyName: z.string().trim().min(1).optional(),
  companyType: z.string().trim().min(1).optional(),
  overview: z.string().trim().min(1).optional(),
  numberOfEmployees: z.coerce.number().int().positive().optional(),
  contactEmail: z.string().email().optional(),
  packageId: z.coerce.number().int().positive().optional(),
});

export const reviewApplicationSchema = z.object({
  reviewNote: z.string().trim().optional(),
});

export const listApplicationsQuerySchema = z.object({
  status: z.enum(["Pending", "Approved", "Rejected"]).optional(),
});
