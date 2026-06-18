import type { User, RoleName } from "@/lib/types/auth";
import type { LoanApplication } from "@/lib/types/loan";

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

/** Roles that can approve loans at HR/ED/MD stages and privileged loan write paths. */
export const LOAN_APPROVER_ROLES: RoleName[] = [
  "HR",
  "EXECUTIVE_DIRECTOR",
  "MANAGING_DIRECTOR",
];

/** Roles that see the loan Approvals nav item (includes line managers). */
export const LOAN_APPROVAL_NAV_ROLES: RoleName[] = [
  ...LOAN_APPROVER_ROLES,
  "LINE_MANAGER",
];

export function isLoanObserver(
  user: User | null,
  hasObserverAccess?: boolean
): boolean {
  if (!user || !hasObserverAccess) return false;
  return (
    !hasRole(user, ...LOAN_APPROVER_ROLES) && !hasRole(user, "LINE_MANAGER")
  );
}

export function canViewLoanLogs(
  user: User | null,
  loan?: LoanApplication | null,
  hasObserverAccess?: boolean
): boolean {
  if (!user) return false;
  if (hasRole(user, ...LOAN_APPROVER_ROLES)) return true;
  if (isLoanObserver(user, hasObserverAccess)) return true;
  if (loan && hasRole(user, "LINE_MANAGER")) return true;
  return false;
}

/** HR or loan observer report access. */
export function canAccessLoanReports(
  user: User | null,
  hasObserverAccess?: boolean
): boolean {
  if (!user) return false;
  if (hasRole(user, "HR")) return true;
  return hasObserverAccess === true;
}

export function canViewEmployeeLoanLedger(
  user: User | null,
  employeeId: string,
  hasObserverAccess?: boolean
): boolean {
  if (!user) return false;
  if (user.id === employeeId) return true;
  if (hasRole(user, ...LOAN_APPROVER_ROLES)) return true;
  return hasObserverAccess === true;
}

/** Can list/filter all employees' loan applications (backend privileged queryset). */
export function isLoanPrivilegedList(
  user: User | null,
  hasObserverAccess?: boolean
): boolean {
  if (!user) return false;
  if (hasRole(user, ...LOAN_APPROVER_ROLES)) return true;
  return hasObserverAccess === true;
}
