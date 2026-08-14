import { PrismaClient, Prisma } from "../../../generated/tenant";
import { CreateDocumentRequestInput, DocumentRequestDto, PaginatedResult } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { getStorageDriver } from "../../storage";
import { logger } from "../../logger";
import { env } from "../../config/env";
import {
  sendDocumentApprovedEmail,
  sendDocumentIssuedEmail,
  sendDocumentRejectedEmail,
  sendDocumentStepPendingEmail,
} from "../notifications/email.service";
import { DocumentRequestWithRelations, documentRequestInclude, toDocumentRequestDto } from "./documentRequest.mapper";
import { TenantContext, renderAndStoreFinalDocument, renderPreviewPdf } from "./documentRequest.render";

export interface ActingUser {
  id: number;
  role: string;
}

interface ApprovalStepLike {
  approverType: string;
  roleName: string | null;
}

function isEligibleForStep(
  actingUserRole: string,
  actingEmployeeId: number | null,
  applicantEmployeeId: number,
  applicantReportingToId: number | null,
  step: ApprovalStepLike
): boolean {
  if (actingUserRole === "Admin") return true;
  if (step.approverType === "Self") {
    return actingEmployeeId != null && actingEmployeeId === applicantEmployeeId;
  }
  if (step.approverType === "ReportingManager") {
    return actingEmployeeId != null && applicantReportingToId === actingEmployeeId;
  }
  if (step.approverType === "Role") {
    return actingUserRole === step.roleName;
  }
  return false;
}

async function resolveActingEmployee(prisma: PrismaClient, userId: number) {
  return prisma.employee.findUnique({ where: { userId } });
}

/**
 * Resolves who should be emailed for a given step: the applicant's reporting manager
 * (their Employee.email) for a "ReportingManager" step, or every User currently
 * holding the configured role for a "Role" step. Best-effort — an unresolvable step
 * (e.g. a Role step with nobody assigned) just yields no recipients.
 */
async function resolveApproverEmails(
  prisma: PrismaClient,
  step: { approverType: string; roleId: number | null },
  applicant: { email: string; reportingToId: number | null }
): Promise<string[]> {
  if (step.approverType === "Self") {
    return [applicant.email];
  }
  if (step.approverType === "ReportingManager") {
    if (!applicant.reportingToId) return [];
    const manager = await prisma.employee.findUnique({ where: { id: applicant.reportingToId } });
    return manager ? [manager.email] : [];
  }
  if (step.approverType === "Role" && step.roleId) {
    const users = await prisma.user.findMany({ where: { roleId: step.roleId }, select: { email: true } });
    return users.map((u) => u.email);
  }
  return [];
}

export async function resolveEmployeeForUser(prisma: PrismaClient, userId: number) {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) {
    throw ApiError.notFound("No employee profile linked to this account");
  }
  return employee;
}

export interface ListMyDocumentRequestsOptions {
  status?: string;
}

export async function listMyDocumentRequests(
  prisma: PrismaClient,
  employeeId: number,
  options: ListMyDocumentRequestsOptions
): Promise<DocumentRequestDto[]> {
  const requests = await prisma.documentRequest.findMany({
    where: { employeeId, ...(options.status ? { status: options.status } : {}) },
    include: documentRequestInclude,
    orderBy: { createdAt: "desc" },
  });
  return requests.map(toDocumentRequestDto);
}

export async function listPendingMyApproval(
  prisma: PrismaClient,
  actingUser: ActingUser
): Promise<DocumentRequestDto[]> {
  const actingEmployee = await resolveActingEmployee(prisma, actingUser.id);
  const pending = await prisma.documentRequest.findMany({
    where: { status: "Pending" },
    include: documentRequestInclude,
    orderBy: { createdAt: "asc" },
  });

  const eligible = pending.filter((request) => {
    const currentApproval = request.approvals.find((a) => a.stepOrder === request.currentStepOrder);
    if (!currentApproval || currentApproval.status !== "Pending") return false;
    return isEligibleForStep(
      actingUser.role,
      actingEmployee?.id ?? null,
      request.employeeId,
      request.employee.reportingToId,
      currentApproval
    );
  });

  return eligible.map(toDocumentRequestDto);
}

export interface ListDocumentRequestsOptions {
  page: number;
  pageSize: number;
  status?: string;
  employeeId?: number;
  templateId?: number;
  categoryId?: number;
}

