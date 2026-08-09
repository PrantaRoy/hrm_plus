import { RequestHandler } from "express";
import { reorderSiteSectionsSchema, updateSiteSectionSchema } from "./siteSection.schemas";
import * as siteSectionService from "./siteSection.service";
import { ApiError } from "../../utils/ApiError";

export const listSiteSectionsHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await siteSectionService.listSections(req.prisma!));
  } catch (err) {
    next(err);
  }
};

export const updateSiteSectionHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid section id");
    const input = updateSiteSectionSchema.parse(req.body);
    res.json(await siteSectionService.updateSection(req.prisma!, id, input));
  } catch (err) {
    next(err);
  }
};

export const reorderSiteSectionsHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = reorderSiteSectionsSchema.parse(req.body);
    res.json(await siteSectionService.reorderSections(req.prisma!, input.orderedIds));
  } catch (err) {
    next(err);
  }
};
