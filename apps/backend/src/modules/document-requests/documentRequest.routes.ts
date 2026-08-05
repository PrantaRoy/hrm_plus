import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { documentUpload } from "../../middleware/fileUpload";
import {
  approveDocumentRequestHandler,
  cancelDocumentRequestHandler,
  createDocumentRequestHandler,
  downloadDocumentRequestHandler,
  getDocumentRequestHandler,
  listDocumentRequestsHandler,
  listMyDocumentRequestsHandler,
  listPendingMyApprovalHandler,
  previewDocumentRequestHandler,
  rejectDocumentRequestHandler,
  retryIssueDocumentRequestHandler,
  updateFieldValuesHandler,
} from "./documentRequest.controller";

export const documentRequestRouter = Router();

documentRequestRouter.use(requireAuth);

documentRequestRouter.get("/my", listMyDocumentRequestsHandler);
documentRequestRouter.get("/pending-my-approval", listPendingMyApprovalHandler);
documentRequestRouter.get("/", requireRole("Admin", "HR", "Manager"), listDocumentRequestsHandler);
documentRequestRouter.get("/:id", getDocumentRequestHandler);
documentRequestRouter.post("/", documentUpload.single("attachment"), createDocumentRequestHandler);
documentRequestRouter.post("/:id/approve", approveDocumentRequestHandler);
documentRequestRouter.post("/:id/reject", rejectDocumentRequestHandler);
documentRequestRouter.post("/:id/cancel", cancelDocumentRequestHandler);
documentRequestRouter.post("/:id/retry-issue", requireRole("Admin", "HR"), retryIssueDocumentRequestHandler);
documentRequestRouter.get("/:id/preview", previewDocumentRequestHandler);
documentRequestRouter.get("/:id/download", downloadDocumentRequestHandler);
documentRequestRouter.patch("/:id/field-values", requireRole("Admin", "HR"), updateFieldValuesHandler);
