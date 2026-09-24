import { RequestHandler } from "express";
import { generateWorkReportsSchema, listWorkReportsQuerySchema, updateWorkReportSchema } from "./workReport.schemas";
import * as workReportService from "./workReport.service";
import { ApiError } from "../../utils/ApiError";

export const listWorkReportsHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listWorkReportsQuerySchema.parse(req.query);
    res.json(await workReportService.listWorkReports(req.prisma!, query));
  } catch (err) {
    next(err);
  }
};

export const getWorkReportHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid work report id");
    res.json(await workReportService.getWorkReportById(req.prisma!, id));
  } catch (err) {
    next(err);
  }
};

export const generateWorkReportsHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = generateWorkReportsSchema.parse(req.body);
    const reports = await workReportService.generateWorkReportsForPeriod(
      req.prisma!,
      input.payCycleId,
      new Date(input.periodStart),
      new Date(input.periodEnd),
      req.user!.id
    );
    res.status(201).json(reports);
  } catch (err) {
    next(err);
  }
};

export const approveWorkReportHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid work report id");
    res.json(await workReportService.approveWorkReport(req.prisma!, id, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const updateWorkReportHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid work report id");
    const input = updateWorkReportSchema.parse(req.body);
    res.json(await workReportService.updateWorkReport(req.prisma!, id, input));
  } catch (err) {
    next(err);
  }
};

export const deleteWorkReportHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid work report id");
    await workReportService.deleteWorkReport(req.prisma!, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
