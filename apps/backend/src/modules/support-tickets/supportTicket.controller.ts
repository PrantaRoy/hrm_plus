import { RequestHandler } from "express";
import { ApiError } from "../../utils/ApiError";
import {
  createSupportTicketSchema,
  createTicketReplySchema,
  listTenantTicketsQuerySchema,
} from "./supportTicket.schemas";
import * as supportTicketService from "./supportTicket.service";

async function resolveCreatorName(req: Parameters<RequestHandler>[0]): Promise<string> {
  const employee = await req.prisma!.employee.findUnique({ where: { userId: req.user!.id } });
  if (employee) return `${employee.firstName} ${employee.lastName}`;
  return req.user!.email;
}

function readAttachment(req: Parameters<RequestHandler>[0]) {
  const file = req.file;
  if (!file) return undefined;
  return { buffer: file.buffer, originalName: file.originalname, mimeType: file.mimetype };
}

export const createSupportTicketHandler: RequestHandler = async (req, res, next) => {
  try {
    const input = createSupportTicketSchema.parse(req.body);
    const creatorName = await resolveCreatorName(req);
    const result = await supportTicketService.createSupportTicket(
      req.tenant!.id,
      { id: req.user!.id, name: creatorName, email: req.user!.email },
      input,
      readAttachment(req)
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const listMySupportTicketsHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listTenantTicketsQuerySchema.parse(req.query);
    const result = await supportTicketService.listTenantTickets(req.tenant!.id, req.user!.id, query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getMySupportTicketHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid ticket id");
    const result = await supportTicketService.getTenantTicketById(req.tenant!.id, req.user!.id, id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const replyToMySupportTicketHandler: RequestHandler = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw ApiError.badRequest("Invalid ticket id");
    const input = createTicketReplySchema.parse(req.body);
    const creatorName = await resolveCreatorName(req);
    const result = await supportTicketService.addTenantReply(
      req.tenant!.id,
      req.user!.id,
      id,
      { id: req.user!.id, name: creatorName, email: req.user!.email },
      input,
      readAttachment(req)
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};
