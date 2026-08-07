import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  closeJobHandler,
  createJobHandler,
  deleteJobHandler,
  getJobHandler,
  getPublicJobHandler,
  listJobsHandler,
  listPublicJobsHandler,
  publishJobHandler,
  updateJobHandler,
} from "./job.controller";

// Public: no requireAuth. Still mounted behind tenantResolver in app.ts, since jobs are tenant-scoped.
export const publicJobRouter = Router();
publicJobRouter.get("/", listPublicJobsHandler);
publicJobRouter.get("/:slug", getPublicJobHandler);

export const adminJobRouter = Router();
adminJobRouter.use(requireAuth, requireRole("Admin", "HR"));
adminJobRouter.get("/", listJobsHandler);
adminJobRouter.get("/:id", getJobHandler);
adminJobRouter.post("/", createJobHandler);
adminJobRouter.patch("/:id", updateJobHandler);
adminJobRouter.delete("/:id", deleteJobHandler);
adminJobRouter.post("/:id/publish", publishJobHandler);
adminJobRouter.post("/:id/close", closeJobHandler);
