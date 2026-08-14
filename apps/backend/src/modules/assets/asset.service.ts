import { nanoid } from "nanoid";
import { PrismaClient, Prisma } from "../../../generated/tenant";
import {
  AssetDto,
  AssignAssetInput,
  CreateAssetInput,
  ListAssetsQuery,
  PaginatedResult,
  ReturnAssetInput,
  UpdateAssetInput,
} from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { logger } from "../../logger";
import { assetInclude, toAssetDto } from "./asset.mapper";
import { findInvalidCategoryFields } from "./asset.schemas";
import { ActingUser, createDocumentRequest, updateFieldValues } from "../document-requests/documentRequest.service";

const ASSET_RECEIPT_TEMPLATE_SHORT_CODE = "ASSET_RECEIPT_ACK";
const ASSET_RETURN_TEMPLATE_SHORT_CODE = "ASSET_RETURN_CHECKLIST";

const EXPIRY_FIELDS = ["registrationExpiry", "wofCofExpiry", "testAndTagExpiry", "warrantyExpiry"] as const;

async function generateUniqueAssetTag(prisma: PrismaClient): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const tag = `AST-${nanoid(8).toUpperCase()}`;
    const existing = await prisma.asset.findUnique({ where: { assetTag: tag } });
    if (!existing) return tag;
  }
  throw ApiError.conflict("Could not generate a unique asset tag, please retry");
}

async function getAssetOrThrow(prisma: PrismaClient, id: number) {
  const asset = await prisma.asset.findUnique({ where: { id }, include: assetInclude });
  if (!asset) {
    throw ApiError.notFound("Asset not found");
  }
  return asset;
}

export async function listAssets(
  prisma: PrismaClient,
  query: ListAssetsQuery
): Promise<PaginatedResult<AssetDto>> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const where: Prisma.AssetWhereInput = {
    ...(query.category ? { category: query.category } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.isFbtRelevant !== undefined ? { isFbtRelevant: query.isFbtRelevant } : {}),
    ...(query.employeeId ? { currentAssignment: { employeeId: query.employeeId } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: assetInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.asset.count({ where }),
  ]);

  return { items: items.map(toAssetDto), total, page, pageSize };
}

export async function getAssetById(prisma: PrismaClient, id: number): Promise<AssetDto> {
  return toAssetDto(await getAssetOrThrow(prisma, id));
}

export async function createAsset(
  prisma: PrismaClient,
  input: CreateAssetInput,
  createdById: number
): Promise<AssetDto> {
  const assetTag = await generateUniqueAssetTag(prisma);
  const asset = await prisma.asset.create({
    data: {
      assetTag,
      name: input.name,
      category: input.category,
      serialNumber: input.serialNumber,
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
      purchaseCost: input.purchaseCost,
      supplier: input.supplier,
      notes: input.notes,
      registrationNumber: input.registrationNumber,
      registrationExpiry: input.registrationExpiry ? new Date(input.registrationExpiry) : undefined,
      wofCofExpiry: input.wofCofExpiry ? new Date(input.wofCofExpiry) : undefined,
      make: input.make,
      model: input.model,
      vin: input.vin,
      testAndTagExpiry: input.testAndTagExpiry ? new Date(input.testAndTagExpiry) : undefined,
      warrantyExpiry: input.warrantyExpiry ? new Date(input.warrantyExpiry) : undefined,
      isFbtRelevant: input.isFbtRelevant ?? false,
      fbtNotes: input.fbtNotes,
      createdById,
    },
    include: assetInclude,
  });
  return toAssetDto(asset);
}

export async function updateAsset(
  prisma: PrismaClient,
  id: number,
  input: UpdateAssetInput,
  updatedById: number
): Promise<AssetDto> {
  const existing = await getAssetOrThrow(prisma, id);

  const invalid = findInvalidCategoryFields(existing.category, input as Record<string, unknown>);
  if (invalid.length > 0) {
    throw ApiError.badRequest(invalid.join("; "));
  }

  const asset = await prisma.asset.update({
    where: { id },
    data: {
      name: input.name,
      serialNumber: input.serialNumber,
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
      purchaseCost: input.purchaseCost,
      supplier: input.supplier,
      notes: input.notes,
      registrationNumber: input.registrationNumber,
      registrationExpiry: input.registrationExpiry ? new Date(input.registrationExpiry) : undefined,
      wofCofExpiry: input.wofCofExpiry ? new Date(input.wofCofExpiry) : undefined,
      make: input.make,
      model: input.model,
      vin: input.vin,
      testAndTagExpiry: input.testAndTagExpiry ? new Date(input.testAndTagExpiry) : undefined,
      warrantyExpiry: input.warrantyExpiry ? new Date(input.warrantyExpiry) : undefined,
      isFbtRelevant: input.isFbtRelevant,
      fbtNotes: input.fbtNotes,
      updatedById,
    },
    include: assetInclude,
  });
  return toAssetDto(asset);
}

