import type { User, RoleName } from "@/lib/types/auth";

/** Roles that can access the Users management section */
export const USERS_SECTION_ROLES: RoleName[] = [
  "HR",
  "EXECUTIVE_DIRECTOR",
  "MANAGING_DIRECTOR",
];

/**
 * Returns true if the given user has at least one of the specified roles.
 * Handles both legacy (string[]) and future (Role[]) role arrays.
 */
export function hasRole(user: User | null, ...roles: RoleName[]): boolean {
  if (!user?.roles?.length) return false;
  return user.roles.some((r) => roles.includes(r as RoleName));
}

/** Convenience: can the user access the Users management section? */
export function canManageUsers(user: User | null): boolean {
  return hasRole(user, ...USERS_SECTION_ROLES);
}

/** Roles that can approve loans and view privileged loan data (logs, all-employee lists). */
export const LOAN_APPROVER_ROLES: RoleName[] = [
  "HR",
  "EXECUTIVE_DIRECTOR",
  "MANAGING_DIRECTOR",
];

export function canViewLoanLogs(user: User | null): boolean {
  return hasRole(user, ...LOAN_APPROVER_ROLES);
}

/** HR-only finance report pages. */
export function canAccessLoanReports(user: User | null): boolean {
  return hasRole(user, "HR");
}

export function canViewEmployeeLoanLedger(
  user: User | null,
  employeeId: string
): boolean {
  if (!user) return false;
  if (user.id === employeeId) return true;
  return hasRole(user, ...LOAN_APPROVER_ROLES);
}

/** Can list/filter all employees' loan applications (backend privileged queryset). */
export function isLoanPrivilegedList(user: User | null): boolean {
  return hasRole(user, ...LOAN_APPROVER_ROLES);
}
