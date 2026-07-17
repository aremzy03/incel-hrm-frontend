import { hasRole } from "@/lib/rbac";
import type { User } from "@/lib/types/auth";
import type {
  EligibleRelieversResponse,
  EmployeeMinimal,
  LeaveRequest,
} from "@/lib/types/leave";

const EXEMPT_TYPES = [
  "Sick",
  "Maternity",
  "Maternity Leave",
  "Paternity",
  "Paternity Leave",
];

export function isRelieverRequiredByPolicy(params: {
  leaveTypeName: string;
  isEmergency: boolean;
}): boolean {
  if (EXEMPT_TYPES.includes(params.leaveTypeName)) return false;
  if (params.isEmergency && params.leaveTypeName !== "Sick") return false;
  return true;
}

export function isRelieverRequired(params: {
  leaveTypeName: string;
  isEmergency: boolean;
  user: User | null;
}): boolean {
  if (hasRole(params.user, "MANAGING_DIRECTOR", "EXECUTIVE_DIRECTOR")) {
    return false;
  }
  return isRelieverRequiredByPolicy({
    leaveTypeName: params.leaveTypeName,
    isEmergency: params.isEmergency,
  });
}

export function relieverScopeLabel(level: string | null): string {
  if (level === "team") return "team";
  if (level === "unit") return "unit";
  if (level === "department") return "department";
  return "organisation";
}

export function formatRelieverName(person: {
  first_name?: string;
  last_name?: string;
  email?: string;
}): string {
  const name = `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim();
  return name || person.email || "Unknown";
}

export function extractCoverPersonId(
  cp: LeaveRequest["cover_person"] | string | null | undefined
): string {
  if (!cp) return "";
  if (typeof cp === "string") return cp;
  return cp.id ?? "";
}

export function getRelieverHelperText(
  data: EligibleRelieversResponse | undefined
): string | null {
  if (!data) return null;
  if (data.relievers.length === 0) {
    return "No eligible relievers found. Contact HR.";
  }
  if (
    data.fallback_applied &&
    data.scope_level &&
    data.effective_scope_level
  ) {
    return `No colleagues in your ${relieverScopeLabel(data.scope_level)}; showing colleagues from your ${relieverScopeLabel(data.effective_scope_level)}.`;
  }
  if (data.effective_scope_level) {
    return `Showing colleagues in your ${relieverScopeLabel(data.effective_scope_level)}.`;
  }
  return null;
}

export function shouldShowRelieverField(params: {
  relieverRequired: boolean;
  coverPersonId: string;
}): boolean {
  return params.relieverRequired || !!params.coverPersonId;
}

export function extractFieldError(
  data: Record<string, unknown> | undefined,
  field: string
): string | null {
  if (!data) return null;
  const value = data[field];
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
    return value[0];
  }
  return null;
}
