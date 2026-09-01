import { hasRole } from "@/lib/rbac";
import type { User } from "@/lib/types/auth";
import type {
  EligibleRelieversResponse,
  EmployeeMinimal,
  LeaveRequest,
} from "@/lib/types/leave";

export function leaveTypeCode(type: { code?: string; name?: string } | null | undefined): string {
  return (type?.code ?? "").toUpperCase();
}

export function isMaternityCode(code: string): boolean {
  return code === "MATERNITY";
}

export function isPaternityCode(code: string): boolean {
  return code === "PATERNITY";
}

export function isLeaveTypeEligibleForGender(
  type: { code?: string; name?: string },
  gender: string | undefined
): boolean {
  const code = leaveTypeCode(type);
  if (isMaternityCode(code)) return gender === "FEMALE";
  if (isPaternityCode(code)) return gender === "MALE";
  return true;
}

export function isSickLeaveType(type: { code?: string; name?: string }): boolean {
  return leaveTypeCode(type) === "SICK";
}

export function isAnnualOrCasualType(type: { code?: string; name?: string }): boolean {
  const code = leaveTypeCode(type);
  return code === "ANNUAL" || code === "CASUAL";
}

export function isRelieverRequiredByPolicy(params: {
  relieverRequired?: boolean;
  isEmergency: boolean;
}): boolean {
  if (params.relieverRequired === false) return false;
  if (params.isEmergency) return false;
  if (params.relieverRequired === true) return true;
  return true;
}

export function isRelieverRequired(params: {
  relieverRequired?: boolean;
  isEmergency: boolean;
  user: User | null;
}): boolean {
  if (hasRole(params.user, "MANAGING_DIRECTOR", "EXECUTIVE_DIRECTOR")) {
    return false;
  }
  return isRelieverRequiredByPolicy({
    relieverRequired: params.relieverRequired,
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
