import { Prisma } from "../../../generated/tenant";
import { getStorageDriver } from "../../storage";
import { logger } from "../../logger";
import { OwnerType } from "./projectAccess";

/**
 * Comments and attachments are polymorphic (no FK), so nothing cascades when their
 * owner is deleted. Call this inside the owner's delete transaction; it removes the rows
 * and returns the storage keys, which the caller passes to deleteStoredFiles() *after*
 * the transaction commits (so a rollback never orphans DB rows pointing at deleted files).
 */
export async function purgeOwnedRecords(
  tx: Prisma.TransactionClient,
  type: OwnerType,
  id: number
): Promise<string[]> {
  await tx.comment.deleteMany({ where: { commentableType: type, commentableId: id } });
  const files = await tx.attachment.findMany({
    where: { attachableType: type, attachableId: id },
    select: { filePath: true },
  });
  await tx.attachment.deleteMany({ where: { attachableType: type, attachableId: id } });
  return files.map((f) => f.filePath);
}

export async function deleteStoredFiles(keys: string[]): Promise<void> {
  const storage = getStorageDriver();
  await Promise.all(
    keys.map((key) =>
      storage.delete(key).catch((err) => logger.warn({ err, key }, "Failed to delete stored project file"))
    )
  );
}
