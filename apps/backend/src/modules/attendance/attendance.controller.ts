import { RequestHandler } from "express";
import { ApiError } from "../../utils/ApiError";
import { resolveEmployeeForUser } from "../leave-requests/leaveRequest.service";
import {
  checkInSchema,
  checkOutSchema,
  listAttendanceQuerySchema,
  setEmployeeMethodsSchema,
  updateAttendanceSettingsSchema,
} from "./attendance.schemas";
import * as attendanceService from "./attendance.service";

export const getTodayHandler: RequestHandler = async (req, res, next) => {
  try {
    const employee = await resolveEmployeeForUser(req.prisma!, req.user!.id);
    res.json(await attendanceService.getTodayForEmployee(req.prisma!, employee.id));
  } catch (err) {
    next(err);
  }
};

export const checkInHandler: RequestHandler = async (req, res, next) => {
  try {
    const employee = await resolveEmployeeForUser(req.prisma!, req.user!.id);
    const input = checkInSchema.parse(req.body);
    res.json(await attendanceService.checkIn(req.prisma!, employee.id, input));
  } catch (err) {
    next(err);
  }
};

export const checkOutHandler: RequestHandler = async (req, res, next) => {
  try {
    const employee = await resolveEmployeeForUser(req.prisma!, req.user!.id);
    const input = checkOutSchema.parse(req.body);
    res.json(await attendanceService.checkOut(req.prisma!, employee.id, input));
  } catch (err) {
    next(err);
  }
};

export const startBreakHandler: RequestHandler = async (req, res, next) => {
  try {
    const employee = await resolveEmployeeForUser(req.prisma!, req.user!.id);
    res.json(await attendanceService.startBreak(req.prisma!, employee.id));
  } catch (err) {
    next(err);
  }
};

export const endBreakHandler: RequestHandler = async (req, res, next) => {
  try {
    const employee = await resolveEmployeeForUser(req.prisma!, req.user!.id);
    res.json(await attendanceService.endBreak(req.prisma!, employee.id));
  } catch (err) {
    next(err);
  }
};

export const listMyAttendanceHandler: RequestHandler = async (req, res, next) => {
  try {
    const employee = await resolveEmployeeForUser(req.prisma!, req.user!.id);
    const query = listAttendanceQuerySchema.parse(req.query);
    res.json(await attendanceService.listAttendance(req.prisma!, { ...query, employeeId: employee.id }));
  } catch (err) {
    next(err);
  }
};

export const listAttendanceHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listAttendanceQuerySchema.parse(req.query);
    res.json(await attendanceService.listAttendance(req.prisma!, query));
  } catch (err) {
    next(err);
  }
};

export const getSettingsHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await attendanceService.getAttendanceSettings(req.prisma!));
  } catch (err) {
    next(err);
  }
};

export const updateSettingsHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updateAttendanceSettingsSchema.parse(req.body);
    res.json(await attendanceService.updateAttendanceSettings(req.prisma!, input, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const getEmployeeMethodsHandler: RequestHandler = async (req, res, next) => {
  try {
    const employeeId = Number(req.params.employeeId);
    if (Number.isNaN(employeeId)) throw ApiError.badRequest("Invalid employee id");
    res.json(await attendanceService.getEmployeeMethods(req.prisma!, employeeId));
  } catch (err) {
    next(err);
  }
};

export const setEmployeeMethodsHandler: RequestHandler = async (req, res, next) => {
  try {
    const employeeId = Number(req.params.employeeId);
    if (Number.isNaN(employeeId)) throw ApiError.badRequest("Invalid employee id");
    const input = setEmployeeMethodsSchema.parse(req.body);
    res.json(await attendanceService.setEmployeeMethods(req.prisma!, employeeId, input));
  } catch (err) {
    next(err);
  }
};
