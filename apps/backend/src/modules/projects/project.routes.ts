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

// Reads are scoped per viewer in the service (managers see all; others see their projects).
projectRouter.get("/", listProjectsHandler);
projectRouter.get("/:id", getProjectHandler);

const managers = requireRole("Admin", "HR", "Manager");
projectRouter.post("/", managers, createProjectHandler);
projectRouter.patch("/:id", managers, updateProjectHandler);
projectRouter.put("/:id/members", managers, setProjectMembersHandler);
projectRouter.delete("/:id", managers, deleteProjectHandler);

projectRouter.use("/:id/comments", buildCommentRouter("project"));
projectRouter.use("/:id/attachments", buildAttachmentRouter("project"));
