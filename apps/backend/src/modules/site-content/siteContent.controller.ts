import { RequestHandler } from "express";
import * as siteContentService from "./siteContent.service";

export const getSiteContentHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await siteContentService.getSiteContent(req.prisma!, req.tenant!.id));
  } catch (err) {
    next(err);
  }
};
