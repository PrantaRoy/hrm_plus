import { RequestHandler } from "express";
import {
  createProjectSchema,
  listProjectsQuerySchema,
  projectIdParamSchema,
  setProjectMembersSchema,
  updateProjectSchema,
} from "./project.schemas";
import { resolveActor } from "./projectAccess";
import * as projectService from "./project.service";

export const listProjectsHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listProjectsQuerySchema.parse(req.query);
    const actor = await resolveActor(req.prisma!, req.user!);
    res.json(await projectService.listProjects(req.prisma!, actor, query));
  } catch (err) {
    next(err);
  }
};

export const getProjectHandler: RequestHandler = async (req, res, next) => {
  try {
    const { id } = projectIdParamSchema.parse(req.params);
    const actor = await resolveActor(req.prisma!, req.user!);
    res.json(await projectService.getProject(req.prisma!, actor, id));
  } catch (err) {
    next(err);
  }
};

export const createProjectHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createProjectSchema.parse(req.body);
    const actor = await resolveActor(req.prisma!, req.user!);
    res.status(201).json(await projectService.createProject(req.prisma!, actor, input));
  } catch (err) {
    next(err);
  }
};

export const updateProjectHandler: RequestHandler = async (req, res, next) => {
  try {
    const { id } = projectIdParamSchema.parse(req.params);
    const input = updateProjectSchema.parse(req.body);
    const actor = await resolveActor(req.prisma!, req.user!);
    res.json(await projectService.updateProject(req.prisma!, actor, id, input));
  } catch (err) {
    next(err);
  }
};

export const setProjectMembersHandler: RequestHandler = async (req, res, next) => {
  try {
    const { id } = projectIdParamSchema.parse(req.params);
    const { employeeIds } = setProjectMembersSchema.parse(req.body);
    const actor = await resolveActor(req.prisma!, req.user!);
    res.json(await projectService.setProjectMembers(req.prisma!, actor, id, employeeIds));
  } catch (err) {
    next(err);
  }
};

export const deleteProjectHandler: RequestHandler = async (req, res, next) => {
  try {
    const { id } = projectIdParamSchema.parse(req.params);
    const actor = await resolveActor(req.prisma!, req.user!);
    await projectService.deleteProject(req.prisma!, actor, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
