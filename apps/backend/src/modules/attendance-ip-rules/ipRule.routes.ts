import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  createIpRuleHandler,
  deleteIpRuleHandler,
  listIpRulesHandler,
  updateIpRuleHandler,
} from "./ipRule.controller";

export const ipRuleRouter = Router();

ipRuleRouter.use(requireAuth);

ipRuleRouter.get("/", listIpRulesHandler);
ipRuleRouter.post("/", requireRole("Admin", "HR"), createIpRuleHandler);
ipRuleRouter.patch("/:id", requireRole("Admin", "HR"), updateIpRuleHandler);
ipRuleRouter.delete("/:id", requireRole("Admin", "HR"), deleteIpRuleHandler);
