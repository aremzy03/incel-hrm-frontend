export type LeaveStatus =
  | "DRAFT"
  | "PENDING_MANAGER"
  | "PENDING_HR"
  | "PENDING_ED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export const LEAVE_STATUS_DISPLAY: Record<LeaveStatus, string> = {
  DRAFT: "Draft",
  PENDING_MANAGER: "Pending Manager",
  PENDING_HR: "Pending HR",
  PENDING_ED: "Pending ED",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export interface EmployeeMinimal {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface LeaveType {
  id: string;
  name: string;
  description: string;
  default_days: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveBalance {
  id: string;
  leave_type: LeaveType;
  year: number;
  allocated_days: number;
  used_days: number;
  remaining_days: number;
}

export interface LeaveRequest {
  id: string;
  employee: EmployeeMinimal;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  total_working_days: number;
  reason: string;
  is_emergency: boolean;
  status: LeaveStatus;
  status_display: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveApprovalLog {
  id: string;
  leave_request: string;
  actor: EmployeeMinimal;
  action: "APPROVE" | "REJECT" | "CANCEL" | "MODIFY";
  action_display: string;
  comment: string;
  timestamp: string;
  previous_status: string;
  new_status: string;
}

export interface LeaveRequestCreatePayload {
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  is_emergency: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CalendarEmployee {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  department_name: string;
}

export interface CalendarEntry {
  id: string;
  employee: CalendarEmployee;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  total_working_days: number;
}
