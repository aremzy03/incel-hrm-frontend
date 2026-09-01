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
  unit?: { id: string } | null;
}

export interface LeaveType {
  id: string;
  name: string;
  code?: string;
  description: string;
  default_days: number;
  is_active?: boolean;
  display_order?: number;
  calendar_color?: string | null;
  created_at: string;
  updated_at: string;
}

export type PolicyStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type RelieverScope =
  | "AUTO"
  | "TEAM"
  | "UNIT"
  | "DEPARTMENT"
  | "ORGANIZATION";

export type OverlapEnforcement = "BLOCK" | "WARN";

export type AccrualMethod = "UPFRONT" | "MONTHLY" | "WEEKLY" | "ANNIVERSARY";

export interface LeavePolicy {
  id: string;
  name: string;
  leave_type: string;
  leave_type_detail?: LeaveType;
  status: PolicyStatus;
  version: number;
  effective_from: string | null;
  effective_to: string | null;
  annual_entitlement: number;
  carry_forward: boolean;
  half_day_allowed: boolean;
  weekend_excluded: boolean;
  public_holiday_excluded: boolean;
  forfeited_on_resignation: boolean;
  allow_backdated: boolean;
  maximum_backdate_days: number | null;
  reliever_required?: boolean;
  reliever_scope?: RelieverScope;
  overlap_control_enabled?: boolean;
  overlap_scope?: RelieverScope;
  maximum_people_absent?: number;
  overlap_enforcement?: OverlapEnforcement;
  accrual_method?: AccrualMethod;
  accrual_rate?: string | number | null;
  prorate_new_joiners?: boolean;
  carry_forward_max_days?: string | number | null;
  carry_forward_expiry_months?: number | null;
  forfeit_unused?: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeavePolicyWritePayload {
  name?: string;
  leave_type?: string;
  annual_entitlement?: number;
  carry_forward?: boolean;
  half_day_allowed?: boolean;
  weekend_excluded?: boolean;
  public_holiday_excluded?: boolean;
  forfeited_on_resignation?: boolean;
  allow_backdated?: boolean;
  maximum_backdate_days?: number | null;
  effective_from?: string | null;
  effective_to?: string | null;
  reliever_required?: boolean;
  reliever_scope?: RelieverScope;
  overlap_control_enabled?: boolean;
  overlap_scope?: RelieverScope;
  maximum_people_absent?: number;
  overlap_enforcement?: OverlapEnforcement;
  accrual_method?: AccrualMethod;
  accrual_rate?: string | number | null;
  prorate_new_joiners?: boolean;
  carry_forward_max_days?: string | number | null;
  carry_forward_expiry_months?: number | null;
  forfeit_unused?: boolean;
  reason?: string;
}

export interface LeaveSettingsAuditLog {
  id: string;
  actor: EmployeeMinimal | null;
  created_at: string;
  object_type: string;
  object_id: string;
  action: string;
  previous_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  reason: string;
  ip_address: string | null;
}

export type AssignmentScopeType =
  | "ORGANIZATION"
  | "DEPARTMENT"
  | "UNIT"
  | "TEAM"
  | "EMPLOYMENT_TYPE"
  | "EMPLOYEE";

export interface LeavePolicyAssignment {
  id: string;
  policy: string;
  policy_detail?: LeavePolicy;
  leave_type?: string;
  scope_type: AssignmentScopeType;
  scope_id: string | null;
  employee: string | null;
  employee_detail?: EmployeeMinimal | null;
  priority: number;
  effective_from: string | null;
  effective_to: string | null;
  is_active: boolean;
}

export interface PolicyResolution {
  employee: string;
  leave_type: string;
  effective_date: string;
  source: "assignment" | "fallback";
  assignment_scope: AssignmentScopeType | null;
  assignment: LeavePolicyAssignment | null;
  resolved_policy: LeavePolicy | null;
}

export interface PolicyImpactPreview {
  employee_count: number;
  employees: Array<{
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    assignment_scope?: string;
    source?: string;
  }>;
  truncated: boolean;
  effective_date: string;
  policy: LeavePolicy;
}

export interface LeaveBalance {
  id: string;
  leave_type: LeaveType;
  year: number;
  allocated_days: number;
  used_days: number;
  remaining_days: number;
  pending_days?: number;
  available_days?: number;
  carried_forward_days?: number;
  carry_forward_expires_on?: string | null;
}

export type LedgerTransactionType =
  | "DEDUCT"
  | "REFUND"
  | "ADJUST"
  | "RESERVE"
  | "RELEASE"
  | "ACCRUAL"
  | "CARRY_FORWARD"
  | "EXPIRY"
  | "FORFEIT"
  | "ENCASH";

export interface LeaveBalanceTransaction {
  id: string;
  transaction_type: LedgerTransactionType;
  source?: string;
  delta_allocated_days?: number | string;
  delta_used_days?: number | string;
  delta_pending_days?: number | string;
  actor?: EmployeeMinimal | null;
  reason?: string;
  effective_date?: string | null;
  created_at: string;
}

export type HalfDayPeriod = "AM" | "PM" | "";

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
  cover_person?: EmployeeMinimal | null;
  is_reconciled?: boolean;
  reconciled_by?: EmployeeMinimal | null;
  reconciled_at?: string | null;
  reconciliation_note?: string;
  is_half_day?: boolean;
  half_day_period?: HalfDayPeriod;
  policy?: string | null;
  policy_version?: number | null;
  calculation_snapshot?: Record<string, unknown> | null;
  workflow_snapshot?: WorkflowSnapshot | null;
  stage_entered_at?: string | null;
}

