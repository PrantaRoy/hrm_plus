import { PrismaClient } from "../../../generated/tenant";
import { AttachableType, AttachmentDto } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { logger } from "../../logger";
import { getStorageDriver } from "../../storage";
import { Actor, loadOwnerAccess } from "../projects/projectAccess";
import { attachmentInclude, toAttachmentDto } from "./attachment.mapper";

export interface UploadedFile {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

export async function listAttachments(
  prisma: PrismaClient,
  actor: Actor,
  type: AttachableType,
  ownerId: number
): Promise<AttachmentDto[]> {
  await loadOwnerAccess(prisma, actor, type, ownerId);
  const attachments = await prisma.attachment.findMany({
    where: { attachableType: type, attachableId: ownerId },
    include: attachmentInclude,
    orderBy: { id: "asc" },
  });
  return attachments.map(toAttachmentDto);
}

export async function uploadAttachment(
  prisma: PrismaClient,
  actor: Actor,
  type: AttachableType,
  ownerId: number,
  file: UploadedFile
): Promise<AttachmentDto> {
  await loadOwnerAccess(prisma, actor, type, ownerId);

  const storage = getStorageDriver();
  const stored = await storage.save({
    buffer: file.buffer,
    originalName: file.originalName,
    mimeType: file.mimeType,
    folder: "project-attachments",
  });

  try {
    const attachment = await prisma.attachment.create({
      data: {
        uploaderId: actor.userId,
        attachableType: type,
        attachableId: ownerId,
        filePath: stored.key,
        fileUrl: stored.url,
        fileName: file.originalName.slice(0, 191),
        fileType: file.mimeType,
        fileSize: file.size,
      },
      include: attachmentInclude,
    });
    return toAttachmentDto(attachment);
  } catch (err) {
    // Don't leave an orphaned file behind when the row could not be written.
    await storage.delete(stored.key).catch((cleanupErr) =>
      logger.warn({ err: cleanupErr, key: stored.key }, "Failed to clean up attachment after DB error")
    );
    throw err;
  }
}

/** The uploader, or a supervisor/manager of the owner, can remove a file. */
export async function deleteAttachment(prisma: PrismaClient, actor: Actor, attachmentId: number): Promise<void> {
  const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
  if (!attachment) throw ApiError.notFound("Attachment not found");

  const access = await loadOwnerAccess(
    prisma,
    actor,
    attachment.attachableType as AttachableType,
    attachment.attachableId
  );
  if (attachment.uploaderId !== actor.userId && !access.canModerate) {
    throw ApiError.forbidden("Only the uploader or a supervisor can delete an attachment");
  }

  await prisma.attachment.delete({ where: { id: attachmentId } });
  await getStorageDriver()
    .delete(attachment.filePath)
    .catch((err) => logger.warn({ err, key: attachment.filePath }, "Failed to delete stored attachment"));
}