export async function retireAsset(prisma: PrismaClient, id: number, updatedById: number): Promise<AssetDto> {
  const existing = await getAssetOrThrow(prisma, id);
  if (existing.status === "Assigned") {
    throw ApiError.conflict("Cannot retire an asset that is currently assigned — return it first");
  }
  if (existing.status === "Retired" || existing.status === "Disposed") {
    throw ApiError.conflict("Asset is already retired or disposed");
  }
  const asset = await prisma.asset.update({
    where: { id },
    data: { status: "Retired", updatedById },
    include: assetInclude,
  });
  return toAssetDto(asset);
}

async function findActiveTemplateByShortCode(prisma: PrismaClient, shortCode: string) {
  const template = await prisma.documentTemplate.findUnique({ where: { shortCode } });
  if (!template || template.status !== "Active") return null;
  return template;
}

/**
 * Best-effort: kicks off the "employee attests they received this asset" sign-off via
 * the existing DocumentRequest pipeline. If the template hasn't been set up yet for this
 * tenant (an admin configures it once under Document Templates), the assignment still
 * succeeds — it just isn't linked to a signable receipt.
 */
async function tryCreateAssetReceiptRequest(
  prisma: PrismaClient,
  assignmentId: number,
  asset: { name: string; assetTag: string },
  employee: { id: number; firstName: string; lastName: string; email: string; reportingToId: number | null },
  actingUser: ActingUser
): Promise<void> {
  try {
    const template = await findActiveTemplateByShortCode(prisma, ASSET_RECEIPT_TEMPLATE_SHORT_CODE);
    if (!template) {
      logger.info(
        { shortCode: ASSET_RECEIPT_TEMPLATE_SHORT_CODE },
        "Asset receipt document template not configured — skipping sign-off request"
      );
      return;
    }
    const request = await createDocumentRequest(prisma, employee.id, { templateId: template.id }, actingUser.id, actingUser);
    await updateFieldValues(prisma, request.id, {
      assetName: asset.name,
      assetTag: asset.assetTag,
      assignedDate: new Date().toISOString().slice(0, 10),
    });
    await prisma.assetAssignment.update({
      where: { id: assignmentId },
      data: { assignReceiptRequestId: request.id },
    });
  } catch (err) {
    logger.warn({ err, assignmentId }, "Failed to create asset receipt sign-off request");
  }
}

export async function assignAsset(
  prisma: PrismaClient,
  assetId: number,
  input: AssignAssetInput,
  actingUser: ActingUser
): Promise<AssetDto> {
  const asset = await getAssetOrThrow(prisma, assetId);
  if (asset.status !== "Available") {
    throw ApiError.conflict("Only available assets can be assigned");
  }
  const employee = await prisma.employee.findUnique({ where: { id: input.employeeId } });
  if (!employee) {
    throw ApiError.notFound("Employee not found");
  }

  const assignment = await prisma.$transaction(async (tx) => {
    const created = await tx.assetAssignment.create({
      data: {
        assetId,
        employeeId: input.employeeId,
        assignedById: actingUser.id,
        expectedReturnDate: input.expectedReturnDate ? new Date(input.expectedReturnDate) : null,
        conditionOnAssign: input.conditionOnAssign,
      },
    });
    await tx.asset.update({
      where: { id: assetId },
      data: { currentAssignmentId: created.id, status: "Assigned" },
    });
    return created;
  });

  await tryCreateAssetReceiptRequest(prisma, assignment.id, asset, employee, actingUser);

  return getAssetById(prisma, assetId);
}

