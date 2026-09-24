import { RequestHandler } from "express";
import {
  bulkImportEmployeesFieldsSchema,
  createEmployeeSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
} from "./employee.schemas";
import * as employeeService from "./employee.service";
import { bulkImportEmployees, generateBulkImportTemplate } from "./employeeBulkImport.service";
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

export const downloadBulkImportTemplateHandler: RequestHandler = (_req, res) => {
  const file = generateBulkImportTemplate();
  res.setHeader("Content-Type", file.mimeType);
  res.setHeader("Content-Disposition", `attachment; filename="${file.fileName}"`);
  res.send(file.content);
};

export const bulkImportEmployeesHandler: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) throw ApiError.badRequest("File is required");
    const fields = bulkImportEmployeesFieldsSchema.parse(req.body);
    const result = await bulkImportEmployees(req.prisma!, {
      fileBuffer: req.file.buffer,
      fileName: req.file.originalname,
      role: fields.role,
      departmentId: fields.departmentId ?? null,
      designationId: fields.designationId ?? null,
    });
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

export const uploadEmployeeSignatureHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid employee id");
    if (!req.file) throw ApiError.badRequest("Signature file is required");
    const result = await employeeService.setEmployeeSignature(req.prisma!, id, {
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
    });
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
