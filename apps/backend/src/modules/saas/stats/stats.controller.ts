import { RequestHandler } from "express";
import { SaasStats } from "@hrm-plus/shared";
import { controlClient } from "../../../db/controlClient";

export const getStatsHandler: RequestHandler = async (_req, res, next) => {
  try {
    const [totalCompanies, totalPackages] = await Promise.all([
      controlClient.tenant.count(),
      controlClient.package.count(),
    ]);
    const stats: SaasStats = { totalCompanies, totalPackages };
    res.json(stats);
  } catch (err) {
    next(err);
  }
};
