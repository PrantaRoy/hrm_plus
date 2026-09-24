import { ListNotificationsQuery, NotificationDto, PaginatedResult } from "@hrm-plus/shared";
import { apiClient } from "./client";

export async function listNotifications(
  params?: ListNotificationsQuery
): Promise<PaginatedResult<NotificationDto>> {
  const res = await apiClient.get<PaginatedResult<NotificationDto>>("/notifications", { params });
  return res.data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const res = await apiClient.get<{ count: number }>("/notifications/unread-count");
  return res.data.count;
}

export async function markNotificationRead(id: number): Promise<NotificationDto> {
  const res = await apiClient.patch<NotificationDto>(`/notifications/${id}/read`);
  return res.data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch("/notifications/read-all");
}
