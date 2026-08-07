import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  createScreeningQuestionHandler,
  deleteScreeningQuestionHandler,
  getScreeningQuestionHandler,
  listScreeningQuestionsHandler,
  seedLegalComplianceQuestionsHandler,
  updateScreeningQuestionHandler,
} from "./screeningQuestion.controller";

export const screeningQuestionRouter = Router();

screeningQuestionRouter.use(requireAuth, requireRole("Admin", "HR"));

screeningQuestionRouter.get("/", listScreeningQuestionsHandler);
screeningQuestionRouter.get("/:id", getScreeningQuestionHandler);
screeningQuestionRouter.post("/", createScreeningQuestionHandler);
screeningQuestionRouter.patch("/:id", updateScreeningQuestionHandler);
screeningQuestionRouter.delete("/:id", deleteScreeningQuestionHandler);
screeningQuestionRouter.post("/seed-legal-compliance", seedLegalComplianceQuestionsHandler);
