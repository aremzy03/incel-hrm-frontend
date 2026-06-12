import { apiGet, apiPost } from "@/lib/api-client";
import type { NotificationItem, UnreadCountResponse } from "@/lib/types/notifications";

type Paginated<T> = { results: T[] } & Record<string, unknown>;

type ApiNotification = NotificationItem & { id?: string };

function normalizeNotification(raw: ApiNotification): NotificationItem {
  return {
    ...raw,
    notification_id: raw.notification_id ?? String(raw.id ?? ""),
  };
}

function normalizeList(
  data: NotificationItem[] | Paginated<NotificationItem> | undefined
): NotificationItem[] {
  const items = Array.isArray(data)
    ? data
    : ((data as Paginated<NotificationItem> | undefined)?.results ?? []);
  return items.map((item) => normalizeNotification(item as ApiNotification));
}

export async function listNotifications() {
  const data = await apiGet<NotificationItem[] | Paginated<NotificationItem>>(
    "notifications"
  );
  return normalizeList(data);
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

