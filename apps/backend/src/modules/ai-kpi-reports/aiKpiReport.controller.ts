import { RequestHandler } from "express";
import { generateAiKpiReportSchema, listAiKpiReportsQuerySchema } from "./aiKpiReport.schemas";
import * as aiKpiReportService from "./aiKpiReport.service";

const parseId = (raw: string) => Number(raw);

export const generateAiKpiReportHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = generateAiKpiReportSchema.parse(req.body);
    res.status(201).json(await aiKpiReportService.generateAiKpiReport(req.prisma!, input, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const listAiKpiReportsHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listAiKpiReportsQuerySchema.parse(req.query);
    res.json(await aiKpiReportService.listAiKpiReports(req.prisma!, query));
  } catch (err) {
    next(err);
  }
};

export const getAiKpiReportHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await aiKpiReportService.getAiKpiReport(req.prisma!, parseId(req.params.id)));
  } catch (err) {
    next(err);
  }
};

export const deleteAiKpiReportHandler: RequestHandler = async (req, res, next) => {
  try {
    await aiKpiReportService.deleteAiKpiReport(req.prisma!, parseId(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
