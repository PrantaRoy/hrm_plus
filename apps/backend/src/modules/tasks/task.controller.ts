import { RequestHandler } from "express";
import { resolveActor } from "../projects/projectAccess";
import {
  createTaskSchema,
  listTasksQuerySchema,
  setTaskPeopleSchema,
  taskIdParamSchema,
  updateTaskSchema,
} from "./task.schemas";
import { getMyWorkDashboard } from "./myWorkDashboard.service";
import * as taskService from "./task.service";

export const listTasksHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listTasksQuerySchema.parse(req.query);
    const actor = await resolveActor(req.prisma!, req.user!);
    res.json(await taskService.listTasks(req.prisma!, actor, query));
  } catch (err) {
    next(err);
  }
};

export const listMyTasksHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listTasksQuerySchema.parse(req.query);
    const actor = await resolveActor(req.prisma!, req.user!);
    res.json(await taskService.listMyTasks(req.prisma!, actor, query));
  } catch (err) {
    next(err);
  }
};

export const getMyWorkDashboardHandler: RequestHandler = async (req, res, next) => {
  try {
    const actor = await resolveActor(req.prisma!, req.user!);
    res.json(await getMyWorkDashboard(req.prisma!, actor));
  } catch (err) {
    next(err);
  }
};

export const getTaskHandler: RequestHandler = async (req, res, next) => {
  try {
    const { id } = taskIdParamSchema.parse(req.params);
    const actor = await resolveActor(req.prisma!, req.user!);
    res.json(await taskService.getTask(req.prisma!, actor, id));
  } catch (err) {
    next(err);
  }
};

export const createTaskHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createTaskSchema.parse(req.body);
    const actor = await resolveActor(req.prisma!, req.user!);
    res.status(201).json(await taskService.createTask(req.prisma!, actor, input));
  } catch (err) {
    next(err);
  }
};

export const updateTaskHandler: RequestHandler = async (req, res, next) => {
  try {
    const { id } = taskIdParamSchema.parse(req.params);
    const input = updateTaskSchema.parse(req.body);
    const actor = await resolveActor(req.prisma!, req.user!);
    res.json(await taskService.updateTask(req.prisma!, actor, id, input));
  } catch (err) {
    next(err);
  }
};

export const deleteTaskHandler: RequestHandler = async (req, res, next) => {
  try {
    const { id } = taskIdParamSchema.parse(req.params);
    const actor = await resolveActor(req.prisma!, req.user!);
    await taskService.deleteTask(req.prisma!, actor, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

function setPeopleHandler(kind: "members" | "followers"): RequestHandler {
  return async (req, res, next) => {
    try {
      const { id } = taskIdParamSchema.parse(req.params);
      const { employeeIds } = setTaskPeopleSchema.parse(req.body);
      const actor = await resolveActor(req.prisma!, req.user!);
      res.json(await taskService.setTaskPeople(req.prisma!, actor, id, kind, employeeIds));
    } catch (err) {
      next(err);
    }
  };
}

export const setTaskMembersHandler = setPeopleHandler("members");
export const setTaskFollowersHandler = setPeopleHandler("followers");
