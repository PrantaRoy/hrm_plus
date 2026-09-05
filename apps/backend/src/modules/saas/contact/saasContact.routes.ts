import { Router } from "express";
import { requireSaasAdmin } from "../saasAuth/saasAuth.middleware";
import { saasContactRateLimiter } from "../../../middleware/rateLimiter";
import {
  deleteSaasContactHandler,
  getSaasContactHandler,
  listSaasContactHandler,
  submitSaasContactHandler,
  updateSaasContactStatusHandler,
} from "./saasContact.controller";

export const publicSaasContactRouter = Router();
publicSaasContactRouter.post("/", saasContactRateLimiter, submitSaasContactHandler);

export const adminSaasContactRouter = Router();
adminSaasContactRouter.use(requireSaasAdmin);
adminSaasContactRouter.get("/", listSaasContactHandler);
adminSaasContactRouter.get("/:id", getSaasContactHandler);
adminSaasContactRouter.patch("/:id/status", updateSaasContactStatusHandler);
adminSaasContactRouter.delete("/:id", deleteSaasContactHandler);
