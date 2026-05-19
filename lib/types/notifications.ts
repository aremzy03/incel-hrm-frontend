export type NotificationType =
  | "LEAVE_SUBMITTED"
  | "LEAVE_ACTION_REQUIRED"
  | "LEAVE_APPROVED"
  | "LEAVE_REJECTED"
  | "LOAN_SUBMITTED"
  | "LOAN_APPROVED"
  | "LOAN_REJECTED"
  | "LOAN_DISBURSED"
  | "LOAN_LIQUIDATED"
  | "LOAN_CLOSED";

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

