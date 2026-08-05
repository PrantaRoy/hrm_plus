import { PrismaClient, Prisma } from "../../../generated/tenant";
import {
  CreateDocumentTemplateInput,
  DocumentCategoryDto,
  DocumentTemplateApprovalStepInput,
  DocumentTemplateDto,
  UpdateDocumentTemplateInput,
} from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { templateInclude, toDocumentCategoryDto, toDocumentTemplateDto } from "./documentTemplate.mapper";

export interface ActingUser {
  id: number;
  role: string;
}

const STAFF_VISIBLE_ROLES = new Set(["Admin", "HR"]);

async function assertApprovalStepsValid(prisma: PrismaClient, steps: DocumentTemplateApprovalStepInput[]) {
  const roleIds = steps.filter((s) => s.approverType === "Role").map((s) => s.roleId!);
  if (roleIds.length === 0) return;
  const roles = await prisma.role.findMany({ where: { id: { in: roleIds } } });
  if (roles.length !== new Set(roleIds).size) {
    throw ApiError.badRequest("One or more approval step roleIds are unknown");
  }
}

async function assertCategoryActive(prisma: PrismaClient, categoryId: number) {
  const category = await prisma.documentCategory.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw ApiError.badRequest("Unknown categoryId");
  }
  if (category.status !== "Active") {
    throw ApiError.badRequest("Cannot create a template under an inactive category");
  }
}

export async function listDocumentCategories(prisma: PrismaClient): Promise<DocumentCategoryDto[]> {
  const categories = await prisma.documentCategory.findMany({ orderBy: { name: "asc" } });
  return categories.map(toDocumentCategoryDto);
}

export interface ListDocumentTemplatesOptions {
  categoryId?: number;
  status?: string;
}

export async function listDocumentTemplates(
  prisma: PrismaClient,
  actingUser: ActingUser,
  options: ListDocumentTemplatesOptions
): Promise<DocumentTemplateDto[]> {
  const isPrivileged = STAFF_VISIBLE_ROLES.has(actingUser.role);
  const where: Prisma.DocumentTemplateWhereInput = {
    ...(options.categoryId ? { categoryId: options.categoryId } : {}),
    ...(isPrivileged
      ? options.status
        ? { status: options.status }
        : {}
      : { status: "Active", isStaffRequestable: true }),
  };

  const templates = await prisma.documentTemplate.findMany({
    where,
    include: templateInclude,
    orderBy: { name: "asc" },
  });
  return templates.map(toDocumentTemplateDto);
}

export async function getDocumentTemplateById(
  prisma: PrismaClient,
  id: number,
  actingUser: ActingUser
): Promise<DocumentTemplateDto> {
  const template = await prisma.documentTemplate.findUnique({ where: { id }, include: templateInclude });
  if (!template) {
    throw ApiError.notFound("Document template not found");
  }

  const isPrivileged = STAFF_VISIBLE_ROLES.has(actingUser.role);
  if (!isPrivileged && (template.status !== "Active" || !template.isStaffRequestable)) {
    throw ApiError.forbidden("Not authorized to view this document template");
  }

  return toDocumentTemplateDto(template);
}

export async function createDocumentTemplate(
  prisma: PrismaClient,
  input: CreateDocumentTemplateInput,
  createdById: number
): Promise<DocumentTemplateDto> {
  await assertCategoryActive(prisma, input.categoryId);
  await assertApprovalStepsValid(prisma, input.approvalSteps);

  try {
    const template = await prisma.$transaction(async (tx) => {
      const created = await tx.documentTemplate.create({
        data: {
          shortCode: input.shortCode,
          name: input.name,
          categoryId: input.categoryId,
          bodyHtml: input.bodyHtml,
          isStaffRequestable: input.isStaffRequestable ?? false,
          createdById,
        },
      });
      await tx.documentTemplateApprovalStep.createMany({
        data: input.approvalSteps.map((step, index) => ({
          templateId: created.id,
          stepOrder: index + 1,
          approverType: step.approverType,
          roleId: step.approverType === "Role" ? step.roleId! : null,
        })),
      });
      return tx.documentTemplate.findUniqueOrThrow({ where: { id: created.id }, include: templateInclude });
    });
    return toDocumentTemplateDto(template);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw ApiError.conflict("A document template with this shortCode already exists");
    }
    throw err;
  }
}

async function getTemplateOrThrow(prisma: PrismaClient, id: number) {
  const template = await prisma.documentTemplate.findUnique({ where: { id } });
  if (!template) {
    throw ApiError.notFound("Document template not found");
  }
  return template;
}

export async function updateDocumentTemplate(
  prisma: PrismaClient,
  id: number,
  input: UpdateDocumentTemplateInput,
  updatedById: number
): Promise<DocumentTemplateDto> {
  await getTemplateOrThrow(prisma, id);

  if (input.approvalSteps !== undefined) {
    await assertApprovalStepsValid(prisma, input.approvalSteps);
    const pendingCount = await prisma.documentRequest.count({ where: { templateId: id, status: "Pending" } });
    if (pendingCount > 0) {
      throw ApiError.conflict("Cannot change the approval chain while a request against this template is pending");
    }
  }

  const template = await prisma.$transaction(async (tx) => {
    await tx.documentTemplate.update({
      where: { id },
      data: {
        name: input.name,
        bodyHtml: input.bodyHtml,
        isStaffRequestable: input.isStaffRequestable,
        status: input.status,
        updatedById,
      },
    });

    if (input.approvalSteps !== undefined) {
      await tx.documentTemplateApprovalStep.deleteMany({ where: { templateId: id } });
      await tx.documentTemplateApprovalStep.createMany({
        data: input.approvalSteps.map((step, index) => ({
          templateId: id,
          stepOrder: index + 1,
          approverType: step.approverType,
          roleId: step.approverType === "Role" ? step.roleId! : null,
        })),
      });
    }

    return tx.documentTemplate.findUniqueOrThrow({ where: { id }, include: templateInclude });
  });

  return toDocumentTemplateDto(template);
}

export async function disableDocumentTemplate(prisma: PrismaClient, id: number, updatedById: number): Promise<void> {
  await getTemplateOrThrow(prisma, id);
  await prisma.documentTemplate.update({ where: { id }, data: { status: "Inactive", updatedById } });
}
