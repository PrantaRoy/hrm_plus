import { Prisma } from "../../../generated/tenant";
import { CommentDto, CommentStatus, CommentableType } from "@hrm-plus/shared";

const commentWithAuthor = Prisma.validator<Prisma.CommentDefaultArgs>()({
  include: {
    user: {
      select: { id: true, email: true, employee: { select: { firstName: true, lastName: true } } },
    },
  },
});

export type CommentWithAuthor = Prisma.CommentGetPayload<typeof commentWithAuthor>;
export const commentInclude = commentWithAuthor.include;

export function authorName(user: {
  email: string;
  employee: { firstName: string; lastName: string } | null;
}): string {
  return user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user.email;
}

export function toCommentDto(comment: CommentWithAuthor): CommentDto {
  return {
    id: comment.id,
    commentableType: comment.commentableType as CommentableType,
    commentableId: comment.commentableId,
    author: { userId: comment.user.id, name: authorName(comment.user) },
    body: comment.body,
    status: comment.status as CommentStatus | null,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  };
}
