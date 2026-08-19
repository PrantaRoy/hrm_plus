import { RequestHandler } from "express";
import {
  bankExportQuerySchema,
  decidePayrollRunSchema,
  generateDraftPayrollRunSchema,
  listPayrollRunsQuerySchema,
} from "./payrollRun.schemas";
import * as payrollRunService from "./payrollRun.service";
import { getLatestIrdPaydayFiling } from "./irdPaydayFiling";
import { ApiError } from "../../utils/ApiError";

function parseRunId(req: Parameters<RequestHandler>[0]): number {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw ApiError.badRequest("Invalid payroll run id");
  return id;
}

export const listPayrollRunsHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listPayrollRunsQuerySchema.parse(req.query);
    res.json(await payrollRunService.listPayrollRuns(req.prisma!, query));
  } catch (err) {
    next(err);
  }
};

export const getPayrollRunHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await payrollRunService.getPayrollRunById(req.prisma!, parseRunId(req)));
  } catch (err) {
    next(err);
  }
};

export const listRunPayslipsHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await payrollRunService.listPayslipsForRun(req.prisma!, parseRunId(req)));
  } catch (err) {
    next(err);
  }
};

export const generateDraftPayrollRunHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = generateDraftPayrollRunSchema.parse(req.body);
    const run = await payrollRunService.generateDraftPayrollRun(
      req.prisma!,
      input.payCycleId,
      new Date(input.periodStart),
      new Date(input.periodEnd),
      new Date(input.paymentDate),
      req.user!.id
    );
    res.status(201).json(run);
  } catch (err) {
    next(err);
  }
};

export const submitPayrollForPaymentHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await payrollRunService.submitPayrollForPayment(req.prisma!, parseRunId(req), req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const bankExportHandler: RequestHandler = async (req, res, next) => {
  try {
    const { format } = bankExportQuerySchema.parse(req.query);
    const file = await payrollRunService.exportBankFile(req.prisma!, parseRunId(req), format);
    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${file.fileName}"`);
    res.send(file.content);
  } catch (err) {
    next(err);
  }
};

export const approvePaymentHandler: RequestHandler = async (req, res, next) => {
  try {
    const { reason } = decidePayrollRunSchema.parse(req.body);
    const run = await payrollRunService.decidePayrollRunPayment(
      req.prisma!,
      parseRunId(req),
      "Approve",
      req.user!.id,
      req.tenant!.slug,
      reason
    );
    res.json(run);
  } catch (err) {
    next(err);
  }
};

export const rejectPaymentHandler: RequestHandler = async (req, res, next) => {
  try {
    const { reason } = decidePayrollRunSchema.parse(req.body);
    const run = await payrollRunService.decidePayrollRunPayment(
      req.prisma!,
      parseRunId(req),
      "Reject",
      req.user!.id,
      req.tenant!.slug,
      reason
    );
    res.json(run);
  } catch (err) {
    next(err);
  }
};

export const irdPaydayFilingHandler: RequestHandler = async (req, res, next) => {
  try {
    const filing = await getLatestIrdPaydayFiling(req.prisma!, parseRunId(req));
    if (!filing) throw ApiError.notFound("No IRD payday filing has been prepared for this run yet");
    res.json(filing);
  } catch (err) {
    next(err);
  }
};
