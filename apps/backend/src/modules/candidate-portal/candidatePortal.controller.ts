import { RequestHandler } from "express";
import { withdrawApplicationSchema } from "./candidatePortal.schemas";
import * as candidatePortalService from "./candidatePortal.service";

export const getPortalSnapshotHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await candidatePortalService.getPortalSnapshot(req.prisma!, req.candidateApplication!.applicationId));
  } catch (err) {
    next(err);
  }
};

export const withdrawApplicationHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = withdrawApplicationSchema.parse(req.body ?? {});
    await candidatePortalService.withdrawApplication(req.prisma!, req.candidateApplication!.applicationId, input.reason);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
