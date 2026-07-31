import { z } from "zod";
import { APPROVER_TYPES } from "@hrm-plus/shared";

export const approvalStepSchema = z
  .object({
    approverType: z.enum(APPROVER_TYPES),
    roleId: z.number().int().optional(),
  })
  .refine((step) => step.approverType !== "Role" || step.roleId !== undefined, {
    message: "roleId is required when approverType is 'Role'",
    path: ["roleId"],
  });

export const createLeaveAllocationSchema = z.object({
  leaveTypeId: z.coerce.number().int(),
  year: z.coerce.number().int().min(2000).max(2100),
  allocatedDays: z.number().int().min(0),
  approvalSteps: z.array(approvalStepSchema).min(1),
});

export const updateLeaveAllocationSchema = z.object({
  allocatedDays: z.number().int().min(0).optional(),
  approvalSteps: z.array(approvalStepSchema).min(1).optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});
