import { RequestHandler } from "express";
import {
  createEmployeeSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
} from "./employee.schemas";
import * as employeeService from "./employee.service";
import { ApiError } from "../../utils/ApiError";

export const listEmployeesHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listEmployeesQuerySchema.parse(req.query);
    const result = await employeeService.listEmployees(req.prisma!, query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getEmployeeHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid employee id");
    const result = await employeeService.getEmployeeById(req.prisma!, id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const createEmployeeHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createEmployeeSchema.parse(req.body);
    const result = await employeeService.createEmployee(req.prisma!, input);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const updateEmployeeHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid employee id");
    const input = updateEmployeeSchema.parse(req.body);
    const result = await employeeService.updateEmployee(req.prisma!, id, input);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const resetEmployeePasswordHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid employee id");
    const result = await employeeService.resetEmployeePassword(req.prisma!, id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const uploadEmployeeAvatarHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid employee id");
    if (!req.file) throw ApiError.badRequest("Avatar file is required");
    const result = await employeeService.setEmployeeAvatar(req.prisma!, id, {
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};
