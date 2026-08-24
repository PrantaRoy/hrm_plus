import { RequestHandler } from "express";
import { ApiError } from "../../../utils/ApiError";
import {
  createTicketReplySchema,
  listSaasTicketsQuerySchema,
  updateTicketStatusSchema,
} from "../../support-tickets/supportTicket.schemas";
import * as supportTicketService from "../../support-tickets/supportTicket.service";

function readAttachment(req: Parameters<RequestHandler>[0]) {
  const file = req.file;
  if (!file) return undefined;
  return { buffer: file.buffer, originalName: file.originalname, mimeType: file.mimetype };
}

export const listSaasSupportTicketsHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listSaasTicketsQuerySchema.parse(req.query);
    const result = await supportTicketService.listSaasTickets(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getSaasSupportTicketHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid ticket id");
    const result = await supportTicketService.getSaasTicketById(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const replySaasSupportTicketHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid ticket id");
    const input = createTicketReplySchema.parse(req.body);
    const result = await supportTicketService.addSaasReply(
      id,
      { id: req.saasAdmin!.id, email: req.saasAdmin!.email },
      input,
      readAttachment(req)
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const updateSaasSupportTicketStatusHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid ticket id");
    const input = updateTicketStatusSchema.parse(req.body);
    const result = await supportTicketService.updateTicketStatus(id, input.status);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
