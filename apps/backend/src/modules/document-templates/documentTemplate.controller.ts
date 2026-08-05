import { RequestHandler } from "express";
import {
  createDocumentTemplateSchema,
  listDocumentTemplatesQuerySchema,
  updateDocumentTemplateSchema,
} from "./documentTemplate.schemas";
import * as documentTemplateService from "./documentTemplate.service";

export const listDocumentCategoriesHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await documentTemplateService.listDocumentCategories(req.prisma!));
  } catch (err) {
    next(err);
  }
};

export const listDocumentTemplatesHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listDocumentTemplatesQuerySchema.parse(req.query);
    res.json(await documentTemplateService.listDocumentTemplates(req.prisma!, req.user!, query));
  } catch (err) {
    next(err);
  }
};

export const getDocumentTemplateHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(
      await documentTemplateService.getDocumentTemplateById(req.prisma!, Number(req.params.id), req.user!)
    );
  } catch (err) {
    next(err);
  }
};

export const createDocumentTemplateHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createDocumentTemplateSchema.parse(req.body);
    res.status(201).json(await documentTemplateService.createDocumentTemplate(req.prisma!, input, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const updateDocumentTemplateHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updateDocumentTemplateSchema.parse(req.body);
    res.json(
      await documentTemplateService.updateDocumentTemplate(
        req.prisma!,
        Number(req.params.id),
        input,
        req.user!.id
      )
    );
  } catch (err) {
    next(err);
  }
};

export const disableDocumentTemplateHandler: RequestHandler = async (req, res, next) => {
  try {
    await documentTemplateService.disableDocumentTemplate(req.prisma!, Number(req.params.id), req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
