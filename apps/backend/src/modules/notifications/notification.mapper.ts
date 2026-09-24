import { NotificationDto, NotificationStatus } from "@hrm-plus/shared";

interface NotificationRow {
  id: number;
  title: string;
  targetUrl: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toNotificationDto(notification: NotificationRow): NotificationDto {
  return {
    id: notification.id,
    title: notification.title,
    targetUrl: notification.targetUrl,
    status: notification.status as NotificationStatus,
    createdAt: notification.createdAt.toISOString(),
    updatedAt: notification.updatedAt.toISOString(),
  };
}
