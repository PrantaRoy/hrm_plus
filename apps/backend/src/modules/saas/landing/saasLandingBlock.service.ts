import { z } from "zod";
import {
  CreateSaasLandingBlockInput,
  SaasLandingBlockDto,
  SaasLandingBlockType,
  UpdateSaasLandingBlockInput,
} from "@hrm-plus/shared";
import { Prisma } from "../../../../generated/control";
import { controlClient } from "../../../db/controlClient";
import { ApiError } from "../../../utils/ApiError";
import { getStorageDriver } from "../../../storage";
import { toSaasLandingBlockDto } from "./saasLanding.mapper";
import {
  createSaasLandingBlockSchema,
  updateSaasLandingBlockSchema,
} from "./saasLanding.schemas";
import { invalidateLandingCache } from "./saasLandingContent.service";

const STORAGE_FOLDER = "saas-landing/blocks";

type FlatBlockFields = Partial<z.infer<typeof createSaasLandingBlockSchema>>;

// The columns title/subtitle/body/icon live on the row; everything else folds into `meta`.
function buildMeta(existingMeta: Prisma.JsonValue | null, fields: FlatBlockFields): Prisma.InputJsonValue {
  const meta: Record<string, unknown> = {
    ...((existingMeta ?? {}) as Record<string, unknown>),
  };
  const metaKeys = [
    "bullets",
    "ctaLabel",
    "ctaHref",
    "stepNumber",
    "value",
    "suffix",
    "authorName",
    "authorTitle",
    "company",
    "rating",
  ] as const;
  for (const key of metaKeys) {
    if (fields[key] === undefined) continue;
    if (fields[key] === null) {
      delete meta[key];
    } else {
      meta[key] = fields[key];
    }
  }
  return meta as Prisma.InputJsonValue;
}

export async function listSaasLandingBlocks(
  blockType?: SaasLandingBlockType
): Promise<SaasLandingBlockDto[]> {
  const blocks = await controlClient.saasLandingBlock.findMany({
    where: blockType ? { blockType } : undefined,
    orderBy: [{ blockType: "asc" }, { sortOrder: "asc" }],
  });
  return blocks.map(toSaasLandingBlockDto);
}

export async function getSaasLandingBlock(id: number): Promise<SaasLandingBlockDto> {
  const block = await controlClient.saasLandingBlock.findUnique({ where: { id } });
  if (!block) throw ApiError.notFound("Landing block not found");
  return toSaasLandingBlockDto(block);
}

export async function createSaasLandingBlock(
  rawInput: CreateSaasLandingBlockInput
): Promise<SaasLandingBlockDto> {
  const input = createSaasLandingBlockSchema.parse(rawInput);
  const last = await controlClient.saasLandingBlock.findFirst({
    where: { blockType: input.blockType },
    orderBy: { sortOrder: "desc" },
  });

  const created = await controlClient.saasLandingBlock.create({
    data: {
      blockType: input.blockType,
      title: input.title,
      subtitle: input.subtitle ?? null,
      body: input.body ?? null,
      icon: input.icon ?? null,
      isActive: input.isActive ?? true,
      sortOrder: (last?.sortOrder ?? -1) + 1,
      meta: buildMeta(null, input),
    },
  });
  invalidateLandingCache();
  return toSaasLandingBlockDto(created);
}

export async function updateSaasLandingBlock(
  id: number,
  rawInput: UpdateSaasLandingBlockInput
): Promise<SaasLandingBlockDto> {
  const input = updateSaasLandingBlockSchema.parse(rawInput);
  const existing = await controlClient.saasLandingBlock.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Landing block not found");

  const data: Prisma.SaasLandingBlockUncheckedUpdateInput = {
    meta: buildMeta(existing.meta, input),
  };
  if (input.title !== undefined) data.title = input.title;
  if (input.subtitle !== undefined) data.subtitle = input.subtitle;
  if (input.body !== undefined) data.body = input.body;
  if (input.icon !== undefined) data.icon = input.icon;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  const updated = await controlClient.saasLandingBlock.update({ where: { id }, data });
  invalidateLandingCache();
  return toSaasLandingBlockDto(updated);
}

export async function deleteSaasLandingBlock(id: number): Promise<void> {
  const existing = await controlClient.saasLandingBlock.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Landing block not found");
  if (existing.mediaKey) {
    await getStorageDriver().delete(existing.mediaKey).catch(() => undefined);
  }
  await controlClient.saasLandingBlock.delete({ where: { id } });
  invalidateLandingCache();
}

export async function reorderSaasLandingBlocks(
  blockType: SaasLandingBlockType,
  orderedIds: number[]
): Promise<SaasLandingBlockDto[]> {
  const blocks = await controlClient.saasLandingBlock.findMany({ where: { blockType } });
  const blockIds = new Set(blocks.map((b) => b.id));
  if (orderedIds.length !== blocks.length || orderedIds.some((id) => !blockIds.has(id))) {
    throw ApiError.badRequest("orderedIds must contain every block of this type exactly once");
  }

  await controlClient.$transaction(
    orderedIds.map((id, index) =>
      controlClient.saasLandingBlock.update({ where: { id }, data: { sortOrder: index } })
    )
  );
  invalidateLandingCache();
  return listSaasLandingBlocks(blockType);
}

export async function setSaasLandingBlockMedia(
  id: number,
  file: { buffer: Buffer; originalName: string; mimeType: string }
): Promise<SaasLandingBlockDto> {
  const existing = await controlClient.saasLandingBlock.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Landing block not found");

  const storage = getStorageDriver();
  const stored = await storage.save({
    buffer: file.buffer,
    originalName: file.originalName,
    mimeType: file.mimeType,
    folder: STORAGE_FOLDER,
  });
  if (existing.mediaKey) {
    await storage.delete(existing.mediaKey).catch(() => undefined);
  }

  const updated = await controlClient.saasLandingBlock.update({
    where: { id },
    data: { mediaUrl: stored.url, mediaKey: stored.key },
  });
  invalidateLandingCache();
  return toSaasLandingBlockDto(updated);
}
