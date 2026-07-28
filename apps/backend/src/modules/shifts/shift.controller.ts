import { RequestHandler } from "express";
import { createShiftSchema, updateShiftSchema } from "./shift.schemas";
import * as shiftService from "./shift.service";

export const listShiftsHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await shiftService.listShifts(req.prisma!));
  } catch (err) {
    next(err);
  }
};

export const getShiftHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await shiftService.getShiftById(req.prisma!, Number(req.params.id)));
  } catch (err) {
    next(err);
  }
};

export const createShiftHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createShiftSchema.parse(req.body);
    res.status(201).json(await shiftService.createShift(req.prisma!, input));
  } catch (err) {
    next(err);
  }
};

export const updateShiftHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updateShiftSchema.parse(req.body);
    res.json(await shiftService.updateShift(req.prisma!, Number(req.params.id), input));
  } catch (err) {
    next(err);
  }
};

export const deleteShiftHandler: RequestHandler = async (req, res, next) => {
  try {
    await shiftService.deleteShift(req.prisma!, Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
