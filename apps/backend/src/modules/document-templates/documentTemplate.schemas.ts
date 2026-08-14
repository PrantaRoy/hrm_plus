import { z } from "zod";
import { DOCUMENT_APPROVER_TYPES } from "@hrm-plus/shared";

export const documentApprovalStepSchema = z
  .object({
    approverType: z.enum(DOCUMENT_APPROVER_TYPES),
    roleId: z.number().int().optional(),
  })
  .refine((step) => step.approverType !== "Role" || step.roleId !== undefined, {
    message: "roleId is required when approverType is 'Role'",
    path: ["roleId"],
  });

export const createDocumentTemplateSchema = z.object({
  shortCode: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[A-Z0-9_]+$/, "shortCode must be UPPER_SNAKE_CASE (letters, digits, underscore)"),
  name: z.string().trim().min(1),
  categoryId: z.coerce.number().int(),
  bodyHtml: z.string().min(1),
  isStaffRequestable: z.boolean().optional(),
  approvalSteps: z.array(documentApprovalStepSchema).min(1),
});

export const updateDocumentTemplateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  bodyHtml: z.string().min(1).optional(),
  isStaffRequestable: z.boolean().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
  approvalSteps: z.array(documentApprovalStepSchema).min(1).optional(),
});

export const listDocumentTemplatesQuerySchema = z.object({
  categoryId: z.coerce.number().int().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});
