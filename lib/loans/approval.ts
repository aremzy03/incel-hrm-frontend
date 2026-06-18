import type { User } from "@/lib/types/auth";
import type { LoanApplication, LoanStatus } from "@/lib/types/loan";
import { hasRole, isLoanObserver } from "@/lib/rbac";

const TERMINAL_STATUSES: LoanStatus[] = ["REJECTED", "CLOSED", "LIQUIDATED"];

const APPROVER_BY_STATUS: Partial<
  Record<
    LoanStatus,
    "LINE_MANAGER" | "HR" | "EXECUTIVE_DIRECTOR" | "MANAGING_DIRECTOR"
  >
> = {
  PENDING_MANAGER: "LINE_MANAGER",
  PENDING_HR: "HR",
  PENDING_ED: "EXECUTIVE_DIRECTOR",
  PENDING_MD: "MANAGING_DIRECTOR",
};

function isLoanOwner(
  user: User | null | undefined,
  loan: LoanApplication | null | undefined
): boolean {
  if (!user || !loan?.employee?.email) return false;
  return (
    user.email.toLowerCase() === loan.employee.email.toLowerCase()
  );
}

function isTerminalStatus(status: LoanStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function requiresCommentOnApprove(status: LoanStatus): boolean {
  return status === "PENDING_MD";
}

export function isLoanReadOnlyViewer(
  user: User | null | undefined,
  hasObserverAccess?: boolean
): boolean {
  return isLoanObserver(user ?? null, hasObserverAccess);
}

export function canUserActOnLoanApplication(
  user: User | null | undefined,
  loan: LoanApplication | null | undefined,
  hasObserverAccess?: boolean
): { canApprove: boolean; canReject: boolean } {
  if (!user || !loan) return { canApprove: false, canReject: false };
  if (isLoanReadOnlyViewer(user, hasObserverAccess)) {
    return { canApprove: false, canReject: false };
  }

  const requiredRole = APPROVER_BY_STATUS[loan.status];
  if (!requiredRole) return { canApprove: false, canReject: false };

  const can = hasRole(user, requiredRole);
  return { canApprove: can, canReject: can };
}

export function isLoanOwnerUser(
  user: User | null | undefined,
  loan: LoanApplication | null | undefined
): boolean {
  return isLoanOwner(user, loan);
}

export function canEmployeeEditLoan(
  user: User | null | undefined,
  loan: LoanApplication | null | undefined
): boolean {
  if (!user || !loan) return false;
  return isLoanOwner(user, loan) && loan.status === "DRAFT";
}

export function canEmployeeSubmitLoan(
  user: User | null | undefined,
  loan: LoanApplication | null | undefined
): boolean {
  if (!user || !loan) return false;
  return isLoanOwner(user, loan) && loan.status === "DRAFT";
}

export function canHrPatchLoan(
  user: User | null | undefined,
  loan: LoanApplication | null | undefined
): boolean {
  if (!user || !loan) return false;
  if (!hasRole(user, "HR")) return false;
  return !isTerminalStatus(loan.status);
}

export function canHrDisburse(
  user: User | null | undefined,
  loan: LoanApplication | null | undefined
): boolean {
  if (!user || !loan) return false;
  return hasRole(user, "HR") && loan.status === "APPROVED";
}

export function canHrLiquidate(
  user: User | null | undefined,
  loan: LoanApplication | null | undefined
): boolean {
  if (!user || !loan) return false;
  return hasRole(user, "HR") && loan.status === "ACTIVE";
}

export function canHrHandleResignation(
  user: User | null | undefined,
  loan: LoanApplication | null | undefined
): boolean {
  if (!user || !loan) return false;
  return hasRole(user, "HR") && loan.status === "ACTIVE";
}

/** HR may mark installment payment status on ACTIVE loans only. */
export function canHrUpdateRepaymentPaymentStatus(
  user: User | null | undefined,
  loan: LoanApplication | null | undefined
): boolean {
  if (!user || !loan) return false;
  return hasRole(user, "HR") && loan.status === "ACTIVE";
}
