import { RequestHandler } from "express";
import * as payslipService from "./payslip.service";
import { ApiError } from "../../utils/ApiError";

export const listMyPayslipsHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await payslipService.listMyPayslips(req.prisma!, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const getMyPayslipHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid payslip id");
    res.json(await payslipService.getMyPayslipById(req.prisma!, req.user!.id, id));
  } catch (err) {
    next(err);
  }
};
