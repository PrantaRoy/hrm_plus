import { RequestHandler } from "express";
import {
  createLeaveRequestSchema,
  decideLeaveRequestSchema,
  listLeaveRequestsQuerySchema,
  listMyLeaveRequestsQuerySchema,
} from "./leaveRequest.schemas";
import * as leaveRequestService from "./leaveRequest.service";

export const listMyLeaveRequestsHandler: RequestHandler = async (req, res, next) => {
  try {
    const employee = await leaveRequestService.resolveEmployeeForUser(req.prisma!, req.user!.id);
    const query = listMyLeaveRequestsQuerySchema.parse(req.query);
    res.json(await leaveRequestService.listMyLeaveRequests(req.prisma!, employee.id, query));
  } catch (err) {
    next(err);
  }
};

export const listMyAllocationsHandler: RequestHandler = async (req, res, next) => {
  try {
    const employee = await leaveRequestService.resolveEmployeeForUser(req.prisma!, req.user!.id);
    res.json(await leaveRequestService.listActiveAllocationsForEmployee(req.prisma!, employee.id));
  } catch (err) {
    next(err);
  }
};

export const listPendingMyApprovalHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await leaveRequestService.listPendingMyApproval(req.prisma!, req.user!));
  } catch (err) {
    next(err);
  }
};

export const listLeaveRequestsHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listLeaveRequestsQuerySchema.parse(req.query);
    res.json(await leaveRequestService.listLeaveRequests(req.prisma!, query));
  } catch (err) {
    next(err);
  }
};

export const getLeaveRequestHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await leaveRequestService.getLeaveRequestById(req.prisma!, Number(req.params.id), req.user!));
  } catch (err) {
    next(err);
  }
};

export const createLeaveRequestHandler: RequestHandler = async (req, res, next) => {
  try {
    const employee = await leaveRequestService.resolveEmployeeForUser(req.prisma!, req.user!.id);
    const input = createLeaveRequestSchema.parse(req.body);
    res
      .status(201)
      .json(await leaveRequestService.createLeaveRequest(req.prisma!, employee.id, input, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const approveLeaveRequestHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = decideLeaveRequestSchema.parse(req.body ?? {});
    res.json(
      await leaveRequestService.decideLeaveRequest(
        req.prisma!,
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

export const rejectLeaveRequestHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = decideLeaveRequestSchema.parse(req.body ?? {});
    res.json(
      await leaveRequestService.decideLeaveRequest(
        req.prisma!,
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

export const cancelLeaveRequestHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await leaveRequestService.cancelLeaveRequest(req.prisma!, Number(req.params.id), req.user!));
  } catch (err) {
    next(err);
  }
};
