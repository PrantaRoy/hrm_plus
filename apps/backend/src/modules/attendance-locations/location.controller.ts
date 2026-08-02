import { RequestHandler } from "express";
import { createLocationSchema, updateLocationSchema } from "./location.schemas";
import * as locationService from "./location.service";

export const listLocationsHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await locationService.listLocations(req.prisma!));
  } catch (err) {
    next(err);
  }
};

export const createLocationHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createLocationSchema.parse(req.body);
    res.status(201).json(await locationService.createLocation(req.prisma!, input));
  } catch (err) {
    next(err);
  }
};

export const updateLocationHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updateLocationSchema.parse(req.body);
    res.json(await locationService.updateLocation(req.prisma!, Number(req.params.id), input));
  } catch (err) {
    next(err);
  }
};

export const deleteLocationHandler: RequestHandler = async (req, res, next) => {
  try {
    await locationService.deleteLocation(req.prisma!, Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
