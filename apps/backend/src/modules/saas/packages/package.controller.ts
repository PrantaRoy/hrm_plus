import { RequestHandler } from "express";
import { createPackageSchema, updatePackageSchema } from "./package.schemas";
import * as packageService from "./package.service";
import { ApiError } from "../../../utils/ApiError";

export const listPublicPackagesHandler: RequestHandler = async (_req, res, next) => {
  try {
    const result = await packageService.listPackages(true);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const listAdminPackagesHandler: RequestHandler = async (_req, res, next) => {
  try {
    const result = await packageService.listPackages(false);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const createPackageHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createPackageSchema.parse(req.body);
    const result = await packageService.createPackage(input);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const updatePackageHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid package id");
    const input = updatePackageSchema.parse(req.body);
    const result = await packageService.updatePackage(id, input);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const deletePackageHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid package id");
    await packageService.deletePackage(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
