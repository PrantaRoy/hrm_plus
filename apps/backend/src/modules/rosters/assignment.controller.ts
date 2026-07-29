import { RequestHandler } from "express";
import { createAssignmentSchema, listAssignmentsQuerySchema, updateAssignmentSchema } from "./assignment.schemas";
import * as assignmentService from "./assignment.service";

export const listAssignmentsHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listAssignmentsQuerySchema.parse(req.query);
    res.json(await assignmentService.listAssignments(req.prisma!, Number(req.params.id), query));
  } catch (err) {
    next(err);
  }
};

export const createAssignmentHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createAssignmentSchema.parse(req.body);
    res
      .status(201)
      .json(await assignmentService.createAssignment(req.prisma!, Number(req.params.id), input, req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const updateAssignmentHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updateAssignmentSchema.parse(req.body);
    res.json(
      await assignmentService.updateAssignment(
        req.prisma!,
        Number(req.params.id),
        Number(req.params.assignmentId),
        input,
        req.user!.id
      )
    );
  } catch (err) {
    next(err);
  }
};

export const deleteAssignmentHandler: RequestHandler = async (req, res, next) => {
  try {
    await assignmentService.deleteAssignment(req.prisma!, Number(req.params.id), Number(req.params.assignmentId));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
