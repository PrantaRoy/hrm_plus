import { Router } from "express";
import { requireSaasAdmin } from "../saasAuth/saasAuth.middleware";
import {
  createSaasTicketCategoryHandler,
  deleteSaasTicketCategoryHandler,
  listSaasTicketCategoriesHandler,
  updateSaasTicketCategoryHandler,
} from "./saasTicketCategory.controller";

export const saasTicketCategoryRouter = Router();
saasTicketCategoryRouter.use(requireSaasAdmin);

saasTicketCategoryRouter.get("/", listSaasTicketCategoriesHandler);
saasTicketCategoryRouter.post("/", createSaasTicketCategoryHandler);
saasTicketCategoryRouter.patch("/:id", updateSaasTicketCategoryHandler);
saasTicketCategoryRouter.delete("/:id", deleteSaasTicketCategoryHandler);
