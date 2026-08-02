import { RequestHandler } from "express";
import { ApiError } from "../../utils/ApiError";
import { resolveEmployeeForUser } from "../leave-requests/leaveRequest.service";
import {
  checkInSchema,
  checkOutSchema,
  listAttendanceQuerySchema,
  setEmployeeMethodsSchema,
  setEmployeeRulesSchema,
  updateAttendanceSettingsSchema,
  worksheetQuerySchema,
} from "./attendance.schemas";
import * as attendanceService from "./attendance.service";
import * as restrictionsService from "./attendanceRestrictions.service";

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
    res.json(await attendanceService.checkIn(req.prisma!, employee.id, { ...input, clientIp: req.ip ?? null }));
  } catch (err) {
    next(err);
  }
};

export const checkOutHandler: RequestHandler = async (req, res, next) => {
  try {
    const employee = await resolveEmployeeForUser(req.prisma!, req.user!.id);
    const input = checkOutSchema.parse(req.body);
    res.json(await attendanceService.checkOut(req.prisma!, employee.id, { ...input, clientIp: req.ip ?? null }));
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

export const getWorksheetHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = worksheetQuerySchema.parse(req.query);
    res.json(await attendanceService.getWorksheet(req.prisma!, query));
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

export const getEmployeeRulesHandler: RequestHandler = async (req, res, next) => {
  try {
    const employeeId = Number(req.params.employeeId);
    if (Number.isNaN(employeeId)) throw ApiError.badRequest("Invalid employee id");
    res.json(await restrictionsService.getEmployeeRules(req.prisma!, employeeId));
  } catch (err) {
    next(err);
  }
};

export const setEmployeeRulesHandler: RequestHandler = async (req, res, next) => {
  try {
    const employeeId = Number(req.params.employeeId);
    if (Number.isNaN(employeeId)) throw ApiError.badRequest("Invalid employee id");
    const input = setEmployeeRulesSchema.parse(req.body);
    res.json(await restrictionsService.setEmployeeRules(req.prisma!, employeeId, input));
  } catch (err) {
    next(err);
  }
};

export const listEmployeeDevicesHandler: RequestHandler = async (req, res, next) => {
  try {
    const employeeId = Number(req.params.employeeId);
    if (Number.isNaN(employeeId)) throw ApiError.badRequest("Invalid employee id");
    res.json(await restrictionsService.listEmployeeDevices(req.prisma!, employeeId));
  } catch (err) {
    next(err);
  }
};

export const approveDeviceHandler: RequestHandler = async (req, res, next) => {
  try {
    const employeeId = Number(req.params.employeeId);
    const deviceId = Number(req.params.deviceId);
    if (Number.isNaN(employeeId) || Number.isNaN(deviceId)) throw ApiError.badRequest("Invalid id");
    res.json(await restrictionsService.approveDevice(req.prisma!, employeeId, deviceId, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const rejectDeviceHandler: RequestHandler = async (req, res, next) => {
  try {
    const employeeId = Number(req.params.employeeId);
    const deviceId = Number(req.params.deviceId);
    if (Number.isNaN(employeeId) || Number.isNaN(deviceId)) throw ApiError.badRequest("Invalid id");
    res.json(await restrictionsService.rejectDevice(req.prisma!, employeeId, deviceId));
  } catch (err) {
    next(err);
  }
};
