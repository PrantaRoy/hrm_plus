import { Prisma } from "../../../generated/tenant";
import { DocumentRequestDto } from "@hrm-plus/shared";

const requestWithRelations = Prisma.validator<Prisma.DocumentRequestDefaultArgs>()({
  include: {
    employee: true,
    template: { include: { category: true } },
    approvals: {
      include: { decidedBy: { include: { employee: true } } },
      orderBy: { stepOrder: "asc" },
    },
  },
});

export type DocumentRequestWithRelations = Prisma.DocumentRequestGetPayload<typeof requestWithRelations>;

export const documentRequestInclude = requestWithRelations.include;

function userDisplayName(
  user: { email: string; employee: { firstName: string; lastName: string } | null } | null
): string | null {
  if (!user) return null;
  return user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user.email;
}

export function toDocumentRequestDto(request: DocumentRequestWithRelations): DocumentRequestDto {
  return {
    id: request.id,
    employeeId: request.employeeId,
    employeeName: `${request.employee.firstName} ${request.employee.lastName}`,
    templateId: request.templateId,
    templateName: request.template.name,
    templateShortCode: request.template.shortCode,
    categoryCode: request.template.category.code,
    categoryName: request.template.category.name,
    reason: request.reason,
    priority: request.priority as DocumentRequestDto["priority"],
    deadlineDate: request.deadlineDate ? request.deadlineDate.toISOString() : null,
    attachmentFileUrl: request.attachmentFileUrl,
    fieldValues: (request.fieldValues as Record<string, unknown> | null) ?? null,
    status: request.status as DocumentRequestDto["status"],
    currentStepOrder: request.currentStepOrder,
    referenceNumber: request.referenceNumber,
    issuedAt: request.issuedAt ? request.issuedAt.toISOString() : null,
    approvals: request.approvals.map((approval) => ({
      id: approval.id,
      stepOrder: approval.stepOrder,
      approverType: approval.approverType as DocumentRequestDto["approvals"][number]["approverType"],
      roleId: approval.roleId,
      roleName: approval.roleName,
      status: approval.status as DocumentRequestDto["approvals"][number]["status"],
      decidedByUserId: approval.decidedByUserId,
      decidedByName: userDisplayName(approval.decidedBy),
      decidedAt: approval.decidedAt ? approval.decidedAt.toISOString() : null,
      comment: approval.comment,
    })),
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
  };
}
