import { Router } from "express";
import { CommentableType } from "@hrm-plus/shared";
import { requireAuth } from "../../middleware/auth";
import {
  createCommentHandler,
  deleteCommentHandler,
  listCommentsHandler,
  updateCommentHandler,
} from "./comment.controller";

/**
 * Owner-scoped comments, mounted under the owner's router so `:id` is the task/project id:
 *   taskRouter.use("/:id/comments", buildCommentRouter("task"))
 * The parent router is responsible for requireAuth.
 */
export function buildCommentRouter(type: CommentableType): Router {
  const router = Router({ mergeParams: true });
  router.get("/", listCommentsHandler(type));
  router.post("/", createCommentHandler(type));
  return router;
}

/** Owner-agnostic operations on a single comment: /api/comments/:commentId */
export const commentRouter = Router();
commentRouter.use(requireAuth);
commentRouter.patch("/:commentId", updateCommentHandler);
commentRouter.delete("/:commentId", deleteCommentHandler);
