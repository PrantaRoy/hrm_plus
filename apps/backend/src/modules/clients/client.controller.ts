import { RequestHandler } from "express";
import {
  clientIdParamSchema,
  createClientSchema,
  listClientsQuerySchema,
  updateClientSchema,
} from "./client.schemas";
import * as clientService from "./client.service";

export const listClientsHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listClientsQuerySchema.parse(req.query);
    res.json(await clientService.listClients(req.prisma!, query));
  } catch (err) {
    next(err);
  }
};

export const getClientHandler: RequestHandler = async (req, res, next) => {
  try {
    const { id } = clientIdParamSchema.parse(req.params);
    res.json(await clientService.getClient(req.prisma!, id));
  } catch (err) {
    next(err);
  }
};

export const createClientHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createClientSchema.parse(req.body);
    res.status(201).json(await clientService.createClient(req.prisma!, input));
  } catch (err) {
    next(err);
  }
};

export const updateClientHandler: RequestHandler = async (req, res, next) => {
  try {
    const { id } = clientIdParamSchema.parse(req.params);
    const input = updateClientSchema.parse(req.body);
    res.json(await clientService.updateClient(req.prisma!, id, input));
  } catch (err) {
    next(err);
  }
};

export const deleteClientHandler: RequestHandler = async (req, res, next) => {
  try {
    const { id } = clientIdParamSchema.parse(req.params);
    await clientService.deleteClient(req.prisma!, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
