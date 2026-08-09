import { RequestHandler } from "express";
import { createSocialLinkSchema, reorderSocialLinksSchema, updateSocialLinkSchema } from "./socialLink.schemas";
import * as socialLinkService from "./socialLink.service";
import { ApiError } from "../../utils/ApiError";

export const listSocialLinksHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await socialLinkService.listSocialLinks(req.prisma!));
  } catch (err) {
    next(err);
  }
};

export const createSocialLinkHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createSocialLinkSchema.parse(req.body);
    res.status(201).json(await socialLinkService.createSocialLink(req.prisma!, input));
  } catch (err) {
    next(err);
  }
};

export const updateSocialLinkHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid social link id");
    const input = updateSocialLinkSchema.parse(req.body);
    res.json(await socialLinkService.updateSocialLink(req.prisma!, id, input));
  } catch (err) {
    next(err);
  }
};

export const deleteSocialLinkHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid social link id");
    await socialLinkService.deleteSocialLink(req.prisma!, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const reorderSocialLinksHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = reorderSocialLinksSchema.parse(req.body);
    res.json(await socialLinkService.reorderSocialLinks(req.prisma!, input.orderedIds));
  } catch (err) {
    next(err);
  }
};
