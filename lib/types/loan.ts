import type { PaginatedResponse } from "./leave";

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

export type LoanStatus =
  | "DRAFT"
  | "PENDING_HR"
  | "PENDING_ED"
  | "PENDING_MD"
  | "APPROVED"
  | "REJECTED"
  | "ACTIVE"
  | "CLOSED"
  | "LIQUIDATED";

export const LOAN_STATUS_DISPLAY: Record<LoanStatus, string> = {
  DRAFT: "Draft",
  PENDING_HR: "Pending HR",
  PENDING_ED: "Pending Executive Director",
  PENDING_MD: "Pending Managing Director",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  ACTIVE: "Active",
  CLOSED: "Closed",
  LIQUIDATED: "Liquidated",
};

// ---------------------------------------------------------------------------
// Nested / related entities
// ---------------------------------------------------------------------------

/** Employee on loan application read responses (no nested id). */
export interface LoanEmployeeMinimal {
  first_name: string;
  last_name: string;
  email: string;
}

/** Actor on approval logs (first/last name only). */
export interface LoanActorMinimal {
  first_name: string;
  last_name: string;
}

export interface LoanType {
  id: string;
  name: string;
  description: string;
}

export type LoanRepaymentPaymentStatus = "PENDING" | "PAID" | "OVERDUE";

export const LOAN_REPAYMENT_PAYMENT_STATUS_DISPLAY: Record<
  LoanRepaymentPaymentStatus,
  string
> = {
  PENDING: "Pending",
  PAID: "Paid",
  OVERDUE: "Overdue",
};

export interface LoanRepaymentScheduleItem {
  id: string;
  installment_number: number;
  due_date: string;
  amount_due: string;
  payment_status: LoanRepaymentPaymentStatus;
  payment_status_display: string;
}

export interface LoanRepaymentPaymentStatusPayload {
  payment_status: LoanRepaymentPaymentStatus;
}

export type LoanApprovalAction =
  | "SUBMIT"
  | "APPROVE"
  | "REJECT"
  | "DISBURSE"
  | "LIQUIDATE"
  | "CLOSE";

export interface LoanApprovalLog {
  id: string;
  loan: string;
  actor: LoanActorMinimal | null;
  action: LoanApprovalAction;
  action_display: string;
  comment: string;
  previous_status: string;
  new_status: string;
  timestamp: string;
}

/** Approval log nested under employee ledger (no loan FK). */
export interface LoanApprovalLogNested {
  id: string;
  actor: LoanActorMinimal | null;
  action: LoanApprovalAction;
  action_display: string;
  comment: string;
  previous_status: string;
  new_status: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Loan application
// ---------------------------------------------------------------------------

export interface LoanApplication {
  id: string;
  employee: LoanEmployeeMinimal;
  loan_type: LoanType;
  amount: string;
  tenure_months: number;
  monthly_installment: string | null;
  purpose: string;
  status: LoanStatus;
  status_display: string;
  outstanding_balance: string | null;
  disbursed_at: string | null;
  closed_at: string | null;
  resignation_deducted: boolean;
  repayment_schedule: LoanRepaymentScheduleItem[];
  created_at: string;
  updated_at: string;
}

/** Single loan in employee ledger report (includes audit trail). */
export interface LoanApplicationLedgerItem extends LoanApplication {
  logs: LoanApprovalLogNested[];
}

// ---------------------------------------------------------------------------
// Write payloads
// ---------------------------------------------------------------------------

export interface LoanApplicationCreatePayload {
  loan_type: string;
  amount: string;
  tenure_months: number;
  purpose: string;
}

export type LoanApplicationPatchPayload = Partial<
  Pick<LoanApplicationCreatePayload, "amount" | "tenure_months" | "purpose">
> & {
  /** HR may change loan type on non-terminal applications. */
  loan_type?: string;
};

/** Body for approve / reject / disburse / liquidate / handle-resignation actions. */
export interface LoanWorkflowCommentPayload {
  comment?: string;
}

// ---------------------------------------------------------------------------
// List pagination
// ---------------------------------------------------------------------------

export type PaginatedLoanList = PaginatedResponse<LoanApplication>;

// ---------------------------------------------------------------------------
// HR reports
// ---------------------------------------------------------------------------

export interface OutstandingLoanRow {
  employee_name: string;
  loan_type: string;
  original_amount: string;
  outstanding_balance: string;
  disbursed_at: string;
  remaining_installments_count: number;
  loan_id: string;
}

export interface OutstandingLoansReportResponse {
  results: OutstandingLoanRow[];
}

export interface ScheduleSummaryMonth {
  month_label: string;
  total_amount_due: string;
  installment_count: number;
}

export interface ScheduleSummaryReportResponse {
  results: ScheduleSummaryMonth[];
}

export interface EmployeeLoanLedgerResponse {
  employee_id: string;
  loans: LoanApplicationLedgerItem[];
}
