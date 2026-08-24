import { Prisma } from "../../../generated/control";
import {
  CreateSupportTicketInput,
  CreateTicketReplyInput,
  ListSupportTicketsQuery,
  PaginatedResult,
  SupportTicketAuthorType,
  SupportTicketDto,
} from "@hrm-plus/shared";
import { controlClient } from "../../db/controlClient";
import { ApiError } from "../../utils/ApiError";
import { getStorageDriver } from "../../storage";
import { logger } from "../../logger";
import {
  sendNewSupportTicketEmail,
  sendTicketReplyEmail,
  sendTicketStatusChangedEmail,
} from "../notifications/email.service";
import {
  supportTicketDetailInclude,
  supportTicketInclude,
  toSupportTicketDetailDto,
  toSupportTicketDto,
} from "./supportTicket.mapper";

export interface AttachmentFile {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

async function storeAttachment(attachment?: AttachmentFile): Promise<{ url?: string; key?: string }> {
  if (!attachment) return {};
  const stored = await getStorageDriver().save({
    buffer: attachment.buffer,
    originalName: attachment.originalName,
    mimeType: attachment.mimeType,
    folder: "support-ticket-attachments",
  });
  return { url: stored.url, key: stored.key };
}

interface TenantCreator {
  id: number;
  name: string;
  email: string;
}

export async function createSupportTicket(
  tenantId: number,
  creator: TenantCreator,
  input: CreateSupportTicketInput,
  attachment?: AttachmentFile
): Promise<SupportTicketDto> {
  const category = await controlClient.supportTicketCategory.findUnique({ where: { id: input.categoryId } });
  if (!category || !category.isActive) {
    throw ApiError.badRequest("Unknown or inactive ticket category");
  }

  const { url, key } = await storeAttachment(attachment);

  const created = await controlClient.supportTicket.create({
    data: {
      tenantId,
      categoryId: input.categoryId,
      subject: input.subject,
      message: input.message,
      status: "Pending",
      attachmentFileUrl: url,
      attachmentFileKey: key,
      createdByUserId: creator.id,
      createdByName: creator.name,
      createdByEmail: creator.email,
    },
    include: supportTicketInclude,
  });

  notifyPlatformAdminsOfNewTicket(created.tenant.name, created.subject).catch((err) =>
    logger.warn({ err }, "Failed to send new support ticket notification email")
  );

  return toSupportTicketDto(created);
}

async function notifyPlatformAdminsOfNewTicket(tenantName: string, subject: string): Promise<void> {
  const admins = await controlClient.platformAdmin.findMany({ select: { email: true } });
  await Promise.all(admins.map((admin) => sendNewSupportTicketEmail(admin.email, tenantName, subject)));
}

async function notifyPlatformAdminsOfReply(tenantName: string, subject: string): Promise<void> {
  const admins = await controlClient.platformAdmin.findMany({ select: { email: true } });
  await Promise.all(admins.map((admin) => sendTicketReplyEmail(admin.email, subject, tenantName)));
}

export interface ListTicketsFilters {
  status?: string;
  priority?: string;
  categoryId?: number;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
}

function buildDateRangeFilter(dateFrom?: string, dateTo?: string): Prisma.DateTimeFilter | undefined {
  if (!dateFrom && !dateTo) return undefined;
  const filter: Prisma.DateTimeFilter = {};
  if (dateFrom) filter.gte = new Date(dateFrom);
  if (dateTo) filter.lte = new Date(dateTo);
  return filter;
}

export async function listTenantTickets(
  tenantId: number,
  createdByUserId: number,
  filters: ListTicketsFilters
): Promise<PaginatedResult<SupportTicketDto>> {
  const where: Prisma.SupportTicketWhereInput = {
    tenantId,
    createdByUserId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(buildDateRangeFilter(filters.dateFrom, filters.dateTo)
      ? { createdAt: buildDateRangeFilter(filters.dateFrom, filters.dateTo) }
      : {}),
  };

  const [items, total] = await Promise.all([
    controlClient.supportTicket.findMany({
      where,
      include: supportTicketInclude,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    controlClient.supportTicket.count({ where }),
  ]);

  return { items: items.map(toSupportTicketDto), total, page: filters.page, pageSize: filters.pageSize };
}

export async function getTenantTicketById(
  tenantId: number,
  createdByUserId: number,
  id: number
): Promise<SupportTicketDto> {
  const ticket = await controlClient.supportTicket.findUnique({ where: { id }, include: supportTicketDetailInclude });
  if (!ticket || ticket.tenantId !== tenantId || ticket.createdByUserId !== createdByUserId) {
    throw ApiError.notFound("Support ticket not found");
  }
  return toSupportTicketDetailDto(ticket);
}

export async function addTenantReply(
  tenantId: number,
  createdByUserId: number,
  id: number,
  author: TenantCreator,
  input: CreateTicketReplyInput,
  attachment?: AttachmentFile
): Promise<SupportTicketDto> {
  const ticket = await controlClient.supportTicket.findUnique({
    where: { id },
    include: { tenant: { select: { name: true } } },
  });
  if (!ticket || ticket.tenantId !== tenantId || ticket.createdByUserId !== createdByUserId) {
    throw ApiError.notFound("Support ticket not found");
  }
  if (ticket.status === "Closed") {
    throw ApiError.conflict("This ticket is closed");
  }

  const { url, key } = await storeAttachment(attachment);

  await controlClient.supportTicketReply.create({
    data: {
      ticketId: id,
      authorType: "Tenant" satisfies SupportTicketAuthorType,
      authorId: author.id,
      authorName: author.name,
      authorEmail: author.email,
      message: input.message,
      attachmentFileUrl: url,
      attachmentFileKey: key,
    },
  });
  await controlClient.supportTicket.update({ where: { id }, data: { updatedAt: new Date() } });

  notifyPlatformAdminsOfReply(ticket.tenant.name, ticket.subject).catch((err) =>
    logger.warn({ err }, "Failed to send tenant reply notification email")
  );

  const updated = await controlClient.supportTicket.findUniqueOrThrow({
    where: { id },
    include: supportTicketDetailInclude,
  });
  return toSupportTicketDetailDto(updated);
}

export async function listSaasTickets(
  filters: ListTicketsFilters & { tenantId?: number }
): Promise<PaginatedResult<SupportTicketDto>> {
  const where: Prisma.SupportTicketWhereInput = {
    ...(filters.tenantId ? { tenantId: filters.tenantId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(buildDateRangeFilter(filters.dateFrom, filters.dateTo)
      ? { createdAt: buildDateRangeFilter(filters.dateFrom, filters.dateTo) }
      : {}),
  };

  const [items, total] = await Promise.all([
    controlClient.supportTicket.findMany({
      where,
      include: supportTicketInclude,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    controlClient.supportTicket.count({ where }),
  ]);

  return { items: items.map(toSupportTicketDto), total, page: filters.page, pageSize: filters.pageSize };
}

export async function getSaasTicketById(id: number): Promise<SupportTicketDto> {
  const ticket = await controlClient.supportTicket.findUnique({ where: { id }, include: supportTicketDetailInclude });
  if (!ticket) {
    throw ApiError.notFound("Support ticket not found");
  }
  return toSupportTicketDetailDto(ticket);
}

interface SaasAdminAuthor {
  id: number;
  email: string;
}

export async function addSaasReply(
  id: number,
  admin: SaasAdminAuthor,
  input: CreateTicketReplyInput,
  attachment?: AttachmentFile
): Promise<SupportTicketDto> {
  const ticket = await controlClient.supportTicket.findUnique({ where: { id } });
  if (!ticket) {
    throw ApiError.notFound("Support ticket not found");
  }
  if (ticket.status === "Closed") {
    throw ApiError.conflict("This ticket is closed");
  }
  if (!ticket.priority && !input.priority) {
    throw ApiError.badRequest("Priority is required when replying to a ticket for the first time");
  }

  const { url, key } = await storeAttachment(attachment);

  await controlClient.supportTicketReply.create({
    data: {
      ticketId: id,
      authorType: "SaasAdmin" satisfies SupportTicketAuthorType,
      authorId: admin.id,
      authorName: "Support Team",
      authorEmail: admin.email,
      message: input.message,
      attachmentFileUrl: url,
      attachmentFileKey: key,
    },
  });

  await controlClient.supportTicket.update({
    where: { id },
    data: {
      priority: input.priority ?? ticket.priority,
      status: ticket.status === "Pending" ? "Open" : ticket.status,
    },
  });

  sendTicketReplyEmail(ticket.createdByEmail, ticket.subject, "our support team").catch((err) =>
    logger.warn({ err }, "Failed to send ticket reply notification email")
  );

  const updated = await controlClient.supportTicket.findUniqueOrThrow({
    where: { id },
    include: supportTicketDetailInclude,
  });
  return toSupportTicketDetailDto(updated);
}

export async function updateTicketStatus(id: number, status: string): Promise<SupportTicketDto> {
  const ticket = await controlClient.supportTicket.findUnique({ where: { id } });
  if (!ticket) {
    throw ApiError.notFound("Support ticket not found");
  }

  const updated = await controlClient.supportTicket.update({
    where: { id },
    data: {
      status,
      closedAt: status === "Closed" ? new Date() : null,
    },
    include: supportTicketDetailInclude,
  });

  if (status === "Closed") {
    sendTicketStatusChangedEmail(ticket.createdByEmail, ticket.subject, status).catch((err) =>
      logger.warn({ err }, "Failed to send ticket status change notification email")
    );
  }

  return toSupportTicketDetailDto(updated);
}
