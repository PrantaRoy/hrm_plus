import { RequestHandler } from "express";
import { createLeaveAllocationSchema, updateLeaveAllocationSchema } from "./leaveAllocation.schemas";
import * as leaveAllocationService from "./leaveAllocation.service";

export const listLeaveAllocationsHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await leaveAllocationService.listAllocationsForEmployee(req.prisma!, Number(req.params.id)));
  } catch (err) {
    next(err);
  }
};

export const getLeaveAllocationHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(
      await leaveAllocationService.getAllocationById(
        req.prisma!,
        Number(req.params.id),
        Number(req.params.allocationId)
      )
    );
  } catch (err) {
    next(err);
  }
};

export const createLeaveAllocationHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createLeaveAllocationSchema.parse(req.body);
    res
      .status(201)
      .json(await leaveAllocationService.createAllocation(req.prisma!, Number(req.params.id), input, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const updateLeaveAllocationHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updateLeaveAllocationSchema.parse(req.body);
    res.json(
      await leaveAllocationService.updateAllocation(
        req.prisma!,
        Number(req.params.id),
        Number(req.params.allocationId),
        input,
        req.user!.id
      )
    );
  } catch (err) {
    next(err);
  }
};

export const deleteLeaveAllocationHandler: RequestHandler = async (req, res, next) => {
  try {
    await leaveAllocationService.deleteAllocation(req.prisma!, Number(req.params.id), Number(req.params.allocationId));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
