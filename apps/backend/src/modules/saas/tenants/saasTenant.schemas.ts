import { z } from "zod";

const slugPattern = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

export const updateSaasTenantSchema = z.object({
  name: z.string().trim().min(1).optional(),
  companyType: z.string().trim().min(1).optional(),
  overview: z.string().trim().min(1).optional(),
  numberOfEmployees: z.number().int().positive().optional(),
  contactEmail: z.string().email().optional(),
});

export const createSaasTenantSchema = z.object({
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
  // multipart form fields arrive as strings, so "false" must not be coerced to true
  seedDemoData: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});
