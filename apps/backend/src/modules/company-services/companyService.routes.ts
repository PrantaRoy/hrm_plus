import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  createCompanyServiceHandler,
  deleteCompanyServiceHandler,
  getCompanyServiceHandler,
  listCompanyServicesHandler,
  reorderCompanyServicesHandler,
  updateCompanyServiceHandler,
} from "./companyService.controller";

export const companyServiceRouter = Router();

companyServiceRouter.use(requireAuth, requireRole("Admin", "HR"));

companyServiceRouter.get("/", listCompanyServicesHandler);
companyServiceRouter.get("/:id", getCompanyServiceHandler);
companyServiceRouter.post("/", createCompanyServiceHandler);
companyServiceRouter.patch("/:id", updateCompanyServiceHandler);
companyServiceRouter.delete("/:id", deleteCompanyServiceHandler);
companyServiceRouter.post("/reorder", reorderCompanyServicesHandler);
