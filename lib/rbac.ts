import type { User, RoleName } from "@/lib/types/auth";
import type { LoanApplication } from "@/lib/types/loan";
import type { AppraisalStatusCode } from "@/lib/types/appraisal";

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

// ─── Appraisal RBAC ───────────────────────────────────────────────────────────

/** Roles that can view the team appraisals page (manager's direct reports). */
export const APPRAISAL_SUPERVISOR_ROLES: RoleName[] = [
  "LINE_MANAGER",
  "SUPERVISOR",
];

/** Roles that can view all appraisals, run HR calibration, manage cycles. */
export const APPRAISAL_HR_ROLES: RoleName[] = [
  "HR",
  "EXECUTIVE_DIRECTOR",
  "MANAGING_DIRECTOR",
];

/** Roles that can finalize (Committee / Management decision). */
export const APPRAISAL_FINALIZE_ROLES: RoleName[] = [
  "EXECUTIVE_DIRECTOR",
  "MANAGING_DIRECTOR",
];

/** Can the user view the team appraisals tab? */
export function canViewTeamAppraisals(user: User | null): boolean {
  return hasRole(user, ...APPRAISAL_SUPERVISOR_ROLES, ...APPRAISAL_HR_ROLES);
}

/** Can the user view all appraisals (org-wide)? */
export function canViewAllAppraisals(user: User | null): boolean {
  return hasRole(user, ...APPRAISAL_HR_ROLES);
}

/** Can the user perform HR calibration? */
export function canHrCalibrate(user: User | null): boolean {
  return hasRole(user, "HR");
}

/** Can the user finalize an appraisal (committee decision)? */
export function canFinalizeAppraisal(user: User | null): boolean {
  return hasRole(user, ...APPRAISAL_FINALIZE_ROLES);
}

/** Can the user reopen an appraisal at any stage? */
export function canReopenAppraisal(user: User | null): boolean {
  return hasRole(user, "HR");
}

/** Can the user manage cycles and templates? */
export function canManageAppraisalAdmin(user: User | null): boolean {
  return hasRole(user, "HR");
}

/**
 * Determine whether the current user can take the primary action on an appraisal
 * given its current status.
 */
export function canActOnAppraisal(
  user: User | null,
  status: AppraisalStatusCode,
  appraisalEmployeeId: string
): boolean {
  if (!user) return false;
  const isOwner = user.id === appraisalEmployeeId;
  switch (status) {
    case "NOT_STARTED":
    case "DRAFT":
    case "REOPENED_FOR_EMPLOYEE":
      return isOwner;
    case "SELF_SUBMITTED":
    case "REOPENED_FOR_SUPERVISOR":
      return hasRole(user, ...APPRAISAL_SUPERVISOR_ROLES);
    case "PENDING_APPRAISEE_ACCEPTANCE":
      return isOwner;
    case "PENDING_HR_CALIBRATION":
      return canHrCalibrate(user);
    case "PENDING_MANAGEMENT_DECISION":
      return canFinalizeAppraisal(user);
    case "FINALIZED":
      return false;
    default:
      return false;
  }
}