export interface WorkflowSnapshotStage {
  order?: number;
  status_code?: string;
  approver_source?: string;
  label?: string;
  sla_hours?: number | null;
}

export interface WorkflowSnapshot {
  name?: string;
  stages?: WorkflowSnapshotStage[];
}

export interface EligibleRelieversResponse {
  scope_level: "team" | "unit" | "department" | null;
  effective_scope_level: "team" | "unit" | "department" | null;
  fallback_applied: boolean;
  relievers: EmployeeMinimal[];
}

export interface LeaveApprovalLog {
  id: string;
  leave_request: string;
  actor: EmployeeMinimal;
  action: "APPROVE" | "REJECT" | "CANCEL" | "MODIFY" | "RECONCILE";
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
  cover_person?: string | null;
  is_half_day?: boolean;
  half_day_period?: HalfDayPeriod;
  blackout_override_reason?: string;
}

export interface LeaveTypeCreatePayload {
  name: string;
  code?: string;
  description?: string;
  default_days: number;
  display_order?: number;
  calendar_color?: string;
  is_active?: boolean;
  reason?: string;
}

export interface LeaveTypeUpdatePayload {
  name?: string;
  code?: string;
  description?: string;
  default_days?: number;
  display_order?: number;
  calendar_color?: string | null;
  is_active?: boolean;
  reason?: string;
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
  is_half_day?: boolean;
  half_day_period?: HalfDayPeriod;
}

export interface LeaveReconcilePayload {
  employee: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reconciliation_note: string;
  reason?: string;
  cover_person?: string | null;
  allow_insufficient_balance?: boolean;
  notify_department_colleagues?: boolean;
}

export interface LeaveReconcileRowPayload {
  employee: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reconciliation_note: string;
  reason?: string;
  cover_person?: string | null;
}

export interface BulkReconcilePayload {
  rows: LeaveReconcileRowPayload[];
  allow_insufficient_balance?: boolean;
  notify_department_colleagues?: boolean;
}

export interface BulkReconcileResponse {
  created: string[];
  errors: Array<{ index: number; errors: unknown }>;
  created_count: number;
  parse_errors?: Array<{ line: number; error: string }>;
}

export interface LeaveReconcileEditPayload {
  leave_type?: string;
  start_date?: string;
  end_date?: string;
  reason?: string;
  cover_person?: string | null;
  edit_note?: string;
  allow_insufficient_balance?: boolean;
}

export type LeaveYearType = "CALENDAR" | "FISCAL" | "ANNIVERSARY";
export type CrossYearRule = "SPLIT" | "START_YEAR";

