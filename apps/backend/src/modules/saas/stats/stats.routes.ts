import { Router } from "express";
import { requireSaasAdmin } from "../saasAuth/saasAuth.middleware";
import { getStatsHandler } from "./stats.controller";

export const statsRouter = Router();
statsRouter.use(requireSaasAdmin);
statsRouter.get("/", getStatsHandler);
