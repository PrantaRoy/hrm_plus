import { RequestHandler } from "express";
import { createDesignationSchema, updateDesignationSchema } from "./designation.schemas";
import * as designationService from "./designation.service";

export const listDesignationsHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await designationService.listDesignations(req.prisma!));
  } catch (err) {
    next(err);
  }
};

export const getDesignationHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await designationService.getDesignationById(req.prisma!, Number(req.params.id)));
  } catch (err) {
    next(err);
  }
};

export const createDesignationHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createDesignationSchema.parse(req.body);
    res.status(201).json(await designationService.createDesignation(req.prisma!, input));
  } catch (err) {
    next(err);
  }
};

export const updateDesignationHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updateDesignationSchema.parse(req.body);
    res.json(await designationService.updateDesignation(req.prisma!, Number(req.params.id), input));
  } catch (err) {
    next(err);
  }
};

export const deleteDesignationHandler: RequestHandler = async (req, res, next) => {
  try {
    await designationService.deleteDesignation(req.prisma!, Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