export interface LeaveSettings {
  leave_year_type: LeaveYearType;
  leave_year_start_month: number;
  leave_year_start_day: number;
  cross_year_deduction_rule: CrossYearRule;
  default_timezone: string;
  default_working_calendar?: string | null;
  default_holiday_calendar?: string | null;
  notify_applicant_on_submit: boolean;
  notify_applicant_on_decision: boolean;
  notify_approver: boolean;
  notify_reliever: boolean;
  notify_department_reminder: boolean;
  reminder_lead_hours: number;
  allow_hr_override: boolean;
  prevent_self_approval: boolean;
  approval_sla_hours?: number | null;
  encashment_allowed?: boolean;
  encashment_max_days?: number | null;
}

export interface WorkingCalendar {
  id: string;
  name: string;
  is_active: boolean;
  is_org_default: boolean;
  timezone: string;
  weekdays: number[];
  hours_per_day: number;
  effective_from: string | null;
  effective_to: string | null;
}

export interface HolidayCalendarItem {
  id: string;
  name: string;
  date: string;
  is_recurring?: boolean;
  is_full_day?: boolean;
  observed_date?: string | null;
  location_scope?: string;
}

export interface HolidayCalendar {
  id: string;
  name: string;
  is_active?: boolean;
  is_org_default?: boolean;
  holidays?: HolidayCalendarItem[];
}

export interface LeaveCalendarAssignment {
  id: string;
  employee: string | null;
  department: string | null;
  working_calendar: string | null;
  holiday_calendar: string | null;
  employee_detail?: EmployeeMinimal | null;
}

export type WorkflowApproverSource =
  | "TEAM_LEAD"
  | "SUPERVISOR"
  | "LINE_MANAGER"
  | "HR"
  | "EXECUTIVE_DIRECTOR"
  | "NAMED_USER"
  | "ROLE";

export interface LeaveWorkflowStage {
  order: number;
  approver_source: WorkflowApproverSource;
  status_code: string;
  named_user?: string | null;
  role_name?: string | null;
  sla_hours?: number | null;
  skip_if_unresolved?: boolean;
  is_optional?: boolean;
  skip_if_requester_roles?: string[];
  use_management_line_manager_for_line_manager_requester?: boolean;
}

export interface LeaveWorkflowTemplate {
  id: string;
  name: string;
  is_active: boolean;
  is_org_default: boolean;
  leave_type: string | null;
  mode: "SEQUENTIAL";
  reject_comment_required: boolean;
  approve_comment_required: boolean;
  sla_hours?: number | null;
  auto_approve_after_sla?: boolean;
  stages: LeaveWorkflowStage[];
}

export interface WorkflowSimulateResponse {
  resolved_approvers?: Array<{
    stage?: number;
    status_code?: string;
    email?: string;
    user?: EmployeeMinimal;
  }>;
  stages?: LeaveWorkflowStage[];
  first_status?: string;
}

export interface ApproverDelegate {
  id: string;
  user: string;
  delegate: string;
  user_detail?: EmployeeMinimal;
  delegate_detail?: EmployeeMinimal;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface LeaveBlackoutPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  enforcement: OverlapEnforcement;
  leave_types: string[];
  department: string | null;
  is_active: boolean;
}

export interface AccrualPreviewAction {
  employee?: string;
  email?: string;
  leave_type?: string;
  days?: number | string;
  action?: string;
  [key: string]: unknown;
}

export interface AccrualPreviewResponse {
  dry_run: boolean;
  as_of: string;
  year: number;
  action_count: number;
  actions: AccrualPreviewAction[];
  skipped: unknown[];
}

export interface LeaveUtilizationRow {
  department?: string;
  leave_type?: string;
  days?: number | string;
  [key: string]: unknown;
}

export interface WhoIsOutRow {
  employee?: string;
  email?: string;
  leave_type?: string;
  start_date?: string;
  end_date?: string;
  [key: string]: unknown;
}

export interface LiabilityRow {
  employee?: string;
  leave_type?: string;
  allocated_days?: number | string;
  used_days?: number | string;
  liability_days?: number | string;
  [key: string]: unknown;
}
