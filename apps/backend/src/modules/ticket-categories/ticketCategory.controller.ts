import { RequestHandler } from "express";
import * as ticketCategoryService from "./ticketCategory.service";

export const listActiveTicketCategoriesHandler: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await ticketCategoryService.listActiveTicketCategories());
  } catch (err) {
    next(err);
  }
};
