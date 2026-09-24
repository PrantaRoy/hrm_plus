export const NOTIFICATION_STATUSES = ["Unread", "Read"] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export interface NotificationDto {
  id: number;
  title: string;
  targetUrl: string | null;
  status: NotificationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ListNotificationsQuery {
  page?: number;
  pageSize?: number;
  status?: NotificationStatus;
}
