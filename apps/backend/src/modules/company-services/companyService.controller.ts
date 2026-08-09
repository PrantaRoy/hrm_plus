import { RequestHandler } from "express";
import {
  createCompanyServiceSchema,
  reorderCompanyServicesSchema,
  updateCompanyServiceSchema,
} from "./companyService.schemas";
import * as companyServiceService from "./companyService.service";
import { ApiError } from "../../utils/ApiError";

export const listCompanyServicesHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await companyServiceService.listCompanyServices(req.prisma!));
  } catch (err) {
    next(err);
  }
};

export const getCompanyServiceHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid service id");
    res.json(await companyServiceService.getCompanyServiceById(req.prisma!, id));
  } catch (err) {
    next(err);
  }
};

export const createCompanyServiceHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createCompanyServiceSchema.parse(req.body);
    res.status(201).json(await companyServiceService.createCompanyService(req.prisma!, input));
  } catch (err) {
    next(err);
  }
};

export const updateCompanyServiceHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid service id");
    const input = updateCompanyServiceSchema.parse(req.body);
    res.json(await companyServiceService.updateCompanyService(req.prisma!, id, input));
  } catch (err) {
    next(err);
  }
};

export const deleteCompanyServiceHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid service id");
    await companyServiceService.deleteCompanyService(req.prisma!, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const reorderCompanyServicesHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = reorderCompanyServicesSchema.parse(req.body);
    res.json(await companyServiceService.reorderCompanyServices(req.prisma!, input.orderedIds));
  } catch (err) {
    next(err);
  }
};
