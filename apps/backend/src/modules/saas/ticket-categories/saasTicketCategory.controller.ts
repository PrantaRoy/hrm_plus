import { RequestHandler } from "express";
import { createTicketCategorySchema, updateTicketCategorySchema } from "../../ticket-categories/ticketCategory.schemas";
import * as ticketCategoryService from "../../ticket-categories/ticketCategory.service";
import { ApiError } from "../../../utils/ApiError";

export const listSaasTicketCategoriesHandler: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await ticketCategoryService.listAllTicketCategories());
  } catch (err) {
    next(err);
  }
};

export const createSaasTicketCategoryHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createTicketCategorySchema.parse(req.body);
    const result = await ticketCategoryService.createTicketCategory(input);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const updateSaasTicketCategoryHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid category id");
    const input = updateTicketCategorySchema.parse(req.body);
    const result = await ticketCategoryService.updateTicketCategory(id, input);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const deleteSaasTicketCategoryHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid category id");
    await ticketCategoryService.deleteTicketCategory(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
