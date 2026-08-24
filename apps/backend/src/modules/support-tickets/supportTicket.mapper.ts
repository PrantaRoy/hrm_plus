import { Prisma, SupportTicketReply } from "../../../generated/control";
import { SupportTicketDto, SupportTicketReplyDto } from "@hrm-plus/shared";

const supportTicketWithRelations = Prisma.validator<Prisma.SupportTicketDefaultArgs>()({
  include: { category: true, tenant: { select: { name: true } } },
});

export type SupportTicketWithRelations = Prisma.SupportTicketGetPayload<typeof supportTicketWithRelations>;
export const supportTicketInclude = supportTicketWithRelations.include;

const supportTicketWithReplies = Prisma.validator<Prisma.SupportTicketDefaultArgs>()({
  include: {
    category: true,
    tenant: { select: { name: true } },
    replies: { orderBy: { createdAt: "asc" } },
  },
});

export type SupportTicketWithReplies = Prisma.SupportTicketGetPayload<typeof supportTicketWithReplies>;
export const supportTicketDetailInclude = supportTicketWithReplies.include;

export function toSupportTicketReplyDto(reply: SupportTicketReply): SupportTicketReplyDto {
  return {
    id: reply.id,
    ticketId: reply.ticketId,
    authorType: reply.authorType as SupportTicketReplyDto["authorType"],
    authorName: reply.authorName,
    message: reply.message,
    attachmentFileUrl: reply.attachmentFileUrl,
    createdAt: reply.createdAt.toISOString(),
  };
}

export function toSupportTicketDto(ticket: SupportTicketWithRelations): SupportTicketDto {
  return {
    id: ticket.id,
    tenantId: ticket.tenantId,
    tenantName: ticket.tenant.name,
    categoryId: ticket.categoryId,
    categoryName: ticket.category.name,
    subject: ticket.subject,
    message: ticket.message,
    status: ticket.status as SupportTicketDto["status"],
    priority: ticket.priority as SupportTicketDto["priority"],
    attachmentFileUrl: ticket.attachmentFileUrl,
    createdByUserId: ticket.createdByUserId,
    createdByName: ticket.createdByName,
    createdByEmail: ticket.createdByEmail,
    closedAt: ticket.closedAt?.toISOString() ?? null,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

export function toSupportTicketDetailDto(ticket: SupportTicketWithReplies): SupportTicketDto {
  return {
    ...toSupportTicketDto(ticket),
    replies: ticket.replies.map(toSupportTicketReplyDto),
  };
}
