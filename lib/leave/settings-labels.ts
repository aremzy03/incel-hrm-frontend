import { ApiError } from "@/lib/api-client";
import { LEAVE_STATUS_DISPLAY } from "@/lib/types/leave";
import type {
  AssignmentScopeType,
  CrossYearRule,
  EmployeeMinimal,
  LeaveStatus,
  LeaveYearType,
  RelieverScope,
  WorkflowApproverSource,
} from "@/lib/types/leave";

export function mutationErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.message) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function formatPersonName(
  person?: Pick<EmployeeMinimal, "first_name" | "last_name" | "email"> | null
): string {
  if (!person) return "Unknown person";
  const name = `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim();
  return name || person.email || "Unknown person";
}

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function formatWeekdays(weekdays: number[]): string {
  if (weekdays.length === 0) return "No working days";
  const sorted = [...weekdays].sort((a, b) => a - b);
  return sorted.map((d) => WEEKDAY_LABELS[d] ?? `Day ${d}`).join(", ");
}

export function leaveYearLabel(value: LeaveYearType): string {
  switch (value) {
    case "CALENDAR":
      return "Calendar year (1 Jan)";
    case "FISCAL":
      return "Fiscal year";
    case "ANNIVERSARY":
      return "Hire anniversary";
    default:
      return value;
  }
}

export function crossYearLabel(value: CrossYearRule): string {
  switch (value) {
    case "SPLIT":
      return "Split across both years (recommended)";
    case "START_YEAR":
      return "Deduct from the start year";
    default:
      return value;
  }
}

export function policyStatusLabel(status: string): string {
  if (status === "DRAFT") return "Draft";
  if (status === "ACTIVE") return "Active";
  if (status === "ARCHIVED") return "Archived";
  return status;
}

export function assignmentScopeLabel(scope: AssignmentScopeType): string {
  switch (scope) {
    case "ORGANIZATION":
      return "Whole organisation";
    case "DEPARTMENT":
      return "Department";
    case "UNIT":
      return "Unit";
    case "TEAM":
      return "Team";
    case "EMPLOYMENT_TYPE":
      return "Employment type";
    case "EMPLOYEE":
      return "One employee";
    default:
      return scope;
  }
}

export function contractTypeLabel(value: string): string {
  switch (value) {
    case "PERMANENT":
      return "Permanent";
    case "FIXED_TERM":
      return "Fixed term";
    case "CONTRACT":
      return "Contract";
    case "INTERN":
      return "Intern";
    case "OTHER":
      return "Other";
    default:
      return value;
  }
}

export function approverSourceLabel(value: WorkflowApproverSource): string {
  switch (value) {
    case "TEAM_LEAD":
      return "Team Lead";
    case "SUPERVISOR":
      return "Supervisor";
    case "LINE_MANAGER":
      return "Line Manager";
    case "HR":
      return "HR";
    case "EXECUTIVE_DIRECTOR":
      return "Executive Director";
    case "NAMED_USER":
      return "Named person";
    case "ROLE":
      return "Role";
    default:
      return value;
  }
}

export function workflowStatusLabel(code: string): string {
  if (code in LEAVE_STATUS_DISPLAY) {
    return LEAVE_STATUS_DISPLAY[code as LeaveStatus];
  }
  return code;
}

export function relieverScopeLabel(value: RelieverScope): string {
  switch (value) {
    case "AUTO":
      return "Automatic";
    case "TEAM":
      return "Team";
    case "UNIT":
      return "Unit";
    case "DEPARTMENT":
      return "Department";
    case "ORGANIZATION":
      return "Organisation";
    default:
      return value;
  }
}

export function accrualMethodLabel(value: string): string {
  switch (value) {
    case "UPFRONT":
      return "All at once";
    case "MONTHLY":
      return "Monthly";
    case "WEEKLY":
      return "Weekly";
    case "ANNIVERSARY":
      return "On anniversary";
    default:
      return value;
  }
}

export function overlapEnforcementLabel(value: string): string {
  return value === "WARN" ? "Warn only — allow submit" : "Block submit";
}

export function formatDiffValue(value: string): string {
  if (value === "true") return "Yes";
  if (value === "false") return "No";
  return value;
}

export function policyFieldLabel(key: string): string {
  const map: Record<string, string> = {
    annual_entitlement: "Annual entitlement",
    weekend_excluded: "Weekends excluded",
    public_holiday_excluded: "Public holidays excluded",
    half_day_allowed: "Half-day allowed",
    reliever_required: "Reliever required",
    carry_forward: "Carry forward",
  };
  return map[key] ?? key;
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function formatIsoDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
