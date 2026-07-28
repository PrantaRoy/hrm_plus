import { RequestHandler } from "express";
import { createDepartmentSchema, updateDepartmentSchema } from "./department.schemas";
import * as departmentService from "./department.service";

export const listDepartmentsHandler: RequestHandler = async (req, res, next) => {
  try {
    const result = await departmentService.listDepartments(req.prisma!);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getDepartmentHandler: RequestHandler = async (req, res, next) => {
  try {
    const result = await departmentService.getDepartmentById(req.prisma!, Number(req.params.id));
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const createDepartmentHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createDepartmentSchema.parse(req.body);
    const result = await departmentService.createDepartment(req.prisma!, input);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const updateDepartmentHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updateDepartmentSchema.parse(req.body);
    const result = await departmentService.updateDepartment(req.prisma!, Number(req.params.id), input);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const deleteDepartmentHandler: RequestHandler = async (req, res, next) => {
  try {
    await departmentService.deleteDepartment(req.prisma!, Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