export async function listDocumentRequests(
  prisma: PrismaClient,
  options: ListDocumentRequestsOptions
): Promise<PaginatedResult<DocumentRequestDto>> {
  const where: Prisma.DocumentRequestWhereInput = {
    ...(options.status ? { status: options.status } : {}),
    ...(options.employeeId ? { employeeId: options.employeeId } : {}),
    ...(options.templateId ? { templateId: options.templateId } : {}),
    ...(options.categoryId ? { template: { categoryId: options.categoryId } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.documentRequest.findMany({
      where,
      include: documentRequestInclude,
      orderBy: { createdAt: "desc" },
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    }),
    prisma.documentRequest.count({ where }),
  ]);

  return {
    items: items.map(toDocumentRequestDto),
    total,
    page: options.page,
    pageSize: options.pageSize,
  };
}

async function getRequestWithAccessCheck(
  prisma: PrismaClient,
  id: number,
  actingUser: ActingUser
): Promise<DocumentRequestWithRelations> {
  const request = await prisma.documentRequest.findUnique({ where: { id }, include: documentRequestInclude });
  if (!request) {
    throw ApiError.notFound("Document request not found");
  }

  if (actingUser.role === "Admin" || actingUser.role === "HR") {
    return request;
  }

  const actingEmployee = await resolveActingEmployee(prisma, actingUser.id);
  if (actingEmployee && request.employeeId === actingEmployee.id) {
    return request;
  }

  const isApprover = request.approvals.some((approval) =>
    isEligibleForStep(
      actingUser.role,
      actingEmployee?.id ?? null,
      request.employeeId,
      request.employee.reportingToId,
      approval
    )
  );
  if (!isApprover) {
    throw ApiError.forbidden("Not authorized to view this document request");
  }

  return request;
}

export async function getDocumentRequestById(
  prisma: PrismaClient,
  id: number,
  actingUser: ActingUser
): Promise<DocumentRequestDto> {
  const request = await getRequestWithAccessCheck(prisma, id, actingUser);
  return toDocumentRequestDto(request);
}

export interface AttachmentFile {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

export async function createDocumentRequest(
  prisma: PrismaClient,
  employeeId: number,
  input: CreateDocumentRequestInput,
  createdById: number,
  actingUser: ActingUser,
  attachment?: AttachmentFile
): Promise<DocumentRequestDto> {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    throw ApiError.notFound("Employee not found");
  }

  const template = await prisma.documentTemplate.findUnique({
    where: { id: input.templateId },
    include: { approvalSteps: { include: { role: true }, orderBy: { stepOrder: "asc" } } },
  });
  if (!template || template.status !== "Active") {
    throw ApiError.badRequest("Unknown or inactive document template");
  }
  const isPrivileged = actingUser.role === "Admin" || actingUser.role === "HR";
  if (!template.isStaffRequestable && !isPrivileged) {
    throw ApiError.forbidden("This document template is not self-requestable");
  }
  if (template.approvalSteps.length === 0) {
    throw ApiError.conflict("This template has no approval chain configured");
  }
  for (const step of template.approvalSteps) {
    if (step.approverType === "ReportingManager" && !employee.reportingToId) {
      throw ApiError.badRequest("Employee has no reporting manager configured; cannot use this approval chain");
    }
  }

  let attachmentFileUrl: string | undefined;
  let attachmentFileKey: string | undefined;
  if (attachment) {
    const stored = await getStorageDriver().save({
      buffer: attachment.buffer,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      folder: "document-request-attachments",
    });
    attachmentFileUrl = stored.url;
    attachmentFileKey = stored.key;
  }

  const request = await prisma.$transaction(async (tx) => {
    const created = await tx.documentRequest.create({
      data: {
        employeeId,
        templateId: template.id,
        reason: input.reason ?? null,
        priority: input.priority ?? "Medium",
        deadlineDate: input.deadlineDate ? new Date(input.deadlineDate) : null,
        attachmentFileUrl,
        attachmentFileKey,
        createdById,
      },
    });

    await tx.documentRequestApproval.createMany({
      data: template.approvalSteps.map((step) => ({
        documentRequestId: created.id,
        stepOrder: step.stepOrder,
        approverType: step.approverType,
        roleId: step.roleId,
        roleName: step.role?.name ?? null,
      })),
    });

    return tx.documentRequest.findUniqueOrThrow({ where: { id: created.id }, include: documentRequestInclude });
  });

  const firstStep = template.approvalSteps.find((s) => s.stepOrder === 1);
  if (firstStep) {
    notifyApprovers(prisma, firstStep, template.name, employee).catch((err) =>
      logger.warn({ err }, "Failed to send document request notification email")
    );
  }

  return toDocumentRequestDto(request);
}

async function notifyApprovers(
  prisma: PrismaClient,
  step: { approverType: string; roleId: number | null },
  documentTypeName: string,
  requester: { id: number; firstName: string; lastName: string; email: string; reportingToId: number | null }
): Promise<void> {
  const emails = await resolveApproverEmails(prisma, step, requester);
  await Promise.all(
    emails.map((email) =>
      sendDocumentStepPendingEmail(email, documentTypeName, `${requester.firstName} ${requester.lastName}`)
    )
  );
}

/**
 * Renders the final unwatermarked PDF (signatures + QR + reference number) and moves
 * the request from "Approved" to "Issued". If rendering throws, the request is left
 * at "Approved" (not lost, not stuck "Pending") — POST /:id/retry-issue can call this
 * again without re-running the approval chain.
 */
async function finalizeDocumentRequest(prisma: PrismaClient, tenant: TenantContext, requestId: number): Promise<void> {
  const { referenceNumber, fileUrl, fileKey } = await renderAndStoreFinalDocument(prisma, tenant, requestId);
  await prisma.documentRequest.update({
    where: { id: requestId },
    data: {
      status: "Issued",
      referenceNumber,
      finalFileUrl: fileUrl,
      finalFileKey: fileKey,
      issuedAt: new Date(),
    },
  });
}

export type DocumentRequestDecision = "Approve" | "Reject";

export async function decideDocumentRequest(
  prisma: PrismaClient,
  tenant: TenantContext,
  requestId: number,
  decision: DocumentRequestDecision,
  actingUser: ActingUser,
  comment: string | undefined
): Promise<DocumentRequestDto> {
  const request = await prisma.documentRequest.findUnique({
    where: { id: requestId },
    include: { approvals: { orderBy: { stepOrder: "asc" } }, employee: true, template: true },
  });
  if (!request) {
    throw ApiError.notFound("Document request not found");
  }
  if (request.status !== "Pending") {
    throw ApiError.conflict("This request is no longer pending");
  }

  const currentApproval = request.approvals.find((a) => a.stepOrder === request.currentStepOrder);
  if (!currentApproval) {
    throw ApiError.conflict("Document request has no pending approval step");
  }
  if (currentApproval.status !== "Pending") {
    throw ApiError.conflict("This step was already decided");
  }

  const actingEmployee = await resolveActingEmployee(prisma, actingUser.id);
  const eligible = isEligibleForStep(
    actingUser.role,
    actingEmployee?.id ?? null,
    request.employeeId,
    request.employee.reportingToId,
    currentApproval
  );
  if (!eligible) {
    throw ApiError.forbidden("You are not an approver for the current step");
  }

  const { becameFullyApproved } = await prisma.$transaction(async (tx) => {
    await tx.documentRequestApproval.update({
      where: { id: currentApproval.id },
      data: {
        status: decision === "Approve" ? "Approved" : "Rejected",
        decidedByUserId: actingUser.id,
        decidedAt: new Date(),
        comment: comment ?? null,
      },
    });

    if (decision === "Reject") {
      await tx.documentRequest.update({ where: { id: requestId }, data: { status: "Rejected" } });
      return { becameFullyApproved: false };
    }

    const nextStep = request.approvals.find((a) => a.stepOrder === currentApproval.stepOrder + 1);
    if (nextStep) {
      await tx.documentRequest.update({ where: { id: requestId }, data: { currentStepOrder: nextStep.stepOrder } });
      return { becameFullyApproved: false };
    }

    await tx.documentRequest.update({ where: { id: requestId }, data: { status: "Approved" } });
    return { becameFullyApproved: true };
  });

  let issuedSuccessfully = false;
  if (becameFullyApproved) {
    // Rendering the final PDF shouldn't hold the DB transaction open.
    issuedSuccessfully = await finalizeDocumentRequest(prisma, tenant, requestId)
      .then(() => true)
      .catch((err) => {
        logger.error({ err, requestId }, "Failed to finalize document request after final approval");
        return false;
      });
  }

  const updated = await prisma.documentRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: documentRequestInclude,
  });

  const nextStep = request.approvals.find((a) => a.stepOrder === currentApproval.stepOrder + 1);
  notifyDecisionOutcome(prisma, request, decision, becameFullyApproved, issuedSuccessfully, comment, nextStep).catch(
    (err) => logger.warn({ err }, "Failed to send document decision notification email")
  );

  return toDocumentRequestDto(updated);
}

