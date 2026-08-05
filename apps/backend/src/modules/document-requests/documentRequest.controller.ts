import { RequestHandler } from "express";
import {
  createDocumentRequestSchema,
  decideDocumentRequestSchema,
  listDocumentRequestsQuerySchema,
  listMyDocumentRequestsQuerySchema,
  updateFieldValuesSchema,
} from "./documentRequest.schemas";
import * as documentRequestService from "./documentRequest.service";

export const listMyDocumentRequestsHandler: RequestHandler = async (req, res, next) => {
  try {
    const employee = await documentRequestService.resolveEmployeeForUser(req.prisma!, req.user!.id);
    const query = listMyDocumentRequestsQuerySchema.parse(req.query);
    res.json(await documentRequestService.listMyDocumentRequests(req.prisma!, employee.id, query));
  } catch (err) {
    next(err);
  }
};

export const listPendingMyApprovalHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await documentRequestService.listPendingMyApproval(req.prisma!, req.user!));
  } catch (err) {
    next(err);
  }
};

export const listDocumentRequestsHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listDocumentRequestsQuerySchema.parse(req.query);
    res.json(await documentRequestService.listDocumentRequests(req.prisma!, query));
  } catch (err) {
    next(err);
  }
};

export const getDocumentRequestHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await documentRequestService.getDocumentRequestById(req.prisma!, Number(req.params.id), req.user!));
  } catch (err) {
    next(err);
  }
};

export const createDocumentRequestHandler: RequestHandler = async (req, res, next) => {
  try {
    const employee = await documentRequestService.resolveEmployeeForUser(req.prisma!, req.user!.id);
    const input = createDocumentRequestSchema.parse(req.body);
    const attachment = req.file
      ? { buffer: req.file.buffer, originalName: req.file.originalname, mimeType: req.file.mimetype }
      : undefined;
    res
      .status(201)
      .json(
        await documentRequestService.createDocumentRequest(
          req.prisma!,
          employee.id,
          input,
          req.user!.id,
          req.user!,
          attachment
        )
      );
  } catch (err) {
    next(err);
  }
};

export const approveDocumentRequestHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = decideDocumentRequestSchema.parse(req.body ?? {});
    res.json(
      await documentRequestService.decideDocumentRequest(
        req.prisma!,
        req.tenant!,
        Number(req.params.id),
        "Approve",
        req.user!,
        input.comment
      )
    );
  } catch (err) {
    next(err);
  }
};

export const rejectDocumentRequestHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = decideDocumentRequestSchema.parse(req.body ?? {});
    res.json(
      await documentRequestService.decideDocumentRequest(
        req.prisma!,
        req.tenant!,
        Number(req.params.id),
        "Reject",
        req.user!,
        input.comment
      )
    );
  } catch (err) {
    next(err);
  }
};

export const cancelDocumentRequestHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await documentRequestService.cancelDocumentRequest(req.prisma!, Number(req.params.id), req.user!));
  } catch (err) {
    next(err);
  }
};

export const retryIssueDocumentRequestHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(
      await documentRequestService.retryIssueDocumentRequest(req.prisma!, req.tenant!, Number(req.params.id))
    );
  } catch (err) {
    next(err);
  }
};

export const updateFieldValuesHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updateFieldValuesSchema.parse(req.body);
    res.json(
      await documentRequestService.updateFieldValues(req.prisma!, Number(req.params.id), input.fieldValues)
    );
  } catch (err) {
    next(err);
  }
};

export const previewDocumentRequestHandler: RequestHandler = async (req, res, next) => {
  try {
    const pdf = await documentRequestService.generatePreviewPdf(
      req.prisma!,
      req.tenant!,
      Number(req.params.id),
      req.user!
    );
    res.type("application/pdf").send(pdf);
  } catch (err) {
    next(err);
  }
};

export const downloadDocumentRequestHandler: RequestHandler = async (req, res, next) => {
  try {
    const url = await documentRequestService.getFinalDocumentUrl(req.prisma!, Number(req.params.id), req.user!);
    res.json({ url });
  } catch (err) {
    next(err);
  }
};
