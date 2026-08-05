import { RequestHandler } from "express";
import { verifyDocumentReference } from "./documentVerify.service";

export const verifyDocumentHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await verifyDocumentReference(req.prisma!, req.params.referenceNumber));
  } catch (err) {
    next(err);
  }
};