async function notifyDecisionOutcome(
  prisma: PrismaClient,
  request: {
    employee: { id: number; firstName: string; lastName: string; email: string; reportingToId: number | null };
    template: { name: string };
  },
  decision: DocumentRequestDecision,
  becameFullyApproved: boolean,
  issuedSuccessfully: boolean,
  comment: string | undefined,
  nextStep: { approverType: string; roleId: number | null } | undefined
): Promise<void> {
  const requesterEmail = request.employee.email;
  const documentTypeName = request.template.name;

  if (decision === "Reject") {
    await sendDocumentRejectedEmail(requesterEmail, documentTypeName, comment);
    return;
  }

  if (becameFullyApproved) {
    if (issuedSuccessfully) {
      await sendDocumentIssuedEmail(requesterEmail, documentTypeName, `${env.FRONTEND_BASE_URL}/documents/my-requests`);
    }
    return;
  }

  await sendDocumentApprovedEmail(requesterEmail, documentTypeName);
  if (nextStep) {
    await notifyApprovers(prisma, nextStep, documentTypeName, request.employee);
  }
}

export async function retryIssueDocumentRequest(
  prisma: PrismaClient,
  tenant: TenantContext,
  requestId: number
): Promise<DocumentRequestDto> {
  const request = await prisma.documentRequest.findUnique({ where: { id: requestId } });
  if (!request) {
    throw ApiError.notFound("Document request not found");
  }
  if (request.status !== "Approved") {
    throw ApiError.conflict("Only fully-approved requests awaiting issuance can be retried");
  }

  await finalizeDocumentRequest(prisma, tenant, requestId);

  const updated = await prisma.documentRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: documentRequestInclude,
  });
  return toDocumentRequestDto(updated);
}

