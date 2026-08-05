import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { listDocumentCategoriesHandler } from "./documentTemplate.controller";

export const documentCategoryRouter = Router();

documentCategoryRouter.use(requireAuth);

documentCategoryRouter.get("/", listDocumentCategoriesHandler);
