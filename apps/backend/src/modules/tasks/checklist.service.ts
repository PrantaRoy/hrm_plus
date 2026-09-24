import { PrismaClient } from "../../../generated/tenant";
import { ChecklistDto } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { Actor, loadTaskAccess } from "../projects/projectAccess";
import { toChecklistDto } from "./task.mapper";

async function loadItemOrThrow(prisma: PrismaClient, taskId: number, itemId: number) {
  const item = await prisma.checklist.findFirst({ where: { id: itemId, taskId } });
  if (!item) throw ApiError.notFound("Checklist item not found");
  return item;
}

export async function addChecklistItem(
  prisma: PrismaClient,
  actor: Actor,
  taskId: number,
  title: string
): Promise<ChecklistDto> {
  const access = await loadTaskAccess(prisma, actor, taskId);
  if (!access.canManage) throw ApiError.forbidden("Only an Admin can edit the checklist");
  return toChecklistDto(await prisma.checklist.create({ data: { taskId, title } }));
}

export async function renameChecklistItem(
  prisma: PrismaClient,
  actor: Actor,
  taskId: number,
  itemId: number,
  title: string
): Promise<ChecklistDto> {
  const access = await loadTaskAccess(prisma, actor, taskId);
  if (!access.canManage) throw ApiError.forbidden("Only an Admin can edit the checklist");
  await loadItemOrThrow(prisma, taskId, itemId);
  return toChecklistDto(await prisma.checklist.update({ where: { id: itemId }, data: { title } }));
}

export async function deleteChecklistItem(
  prisma: PrismaClient,
  actor: Actor,
  taskId: number,
  itemId: number
): Promise<void> {
  const access = await loadTaskAccess(prisma, actor, taskId);
  if (!access.canManage) throw ApiError.forbidden("Only an Admin can edit the checklist");
  await loadItemOrThrow(prisma, taskId, itemId);
  await prisma.checklist.delete({ where: { id: itemId } });
}

/** Ticked by a task member (or the supervisor/manager). Un-ticking also clears the supervisor's verification. */
export async function setChecklistCompleted(
  prisma: PrismaClient,
  actor: Actor,
  taskId: number,
  itemId: number,
  value: boolean
): Promise<ChecklistDto> {
  const access = await loadTaskAccess(prisma, actor, taskId);
  if (!access.canWork) throw ApiError.forbidden("Only task members can tick checklist items");
  await loadItemOrThrow(prisma, taskId, itemId);
  return toChecklistDto(
    await prisma.checklist.update({
      where: { id: itemId },
      data: value ? { isCompleted: true } : { isCompleted: false, isVerified: false },
    })
  );
}

/** Verification is the supervisor's sign-off, and only makes sense on an item the member already completed. */
export async function setChecklistVerified(
  prisma: PrismaClient,
  actor: Actor,
  taskId: number,
  itemId: number,
  value: boolean
): Promise<ChecklistDto> {
  const access = await loadTaskAccess(prisma, actor, taskId);
  if (!access.canVerify) throw ApiError.forbidden("Only the supervisor can verify checklist items");
  const item = await loadItemOrThrow(prisma, taskId, itemId);
  if (value && !item.isCompleted) {
    throw ApiError.conflict("Only completed checklist items can be verified", "CHECKLIST_NOT_COMPLETED");
  }
  return toChecklistDto(await prisma.checklist.update({ where: { id: itemId }, data: { isVerified: value } }));
}
