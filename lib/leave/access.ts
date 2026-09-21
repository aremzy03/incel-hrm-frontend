import type { User } from "@/lib/types/auth";
import { hasRole } from "@/lib/rbac";

const PRIVILEGED_ROLES = [
  "HR",
  "EXECUTIVE_DIRECTOR",
  "MANAGING_DIRECTOR",
] as const;

export const LEAVE_HR_ROLES = [...PRIVILEGED_ROLES];

export function canManageLeaveSettings(user: User | null): boolean {
  if (!user) return false;
  return hasRole(user, ...PRIVILEGED_ROLES);
}

/** Mirrors backend `_can_view_employee_leave_profile` for UI gating. */
export function canViewEmployeeLeaveProfile(
  viewer: User | null,
  employeeId: string
): boolean {
  if (!viewer) return false;
  if (viewer.id === employeeId) return true;
  if (hasRole(viewer, ...PRIVILEGED_ROLES)) return true;
  if (hasRole(viewer, "LINE_MANAGER")) return true;
  if (hasRole(viewer, "SUPERVISOR")) return true;
  if (hasRole(viewer, "TEAM_LEAD")) return true;
  return false;
}
