import { Router } from "express";
import { requireCandidateToken } from "../../middleware/candidateAuth";
import { getPortalSnapshotHandler, withdrawApplicationHandler } from "./candidatePortal.controller";

export const candidatePortalRouter = Router();

candidatePortalRouter.use(requireCandidateToken);
candidatePortalRouter.get("/me", getPortalSnapshotHandler);
candidatePortalRouter.post("/withdraw", withdrawApplicationHandler);
