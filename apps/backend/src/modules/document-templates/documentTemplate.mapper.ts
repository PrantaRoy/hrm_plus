import { Prisma } from "../../../generated/tenant";
import { DocumentCategoryDto, DocumentTemplateDto } from "@hrm-plus/shared";

const templateWithRelations = Prisma.validator<Prisma.DocumentTemplateDefaultArgs>()({
  include: {
    category: true,
    approvalSteps: {
      include: { role: true },
      orderBy: { stepOrder: "asc" },
    },
  },
});

export type TemplateWithRelations = Prisma.DocumentTemplateGetPayload<typeof templateWithRelations>;

export const templateInclude = templateWithRelations.include;

export function toDocumentTemplateDto(template: TemplateWithRelations): DocumentTemplateDto {
  return {
    id: template.id,
    shortCode: template.shortCode,
    name: template.name,
    categoryId: template.categoryId,
    categoryCode: template.category.code,
    categoryName: template.category.name,
    bodyHtml: template.bodyHtml,
    isStaffRequestable: template.isStaffRequestable,
    status: template.status as DocumentTemplateDto["status"],
    approvalSteps: template.approvalSteps.map((step) => ({
      id: step.id,
      stepOrder: step.stepOrder,
      approverType: step.approverType as DocumentTemplateDto["approvalSteps"][number]["approverType"],
      roleId: step.roleId,
      roleName: step.role?.name ?? null,
    })),
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

export function toDocumentCategoryDto(category: {
  id: number;
  code: string;
  name: string;
  status: string;
}): DocumentCategoryDto {
  return {
    id: category.id,
    code: category.code,
    name: category.name,
    status: category.status as DocumentCategoryDto["status"],
  };
}
