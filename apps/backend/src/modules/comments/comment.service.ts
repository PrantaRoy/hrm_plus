import { PrismaClient } from "../../../generated/tenant";
import { CommentDto, CommentableType, CreateCommentInput, UpdateCommentInput } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { Actor, loadOwnerAccess } from "../projects/projectAccess";
import { commentInclude, toCommentDto } from "./comment.mapper";

export async function listComments(
  prisma: PrismaClient,
  actor: Actor,
  type: CommentableType,
  ownerId: number
): Promise<CommentDto[]> {
  await loadOwnerAccess(prisma, actor, type, ownerId);
  const comments = await prisma.comment.findMany({
    where: { commentableType: type, commentableId: ownerId },
    include: commentInclude,
    orderBy: { id: "asc" },
  });
  return comments.map(toCommentDto);
}

export async function createComment(
  prisma: PrismaClient,
  actor: Actor,
  type: CommentableType,
  ownerId: number,
  input: CreateCommentInput
): Promise<CommentDto> {
  const access = await loadOwnerAccess(prisma, actor, type, ownerId);
  // Setting a review status on creation is a moderator action.
  if (input.status && !access.canModerate) {
    throw ApiError.forbidden("Only the supervisor can set a comment status");
  }
  const comment = await prisma.comment.create({
    data: {
      userId: actor.userId,
      commentableType: type,
      commentableId: ownerId,
      body: input.body,
      status: input.status ?? null,
    },
    include: commentInclude,
  });
  return toCommentDto(comment);
}

async function loadCommentWithAccess(prisma: PrismaClient, actor: Actor, commentId: number) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw ApiError.notFound("Comment not found");
  // 404s when the owner is gone or not visible to the actor.
  const access = await loadOwnerAccess(
    prisma,
    actor,
    comment.commentableType as CommentableType,
    comment.commentableId
  );
  return { comment, access, isAuthor: comment.userId === actor.userId };
}

/** The author edits the text; the author or an owner supervisor/manager moves the status. */
export async function updateComment(
  prisma: PrismaClient,
  actor: Actor,
  commentId: number,
  input: UpdateCommentInput
): Promise<CommentDto> {
  const { access, isAuthor } = await loadCommentWithAccess(prisma, actor, commentId);
  if (input.body !== undefined && !isAuthor) {
    throw ApiError.forbidden("Only the author can edit a comment");
  }
  if (input.status !== undefined && !isAuthor && !access.canModerate) {
    throw ApiError.forbidden("Only the author or a supervisor can change a comment status");
  }
  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: {
      ...(input.body !== undefined ? { body: input.body } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
    include: commentInclude,
  });
  return toCommentDto(updated);
}

export async function deleteComment(prisma: PrismaClient, actor: Actor, commentId: number): Promise<void> {
  const { access, isAuthor } = await loadCommentWithAccess(prisma, actor, commentId);
  if (!isAuthor && !access.canModerate) {
    throw ApiError.forbidden("Only the author or a supervisor can delete a comment");
  }
  await prisma.comment.delete({ where: { id: commentId } });
}
