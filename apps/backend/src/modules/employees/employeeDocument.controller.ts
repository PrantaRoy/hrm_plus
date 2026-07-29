import { RequestHandler } from "express";
import { ApiError } from "../../utils/ApiError";
import { createEmployeeDocumentSchema, updateEmployeeDocumentSchema } from "./employeeDocument.schemas";
import * as employeeDocumentService from "./employeeDocument.service";

function parseIds(req: Parameters<RequestHandler>[0]) {
  const employeeId = Number(req.params.id);
  const docId = req.params.docId !== undefined ? Number(req.params.docId) : undefined;
  if (Number.isNaN(employeeId)) throw ApiError.badRequest("Invalid employee id");
  if (docId !== undefined && Number.isNaN(docId)) throw ApiError.badRequest("Invalid document id");
  return { employeeId, docId };
}

export const listEmployeeDocumentsHandler: RequestHandler = async (req, res, next) => {
  try {
    const { employeeId } = parseIds(req);
    const result = await employeeDocumentService.listEmployeeDocuments(req.prisma!, employeeId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getEmployeeDocumentHandler: RequestHandler = async (req, res, next) => {
  try {
    const { employeeId, docId } = parseIds(req);
    const result = await employeeDocumentService.getEmployeeDocumentById(req.prisma!, employeeId, docId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const createEmployeeDocumentHandler: RequestHandler = async (req, res, next) => {
  try {
    const { employeeId } = parseIds(req);
    if (!req.file) throw ApiError.badRequest("Document file is required");
    const input = createEmployeeDocumentSchema.parse(req.body);
    const result = await employeeDocumentService.createEmployeeDocument(req.prisma!, employeeId, input, {
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const updateEmployeeDocumentHandler: RequestHandler = async (req, res, next) => {
  try {
    const { employeeId, docId } = parseIds(req);
    const input = updateEmployeeDocumentSchema.parse(req.body);
    const result = await employeeDocumentService.updateEmployeeDocument(req.prisma!, employeeId, docId!, input);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const deleteEmployeeDocumentHandler: RequestHandler = async (req, res, next) => {
  try {
    const { employeeId, docId } = parseIds(req);
    await employeeDocumentService.deleteEmployeeDocument(req.prisma!, employeeId, docId!);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
