import { Prisma } from "../../../generated/tenant";
import { AttachableType, AttachmentDto } from "@hrm-plus/shared";
import { authorName } from "../comments/comment.mapper";

const attachmentWithUploader = Prisma.validator<Prisma.AttachmentDefaultArgs>()({
  include: {
    uploader: {
      select: { id: true, email: true, employee: { select: { firstName: true, lastName: true } } },
    },
  },
});

export type AttachmentWithUploader = Prisma.AttachmentGetPayload<typeof attachmentWithUploader>;
export const attachmentInclude = attachmentWithUploader.include;

export function toAttachmentDto(attachment: AttachmentWithUploader): AttachmentDto {
  return {
    id: attachment.id,
    attachableType: attachment.attachableType as AttachableType,
    attachableId: attachment.attachableId,
    uploader: { userId: attachment.uploader.id, name: authorName(attachment.uploader) },
    fileName: attachment.fileName,
    fileType: attachment.fileType,
    fileSize: attachment.fileSize,
    fileUrl: attachment.fileUrl,
    createdAt: attachment.createdAt.toISOString(),
  };
}
