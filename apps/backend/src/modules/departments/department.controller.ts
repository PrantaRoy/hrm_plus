import { RequestHandler } from "express";
import { createDepartmentSchema } from "./department.schemas";
import * as departmentService from "./department.service";

export const listDepartmentsHandler: RequestHandler = async (req, res, next) => {
  try {
    const result = await departmentService.listDepartments(req.prisma!);
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
