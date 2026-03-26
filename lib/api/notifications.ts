import { apiGet, apiPost } from "@/lib/api-client";
import type { NotificationItem, UnreadCountResponse } from "@/lib/types/notifications";

type Paginated<T> = { results: T[] } & Record<string, unknown>;

export function listNotifications() {
  return apiGet<NotificationItem[] | Paginated<NotificationItem>>("notifications");
}

export function getUnreadCount() {
  return apiGet<UnreadCountResponse>("notifications/unread-count");
}

export function markNotificationRead(id: string) {
  return apiPost<void>(`notifications/${id}/mark-read`);
}

export function markAllNotificationsRead() {
  return apiPost<void>("notifications/mark-all-read");
}

