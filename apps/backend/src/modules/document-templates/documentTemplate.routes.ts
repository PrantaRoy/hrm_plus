import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  createDocumentTemplateHandler,
  disableDocumentTemplateHandler,
  getDocumentTemplateHandler,
  listDocumentTemplatesHandler,
  updateDocumentTemplateHandler,
} from "./documentTemplate.controller";

export const documentTemplateRouter = Router();

documentTemplateRouter.use(requireAuth);

documentTemplateRouter.get("/", listDocumentTemplatesHandler);
documentTemplateRouter.get("/:id", getDocumentTemplateHandler);
documentTemplateRouter.post("/", requireRole("Admin", "HR"), createDocumentTemplateHandler);
documentTemplateRouter.patch("/:id", requireRole("Admin", "HR"), updateDocumentTemplateHandler);
documentTemplateRouter.delete("/:id", requireRole("Admin", "HR"), disableDocumentTemplateHandler);
