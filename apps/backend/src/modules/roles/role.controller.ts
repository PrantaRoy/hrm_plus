import { RequestHandler } from "express";
import { createRoleSchema, updateRoleSchema } from "./role.schemas";
import * as roleService from "./role.service";

export const listRolesHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await roleService.listRoles(req.prisma!));
  } catch (err) {
    next(err);
  }
};

export const getRoleHandler: RequestHandler = async (req, res, next) => {
  try {
    res.json(await roleService.getRoleById(req.prisma!, Number(req.params.id)));
  } catch (err) {
    next(err);
  }
};

export const createRoleHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createRoleSchema.parse(req.body);
    res.status(201).json(await roleService.createRole(req.prisma!, input));
  } catch (err) {
    next(err);
  }
};

export const updateRoleHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = updateRoleSchema.parse(req.body);
    res.json(await roleService.updateRole(req.prisma!, Number(req.params.id), input));
  } catch (err) {
    next(err);
  }
};

export const deleteRoleHandler: RequestHandler = async (req, res, next) => {
  try {
    await roleService.deleteRole(req.prisma!, Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
