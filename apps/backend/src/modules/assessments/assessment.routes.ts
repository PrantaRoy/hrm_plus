import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { requireCandidateToken } from "../../middleware/candidateAuth";
import {
  generateAssessmentWithAiHandler,
  getAssessmentHandler,
  getAssignedAssessmentHandler,
  getCurrentQuestionHandler,
  publishAssessmentHandler,
  resendInviteHandler,
  submitCurrentAnswerHandler,
  upsertAssessmentHandler,
} from "./assessment.controller";

export const adminAssessmentRouter = Router();
adminAssessmentRouter.use(requireAuth, requireRole("Admin", "HR"));
adminAssessmentRouter.get("/:jobId", getAssessmentHandler);
adminAssessmentRouter.put("/:jobId", upsertAssessmentHandler);
adminAssessmentRouter.post("/:jobId/generate-ai", generateAssessmentWithAiHandler);
adminAssessmentRouter.post("/:jobId/publish", publishAssessmentHandler);
adminAssessmentRouter.post("/applications/:applicationId/resend-invite", resendInviteHandler);

// Candidate-facing: token auth, no requireAuth. Still mounted behind tenantResolver in app.ts.
export const publicAssessmentRouter = Router();
publicAssessmentRouter.use(requireCandidateToken);
publicAssessmentRouter.get("/", getAssignedAssessmentHandler);
publicAssessmentRouter.get("/current-question", getCurrentQuestionHandler);
publicAssessmentRouter.post("/answer", submitCurrentAnswerHandler);
