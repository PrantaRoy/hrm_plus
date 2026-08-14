import { RequestHandler } from "express";
import {
  assignAssetSchema,
  createAssetSchema,
  listAssetsQuerySchema,
  returnAssetSchema,
  updateAssetSchema,
} from "./asset.schemas";
import * as assetService from "./asset.service";
import { ApiError } from "../../utils/ApiError";

function parseId(raw: string): number {
  const id = Number(raw);
  if (Number.isNaN(id)) throw ApiError.badRequest("Invalid asset id");
  return id;
}

export const listAssetsHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listAssetsQuerySchema.parse(req.query);
    res.json(await assetService.listAssets(req.prisma!, query));
  } catch (err) {
    next(err);
  }
};

export const getAssetHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await assetService.getAssetById(req.prisma!, parseId(req.params.id)));
  } catch (err) {
    next(err);
  }
};

export const createAssetHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createAssetSchema.parse(req.body);
    res.status(201).json(await assetService.createAsset(req.prisma!, input, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const updateAssetHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updateAssetSchema.parse(req.body);
    res.json(await assetService.updateAsset(req.prisma!, parseId(req.params.id), input, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const retireAssetHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await assetService.retireAsset(req.prisma!, parseId(req.params.id), req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const assignAssetHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = assignAssetSchema.parse(req.body);
    res.json(await assetService.assignAsset(req.prisma!, parseId(req.params.id), input, req.user!));
  } catch (err) {
    next(err);
  }
};

export const returnAssetHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = returnAssetSchema.parse(req.body ?? {});
    res.json(await assetService.returnAsset(req.prisma!, parseId(req.params.id), input, req.user!));
  } catch (err) {
    next(err);
  }
};

export const listAssetsForEmployeeHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await assetService.listAssetsForEmployee(req.prisma!, parseId(req.params.employeeId)));
  } catch (err) {
    next(err);
  }
};

export const startOffboardingChecklistHandler: RequestHandler = async (req, res, next) => {
  try {
    res.status(201).json(
      await assetService.startOffboardingChecklist(req.prisma!, parseId(req.params.employeeId), req.user!)
    );
  } catch (err) {
    next(err);
  }
};
