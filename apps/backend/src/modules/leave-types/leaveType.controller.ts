import { RequestHandler } from "express";
import { createLeaveTypeSchema, updateLeaveTypeSchema } from "./leaveType.schemas";
import * as leaveTypeService from "./leaveType.service";

export const listLeaveTypesHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await leaveTypeService.listLeaveTypes(req.prisma!));
  } catch (err) {
    next(err);
  }
};

export const getLeaveTypeHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await leaveTypeService.getLeaveTypeById(req.prisma!, Number(req.params.id)));
  } catch (err) {
    next(err);
  }
};

export const createLeaveTypeHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createLeaveTypeSchema.parse(req.body);
    res.status(201).json(await leaveTypeService.createLeaveType(req.prisma!, input));
  } catch (err) {
    next(err);
  }
};

export const updateLeaveTypeHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updateLeaveTypeSchema.parse(req.body);
    res.json(await leaveTypeService.updateLeaveType(req.prisma!, Number(req.params.id), input));
  } catch (err) {
    next(err);
  }
};

export const deleteLeaveTypeHandler: RequestHandler = async (req, res, next) => {
  try {
    await leaveTypeService.deleteLeaveType(req.prisma!, Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
