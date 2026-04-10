export type LeaveStatus =
  | "DRAFT"
  | "PENDING_TEAM_LEAD"
  | "PENDING_SUPERVISOR"
  | "PENDING_MANAGER"
  | "PENDING_HR"
  | "PENDING_ED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export const LEAVE_STATUS_DISPLAY: Record<LeaveStatus, string> = {
  DRAFT: "Draft",
  PENDING_TEAM_LEAD: "Pending Team Lead",
  PENDING_SUPERVISOR: "Pending Unit Supervisor",
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
  /** Unit the employee belongs to (when exposed by API, for supervisor approval check) */
  unit?: { id: string } | null;
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
  /** Present when backend includes it (e.g. for DRAFT) */
  cover_person?: string | { id: string };
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
  /**
   * Optional on backend; omit or send null/empty when not provided.
   * Keep as string for selected employee id.
   */
  cover_person?: string | null;
}

export interface LeaveTypeCreatePayload {
  name: string;
  description?: string;
  default_days: number;
}

export interface LeaveTypeUpdatePayload {
  name?: string;
  description?: string;
  default_days?: number;
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