export async function generatePreviewPdf(
  prisma: PrismaClient,
  tenant: TenantContext,
  requestId: number,
  actingUser: ActingUser
): Promise<Buffer> {
  await getRequestWithAccessCheck(prisma, requestId, actingUser);
  return renderPreviewPdf(prisma, tenant, requestId);
}

export async function getFinalDocumentUrl(
  prisma: PrismaClient,
  requestId: number,
  actingUser: ActingUser
): Promise<string> {
  const request = await getRequestWithAccessCheck(prisma, requestId, actingUser);
  if (request.status !== "Issued" || !request.finalFileUrl) {
    throw ApiError.conflict("This document has not been issued yet");
  }
  return request.finalFileUrl;
}

export async function updateFieldValues(
  prisma: PrismaClient,
  requestId: number,
  values: Record<string, unknown>
): Promise<DocumentRequestDto> {
  const request = await prisma.documentRequest.findUnique({ where: { id: requestId } });
  if (!request) {
    throw ApiError.notFound("Document request not found");
  }
  if (request.status !== "Pending") {
    throw ApiError.conflict("Field values can only be updated while the request is pending");
  }

  const merged = { ...(request.fieldValues as Record<string, unknown> | null), ...values };
  const updated = await prisma.documentRequest.update({
    where: { id: requestId },
    data: { fieldValues: merged as Prisma.InputJsonValue },
    include: documentRequestInclude,
  });
  return toDocumentRequestDto(updated);
}

export async function cancelDocumentRequest(
  prisma: PrismaClient,
  requestId: number,
  actingUser: ActingUser
): Promise<DocumentRequestDto> {
  const request = await prisma.documentRequest.findUnique({ where: { id: requestId }, include: { employee: true } });
  if (!request) {
    throw ApiError.notFound("Document request not found");
  }
  if (request.status !== "Pending") {
    throw ApiError.conflict("Only pending requests can be cancelled");
  }

  const isOwner = request.employee.userId === actingUser.id;
  const isAdminOrHr = actingUser.role === "Admin" || actingUser.role === "HR";
  if (!isOwner && !isAdminOrHr) {
    throw ApiError.forbidden("Not authorized to cancel this request");
  }

  const updated = await prisma.documentRequest.update({
    where: { id: requestId },
    data: { status: "Cancelled" },
    include: documentRequestInclude,
  });
  return toDocumentRequestDto(updated);
}
