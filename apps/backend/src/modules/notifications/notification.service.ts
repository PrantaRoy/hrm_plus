import { PrismaClient } from "../../../generated/tenant";
import { ListNotificationsQuery, NotificationDto, PaginatedResult } from "@hrm-plus/shared";
import { ApiError } from "../../utils/ApiError";
import { toNotificationDto } from "./notification.mapper";

export interface CreateNotificationInput {
  userId: number;
  title: string;
  targetUrl?: string | null;
}

export async function createNotification(prisma: PrismaClient, input: CreateNotificationInput): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      targetUrl: input.targetUrl ?? null,
    },
  });
}

export async function listNotifications(
  prisma: PrismaClient,
  userId: number,
  query: ListNotificationsQuery
): Promise<PaginatedResult<NotificationDto>> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const where = { userId, ...(query.status ? { status: query.status } : {}) };

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.notification.count({ where }),
  ]);

  return { items: items.map(toNotificationDto), total, page, pageSize };
}

export async function getUnreadCount(prisma: PrismaClient, userId: number): Promise<number> {
  return prisma.notification.count({ where: { userId, status: "Unread" } });
}

export async function markNotificationRead(
  prisma: PrismaClient,
  userId: number,
  notificationId: number
): Promise<NotificationDto> {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification || notification.userId !== userId) {
    throw ApiError.notFound("Notification not found");
  }
  if (notification.status === "Read") {
    return toNotificationDto(notification);
  }
  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { status: "Read" },
  });
  return toNotificationDto(updated);
}

export async function markAllNotificationsRead(prisma: PrismaClient, userId: number): Promise<{ updated: number }> {
  const result = await prisma.notification.updateMany({
    where: { userId, status: "Unread" },
    data: { status: "Read" },
  });
  return { updated: result.count };
}
