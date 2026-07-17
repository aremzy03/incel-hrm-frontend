import type { User } from "@/lib/types/auth";
import { hasRole } from "@/lib/rbac";

const PRIVILEGED_ROLES = [
  "HR",
  "EXECUTIVE_DIRECTOR",
  "MANAGING_DIRECTOR",
] as const;

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
