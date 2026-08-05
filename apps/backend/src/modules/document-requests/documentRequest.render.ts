import { nanoid } from "nanoid";
import { PrismaClient, Prisma } from "../../../generated/tenant";
import { controlClient } from "../../db/controlClient";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import { getStorageDriver } from "../../storage";
import { renderTemplate } from "../../pdf/templateEngine";
import { injectSignatures } from "../../pdf/signaturePlaceholders";
import { injectWatermark } from "../../pdf/watermark";
import { generateQrCodeDataUri } from "../../pdf/qrCode";
import { renderHtmlToPdfBuffer } from "../../pdf/renderer";

export interface TenantContext {
  id: number;
  slug: string;
}

const requestForRenderInclude = Prisma.validator<Prisma.DocumentRequestDefaultArgs>()({
  include: {
    employee: { include: { department: true, designation: true } },
    template: true,
    approvals: { orderBy: { stepOrder: "asc" } },
  },
});
type RequestForRender = Prisma.DocumentRequestGetPayload<typeof requestForRenderInclude>;
const requestForRenderIncludeArg = requestForRenderInclude.include;

async function buildRenderContext(
  tenant: TenantContext,
  request: RequestForRender,
  referenceNumber: string | null
): Promise<Record<string, unknown>> {
  const company = await controlClient.tenant.findUnique({ where: { id: tenant.id } });

  return {
    employee: {
      firstName: request.employee.firstName,
      lastName: request.employee.lastName,
      fullName: `${request.employee.firstName} ${request.employee.lastName}`,
      employeeCode: request.employee.employeeCode,
      jobTitle: request.employee.jobTitle ?? "",
      email: request.employee.email,
      department: request.employee.department?.name ?? "",
      designation: request.employee.designation?.name ?? "",
      joiningDate: request.employee.joiningDate.toISOString().slice(0, 10),
    },
    company: {
      name: company?.name ?? "",
      logoUrl: company?.companyLogoUrl ?? "",
    },
    request: {
      reason: request.reason ?? "",
      priority: request.priority,
      deadlineDate: request.deadlineDate ? request.deadlineDate.toISOString().slice(0, 10) : "",
    },
    fieldValues: (request.fieldValues as Record<string, unknown> | null) ?? {},
    referenceNumber: referenceNumber ?? "",
    currentDate: new Date().toISOString().slice(0, 10),
  };
}

async function renderApprovedSignatures(prisma: PrismaClient, request: RequestForRender, html: string) {
  const decidedApprovals = request.approvals.filter((a) => a.status === "Approved" && a.decidedByUserId);
  const decidingUsers = await prisma.user.findMany({
    where: { id: { in: decidedApprovals.map((a) => a.decidedByUserId!) } },
    select: { id: true, signatureImageKey: true },
  });
  const signatureKeyByUserId = new Map(decidingUsers.map((u) => [u.id, u.signatureImageKey]));

  return injectSignatures(
    html,
    decidedApprovals.map((a) => ({
      approverType: a.approverType,
      roleName: a.roleName,
      signatureImageKey: signatureKeyByUserId.get(a.decidedByUserId!) ?? null,
    }))
  );
}

async function loadRequestForRender(prisma: PrismaClient, requestId: number): Promise<RequestForRender> {
  const request = await prisma.documentRequest.findUnique({
    where: { id: requestId },
    include: requestForRenderIncludeArg,
  });
  if (!request) {
    throw ApiError.notFound("Document request not found");
  }
  return request;
}

/**
 * Renders the live template with a "DEMO PREVIEW" watermark. Not persisted to
 * storage — regenerated fresh on every call so it always reflects the current
 * template body and any field values HR has entered so far.
 */
export async function renderPreviewPdf(prisma: PrismaClient, tenant: TenantContext, requestId: number): Promise<Buffer> {
  const request = await loadRequestForRender(prisma, requestId);
  const context = await buildRenderContext(tenant, request, null);

  let html = renderTemplate(request.template.bodyHtml, context);
  html = await renderApprovedSignatures(prisma, request, html);
  html = injectWatermark(html);

  return renderHtmlToPdfBuffer(html);
}

/**
 * Renders the final unwatermarked PDF (all signatures + reference number + QR code
 * linking to the public verification page) and persists it via the storage driver.
 * Called once a request has reached "Approved" — see finalizeDocumentRequest in
 * documentRequest.service.ts for the surrounding retry/resilience handling.
 */
export async function renderAndStoreFinalDocument(
  prisma: PrismaClient,
  tenant: TenantContext,
  requestId: number
): Promise<{ referenceNumber: string; fileUrl: string; fileKey: string }> {
  const request = await loadRequestForRender(prisma, requestId);
  const referenceNumber = `DOC-${nanoid(8).toUpperCase()}`;
  const verificationUrl = `${env.FRONTEND_BASE_URL.replace(/\/$/, "")}/verify/${tenant.slug}/${referenceNumber}`;

  const context = await buildRenderContext(tenant, request, referenceNumber);
  context.qrCode = await generateQrCodeDataUri(verificationUrl);

  let html = renderTemplate(request.template.bodyHtml, context);
  html = await renderApprovedSignatures(prisma, request, html);

  const pdfBuffer = await renderHtmlToPdfBuffer(html);
  const stored = await getStorageDriver().save({
    buffer: pdfBuffer,
    originalName: `${referenceNumber}.pdf`,
    mimeType: "application/pdf",
    folder: "document-requests",
  });

  return { referenceNumber, fileUrl: stored.url, fileKey: stored.key };
}
