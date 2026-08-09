import { RequestHandler } from "express";
import { createLegalPageSchema, updateLegalPageSchema } from "./legalPage.schemas";
import * as legalPageService from "./legalPage.service";
import { ApiError } from "../../utils/ApiError";

export const listLegalPagesHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await legalPageService.listLegalPages(req.prisma!));
  } catch (err) {
    next(err);
  }
};

export const getLegalPageHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid legal page id");
    res.json(await legalPageService.getLegalPageById(req.prisma!, id));
  } catch (err) {
    next(err);
  }
};

export const createLegalPageHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createLegalPageSchema.parse(req.body);
    res.status(201).json(await legalPageService.createLegalPage(req.prisma!, input));
  } catch (err) {
    next(err);
  }
};

export const updateLegalPageHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid legal page id");
    const input = updateLegalPageSchema.parse(req.body);
    res.json(await legalPageService.updateLegalPage(req.prisma!, id, input, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const deleteLegalPageHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid legal page id");
    await legalPageService.deleteLegalPage(req.prisma!, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
