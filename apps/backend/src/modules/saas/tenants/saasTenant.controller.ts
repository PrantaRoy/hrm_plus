import { RequestHandler } from "express";
import { createSaasTenantSchema, updateSaasTenantSchema } from "./saasTenant.schemas";
import * as saasTenantService from "./saasTenant.service";
import { ApiError } from "../../../utils/ApiError";

export const createSaasTenantHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createSaasTenantSchema.parse(req.body);
    const logoUrl = req.file ? `/uploads/logos/${req.file.filename}` : null;
    const result = await saasTenantService.createTenantByAdmin(input, logoUrl);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const listSaasTenantsHandler: RequestHandler = async (_req, res, next) => {
  try {
    const result = await saasTenantService.listSaasTenants();
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const updateSaasTenantHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid tenant id");
    const input = updateSaasTenantSchema.parse(req.body);
    const result = await saasTenantService.updateSaasTenant(id, input);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const toggleSaasTenantStatusHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid tenant id");
    const result = await saasTenantService.toggleTenantStatus(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
