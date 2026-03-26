export type NotificationType =
  | "LEAVE_SUBMITTED"
  | "LEAVE_ACTION_REQUIRED"
  | "LEAVE_APPROVED"
  | "LEAVE_REJECTED";

export interface NotificationItem {
  notification_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: {
    leave_request_id?: string;
    status?: string;
    [key: string]: unknown;
  };
  created_at: string;
  /** Backend may include this; keep optional */
  is_read?: boolean;
}

export interface UnreadCountResponse {
  count: number;
}

