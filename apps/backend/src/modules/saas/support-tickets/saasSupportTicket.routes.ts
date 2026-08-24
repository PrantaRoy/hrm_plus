import { Router } from "express";
import { requireSaasAdmin } from "../saasAuth/saasAuth.middleware";
import { ticketAttachmentUpload } from "../../../middleware/fileUpload";
import {
  getSaasSupportTicketHandler,
  listSaasSupportTicketsHandler,
  replySaasSupportTicketHandler,
  updateSaasSupportTicketStatusHandler,
} from "./saasSupportTicket.controller";

export const saasSupportTicketRouter = Router();
saasSupportTicketRouter.use(requireSaasAdmin);

saasSupportTicketRouter.get("/", listSaasSupportTicketsHandler);
saasSupportTicketRouter.get("/:id", getSaasSupportTicketHandler);
saasSupportTicketRouter.post("/:id/replies", ticketAttachmentUpload.single("attachment"), replySaasSupportTicketHandler);
saasSupportTicketRouter.patch("/:id/status", updateSaasSupportTicketStatusHandler);
