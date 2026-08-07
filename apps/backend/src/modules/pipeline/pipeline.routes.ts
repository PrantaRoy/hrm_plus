import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { getBoardHandler, moveApplicationStageHandler } from "./pipeline.controller";

export const pipelineRouter = Router();

pipelineRouter.use(requireAuth, requireRole("Admin", "HR"));
pipelineRouter.get("/board", getBoardHandler);
pipelineRouter.patch("/applications/:id/stage", moveApplicationStageHandler);
