import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { ticketAttachmentUpload } from "../../middleware/fileUpload";
import {
  createSupportTicketHandler,
  getMySupportTicketHandler,
  listMySupportTicketsHandler,
  replyToMySupportTicketHandler,
} from "./supportTicket.controller";

export const supportTicketRouter = Router();

supportTicketRouter.use(requireAuth, requireRole("Admin"));

supportTicketRouter.get("/", listMySupportTicketsHandler);
supportTicketRouter.post("/", ticketAttachmentUpload.single("attachment"), createSupportTicketHandler);
supportTicketRouter.get("/:id", getMySupportTicketHandler);
supportTicketRouter.post("/:id/replies", ticketAttachmentUpload.single("attachment"), replyToMySupportTicketHandler);
