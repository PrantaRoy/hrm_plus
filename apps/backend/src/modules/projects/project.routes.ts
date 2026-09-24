import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { buildAttachmentRouter } from "../attachments/attachment.routes";
import { buildCommentRouter } from "../comments/comment.routes";
import {
  createProjectHandler,
  deleteProjectHandler,
  getProjectHandler,
  listProjectsHandler,
  setProjectMembersHandler,
  updateProjectHandler,
} from "./project.controller";

export const projectRouter = Router();

projectRouter.use(requireAuth);

// Reads are scoped per viewer in the service (Admin/HR/Manager see all; others see their projects).
projectRouter.get("/", listProjectsHandler);
projectRouter.get("/:id", getProjectHandler);

// Only an Admin creates, edits or deletes projects (HR/Manager can add tasks, not projects).
const adminOnly = requireRole("Admin");
projectRouter.post("/", adminOnly, createProjectHandler);
projectRouter.patch("/:id", adminOnly, updateProjectHandler);
projectRouter.put("/:id/members", adminOnly, setProjectMembersHandler);
projectRouter.delete("/:id", adminOnly, deleteProjectHandler);

projectRouter.use("/:id/comments", buildCommentRouter("project"));
projectRouter.use("/:id/attachments", buildAttachmentRouter("project"));
