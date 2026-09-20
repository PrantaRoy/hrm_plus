import { Router } from "express";
import { AttachableType } from "@hrm-plus/shared";
import { requireAuth } from "../../middleware/auth";
import { projectAttachmentUpload } from "../../middleware/fileUpload";
import {
  deleteAttachmentHandler,
  listAttachmentsHandler,
  uploadAttachmentHandler,
} from "./attachment.controller";

/**
 * Owner-scoped attachments, mounted under the owner's router so `:id` is the task/project id:
 *   projectRouter.use("/:id/attachments", buildAttachmentRouter("project"))
 * The parent router is responsible for requireAuth.
 */
export function buildAttachmentRouter(type: AttachableType): Router {
  const router = Router({ mergeParams: true });
  router.get("/", listAttachmentsHandler(type));
  router.post("/", projectAttachmentUpload.single("file"), uploadAttachmentHandler(type));
  return router;
}

/** Owner-agnostic operations on a single attachment: /api/attachments/:attachmentId */
export const attachmentRouter = Router();
attachmentRouter.use(requireAuth);
attachmentRouter.delete("/:attachmentId", deleteAttachmentHandler);