export async function returnAsset(
  prisma: PrismaClient,
  assetId: number,
  input: ReturnAssetInput,
  actingUser: ActingUser
): Promise<AssetDto> {
  const asset = await getAssetOrThrow(prisma, assetId);
  if (!asset.currentAssignmentId || asset.status !== "Assigned") {
    throw ApiError.conflict("This asset is not currently assigned");
  }

  await prisma.$transaction(async (tx) => {
    await tx.assetAssignment.update({
      where: { id: asset.currentAssignmentId! },
      data: {
        returnedAt: new Date(),
        returnedToId: actingUser.id,
        conditionOnReturn: input.conditionOnReturn,
      },
    });
    await tx.asset.update({
      where: { id: assetId },
      data: { currentAssignmentId: null, status: "Available" },
    });
  });

  return getAssetById(prisma, assetId);
}

export async function listAssetsForEmployee(prisma: PrismaClient, employeeId: number): Promise<AssetDto[]> {
  const assets = await prisma.asset.findMany({
    where: { currentAssignment: { employeeId } },
    include: assetInclude,
    orderBy: { assetTag: "asc" },
  });
  return assets.map(toAssetDto);
}

/**
 * Creates (or re-links) an "asset return checklist" DocumentRequest snapshotting every
 * asset currently assigned to `employeeId`, for HR to confirm/sign off as they're returned
 * during offboarding. Requires the checklist template to already be configured — unlike
 * the receipt sign-off, this is an explicit user action, so a missing template is a hard
 * error rather than a silent skip.
 */
export async function startOffboardingChecklist(
  prisma: PrismaClient,
  employeeId: number,
  actingUser: ActingUser
): Promise<{ documentRequestId: number; assets: AssetDto[] }> {
  const assets = await listAssetsForEmployee(prisma, employeeId);
  if (assets.length === 0) {
    throw ApiError.conflict("This employee has no currently-assigned assets to return");
  }

  const template = await findActiveTemplateByShortCode(prisma, ASSET_RETURN_TEMPLATE_SHORT_CODE);
  if (!template) {
    throw ApiError.conflict(
      "Asset return checklist template not configured. Ask an admin to create a Document Template with " +
        `shortCode "${ASSET_RETURN_TEMPLATE_SHORT_CODE}" under category "ASSET_RETURN".`
    );
  }

  const request = await createDocumentRequest(prisma, employeeId, { templateId: template.id }, actingUser.id, actingUser);
  await updateFieldValues(prisma, request.id, {
    assets: assets.map((a) => ({ assetTag: a.assetTag, name: a.name, category: a.category })),
  });
  await prisma.assetAssignment.updateMany({
    where: { assetId: { in: assets.map((a) => a.id) }, returnedAt: null },
    data: { returnReceiptRequestId: request.id },
  });

  return { documentRequestId: request.id, assets };
}

export interface ExpiringAssetHit {
  asset: AssetDto;
  expiryField: (typeof EXPIRY_FIELDS)[number];
  expiryDate: Date;
  windowDays: number;
}

/**
 * Finds assets with any tracked expiry date falling within one of `windowDays` from now
 * (e.g. 30-day and 7-day warnings), for the scheduled reminder job. Deduping against
 * AssetReminderLog is the caller's responsibility.
 */
export async function listExpiringAssets(prisma: PrismaClient, windowDays: number[]): Promise<ExpiringAssetHit[]> {
  const now = new Date();
  const maxWindow = Math.max(...windowDays);
  const horizon = new Date(now.getTime() + maxWindow * 24 * 60 * 60 * 1000);

  const assets = await prisma.asset.findMany({
    where: {
      status: { notIn: ["Retired", "Disposed"] },
      OR: EXPIRY_FIELDS.map((field) => ({ [field]: { gte: now, lte: horizon } })),
    },
    include: assetInclude,
  });

  const hits: ExpiringAssetHit[] = [];
  for (const asset of assets) {
    for (const field of EXPIRY_FIELDS) {
      const value = asset[field] as Date | null;
      if (!value || value < now || value > horizon) continue;
      const daysUntil = Math.ceil((value.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      const window = windowDays.filter((w) => daysUntil <= w).sort((a, b) => a - b)[0];
      if (window === undefined) continue;
      hits.push({ asset: toAssetDto(asset), expiryField: field, expiryDate: value, windowDays: window });
    }
  }
  return hits;
}
