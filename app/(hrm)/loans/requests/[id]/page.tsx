"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Pencil, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { LoanStatusBadge } from "@/components/hrm/loans/LoanStatusBadge";
import { RepaymentScheduleTable } from "@/components/hrm/loans/RepaymentScheduleTable";
import { LoanApprovalLogs } from "@/components/hrm/loans/LoanApprovalLogs";
import {
  LoanActionDialog,
  type LoanModalAction,
} from "@/components/hrm/loans/LoanActionDialog";
import { useLoanToast } from "@/components/hrm/loans/LoanToast";
import {
  useLoanApplication,
  usePatchLoanApplication,
  useSubmitLoan,
  useApproveLoan,
  useRejectLoan,
  useDisburseLoan,
  useLiquidateLoan,
  useHandleResignationLoan,
  useUpdateRepaymentPaymentStatus,
} from "@/lib/api/loans";
import { useAuth } from "@/contexts/AuthContext";
import { canViewLoanLogs, hasRole } from "@/lib/rbac";
import { useLoanAccessFlags } from "@/lib/loans/access";
import type { LoanRepaymentPaymentStatus } from "@/lib/types/loan";
import {
  canUserActOnLoanApplication,
  canEmployeeEditLoan,
  canEmployeeSubmitLoan,
  canHrDisburse,
  canHrLiquidate,
  canHrHandleResignation,
  canHrUpdateRepaymentPaymentStatus,
  isLoanOwnerUser,
  isLoanReadOnlyViewer,
} from "@/lib/loans/approval";
import { getLoanApiErrorMessage } from "@/lib/loans/errors";
import { formatLoanCurrency, formatLoanDate, formatLoanDateTime } from "@/lib/loans/format";
import { ApiError } from "@/lib/api-client";
import { stitchFieldClass } from "@/lib/design/field-styles";

type ApprovalModal = { action: LoanModalAction };
type HrConfirmAction = "disburse" | "liquidate" | "resignation";

export default function LoanRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const { hasReportAccess, isObserver } = useLoanAccessFlags();
  const { showToast, Toast } = useLoanToast();

  const { data: loan, isLoading, error } = useLoanApplication(id);
  const patchMutation = usePatchLoanApplication();
  const submitMutation = useSubmitLoan();
  const approveMutation = useApproveLoan();
  const rejectMutation = useRejectLoan();
  const disburseMutation = useDisburseLoan();
  const liquidateMutation = useLiquidateLoan();
  const resignationMutation = useHandleResignationLoan();
  const paymentStatusMutation = useUpdateRepaymentPaymentStatus();

  const [editing, setEditing] = useState(false);
  const [updatingScheduleId, setUpdatingScheduleId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editTenure, setEditTenure] = useState("");
  const [editPurpose, setEditPurpose] = useState("");
  const [approvalModal, setApprovalModal] = useState<ApprovalModal | null>(null);
  const [hrConfirm, setHrConfirm] = useState<HrConfirmAction | null>(null);
  const [submitConfirm, setSubmitConfirm] = useState(false);

  const mutationPending =
    patchMutation.isPending ||
    submitMutation.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending ||
    disburseMutation.isPending ||
    liquidateMutation.isPending ||
    resignationMutation.isPending ||
    paymentStatusMutation.isPending;

  const viewLogs = canViewLoanLogs(user, loan, hasReportAccess);

  function startEdit() {
    if (!loan) return;
    setEditAmount(loan.amount);
    setEditTenure(String(loan.tenure_months));
    setEditPurpose(loan.purpose);
    setEditing(true);
  }

  async function saveEdit() {
    if (!loan) return;
    const amt = parseFloat(editAmount);
    const tenure = parseInt(editTenure, 10);
    if (Number.isNaN(amt) || amt <= 0) {
      showToast("Amount must be greater than zero.");
      return;
    }
    if (Number.isNaN(tenure) || tenure < 1 || tenure > 12) {
      showToast("Tenure must be between 1 and 12 months.");
      return;
    }
    try {
      await patchMutation.mutateAsync({
        id: loan.id,
        payload: {
          amount: amt.toFixed(2),
          tenure_months: tenure,
          purpose: editPurpose.trim(),
        },
      });
      setEditing(false);
      showToast("Draft updated.");
    } catch (err) {
      showToast(getLoanApiErrorMessage(err, "Could not save changes."));
    }
  }

  async function handleSubmit() {
    if (!loan) return;
    try {
      await submitMutation.mutateAsync(loan.id);
      setSubmitConfirm(false);
      showToast("Application submitted for approval.");
    } catch (err) {
      const message = getLoanApiErrorMessage(
        err,
        "Could not submit application. Check eligibility and try again."
      );
      const withCta =
        message.toLowerCase().includes("line manager")
          ? `${message} Contact HR to assign a line manager.`
          : message;
      showToast(withCta);
    }
  }

  async function handleApprovalConfirm(comment: string) {
    if (!loan || !approvalModal) return;
    try {
      if (approvalModal.action === "approve") {
        await approveMutation.mutateAsync({
          id: loan.id,
          comment: comment || undefined,
        });
        showToast("Application approved.");
      } else {
        await rejectMutation.mutateAsync({ id: loan.id, comment });
        showToast("Application rejected.");
      }
      setApprovalModal(null);
    } catch (err) {
      showToast(getLoanApiErrorMessage(err, "Action failed."));
    }
  }

  async function handleHrAction() {
    if (!loan || !hrConfirm) return;
    try {
      if (hrConfirm === "disburse") {
        await disburseMutation.mutateAsync({ id: loan.id });
        showToast("Loan disbursed.");
      } else if (hrConfirm === "liquidate") {
        await liquidateMutation.mutateAsync({ id: loan.id });
        showToast("Loan liquidated.");
      } else {
        await resignationMutation.mutateAsync({ id: loan.id });
        showToast("Loan closed due to resignation.");
      }
      setHrConfirm(null);
    } catch (err) {
      showToast(getLoanApiErrorMessage(err, "Action failed."));
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !loan) {
    const forbidden = error instanceof ApiError && error.status === 403;
    return (
      <div className="mx-auto max-w-7xl space-y-4">
        <Link
          href="/loans/history"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to history
        </Link>
        <p className="text-sm text-muted-foreground">
          {forbidden
            ? "You don't have permission to view this loan."
            : "Loan application not found."}
        </p>
      </div>
    );
  }

  const readOnlyViewer = isLoanReadOnlyViewer(user, hasReportAccess);
  const isOwner = isLoanOwnerUser(user, loan);
  const { canApprove: canApproveRole, canReject: canRejectRole } =
    canUserActOnLoanApplication(user, loan, hasReportAccess);
  const canApprove = canApproveRole && !isOwner && !readOnlyViewer;
  const canReject = canRejectRole && !isOwner && !readOnlyViewer;
  const canEdit = canEmployeeEditLoan(user, loan);
  const canSubmit = canEmployeeSubmitLoan(user, loan);
  const showDisburse = !readOnlyViewer && canHrDisburse(user, loan);
  const showLiquidate = !readOnlyViewer && canHrLiquidate(user, loan);
  const showResignation = !readOnlyViewer && canHrHandleResignation(user, loan);
  const showSchedule =
    loan.repayment_schedule.length > 0 &&
    loan.status !== "DRAFT";
  const canEditRepaymentStatus =
    !readOnlyViewer && canHrUpdateRepaymentPaymentStatus(user, loan);
  const showHrRoutingHint =
    hasRole(user, "HR") && loan.manager_approver_is_management;
  const loanId = loan.id;

  async function handlePaymentStatusChange(
    scheduleId: string,
    paymentStatus: LoanRepaymentPaymentStatus
  ) {
    setUpdatingScheduleId(scheduleId);
    try {
      await paymentStatusMutation.mutateAsync({
        loanId,
        scheduleId,
        payment_status: paymentStatus,
      });
      showToast("Payment status updated. Outstanding balance recalculated.");
    } catch (err) {
      showToast(
        getLoanApiErrorMessage(err, "Could not update payment status.")
      );
    } finally {
      setUpdatingScheduleId(null);
    }
  }

  const hrConfirmCopy: Record<
    HrConfirmAction,
    { title: string; body: string; confirm: string }
  > = {
    disburse: {
      title: "Disburse loan",
      body: "This will activate the loan, generate the repayment schedule, and set the outstanding balance.",
      confirm: "Disburse",
    },
    liquidate: {
      title: "Liquidate loan",
      body: "This will mark the loan as liquidated and set the outstanding balance to zero. This cannot be undone.",
      confirm: "Liquidate",
    },
    resignation: {
      title: "Close on resignation",
      body: "This closes the loan due to employee resignation. Outstanding balance will be cleared and payroll may deduct remaining entitlement per policy.",
      confirm: "Close loan",
    },
  };

  return (
    <>
      {Toast}
      <div className="mx-auto max-w-7xl space-y-8">
        <Link
          href="/loans/history"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to history
        </Link>

        <PageHeader
          title={`${loan.loan_type.name} — ${formatLoanCurrency(loan.amount)}`}
          subtitle={`${loan.employee.first_name} ${loan.employee.last_name}`}
        />

        <div className="flex flex-wrap items-center gap-3">
          <LoanStatusBadge status={loan.status} />
          {loan.resignation_deducted && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Resignation deducted
            </span>
          )}
          {showHrRoutingHint && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              Routed to Management line manager
            </span>
          )}
        </div>

        {isObserver && (
          <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            View only — you can review this loan but cannot approve or disburse.
          </div>
        )}

        {/* Action toolbar */}
        <div className="flex flex-wrap gap-2">
          {canEdit && !editing && (
            <button
              type="button"
              onClick={startEdit}
              disabled={mutationPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit draft
            </button>
          )}
          {canSubmit && !editing && (
            <button
              type="button"
              onClick={() => setSubmitConfirm(true)}
              disabled={mutationPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              Submit for approval
            </button>
          )}
          {canApprove && (
            <button
              type="button"
              onClick={() => setApprovalModal({ action: "approve" })}
              disabled={mutationPending}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              Approve
            </button>
          )}
          {canReject && (
            <button
              type="button"
              onClick={() => setApprovalModal({ action: "reject" })}
              disabled={mutationPending}
              className="rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50"
            >
              Reject
            </button>
          )}
          {showDisburse && (
            <button
              type="button"
              onClick={() => setHrConfirm("disburse")}
              disabled={mutationPending}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              Disburse
            </button>
          )}
          {showLiquidate && (
            <button
              type="button"
              onClick={() => setHrConfirm("liquidate")}
              disabled={mutationPending}
              className="rounded-lg border border-destructive px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              Liquidate
            </button>
          )}
          {showResignation && (
            <button
              type="button"
              onClick={() => setHrConfirm("resignation")}
              disabled={mutationPending}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              Close on resignation
            </button>
          )}
        </div>

        {/* Summary */}
        <section className="rounded-xl border border-border/90 bg-card p-5 shadow-sm">
          {editing ? (
            <div className="space-y-4 max-w-md">
              <div>
                <label className="mb-1 block text-sm font-medium">Amount</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className={stitchFieldClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Tenure (months)
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={editTenure}
                  onChange={(e) => setEditTenure(e.target.value)}
                  className={stitchFieldClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Purpose</label>
                <textarea
                  rows={3}
                  value={editPurpose}
                  onChange={(e) => setEditPurpose(e.target.value)}
                  className={stitchFieldClass}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={mutationPending}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Employee" value={`${loan.employee.first_name} ${loan.employee.last_name}`} />
              <DetailItem label="Email" value={loan.employee.email} />
              <DetailItem label="Loan type" value={loan.loan_type.name} />
              <DetailItem label="Amount" value={formatLoanCurrency(loan.amount)} />
              <DetailItem label="Tenure" value={`${loan.tenure_months} months`} />
              <DetailItem
                label="Monthly installment"
                value={
                  loan.monthly_installment
                    ? formatLoanCurrency(loan.monthly_installment)
                    : "—"
                }
              />
              <DetailItem
                label="Outstanding balance"
                value={
                  loan.outstanding_balance != null
                    ? formatLoanCurrency(loan.outstanding_balance)
                    : "—"
                }
              />
              <DetailItem label="Created" value={formatLoanDateTime(loan.created_at)} />
              <DetailItem
                label="Disbursed"
                value={formatLoanDateTime(loan.disbursed_at)}
              />
              <DetailItem label="Closed" value={formatLoanDateTime(loan.closed_at)} />
              <DetailItem label="Purpose" value={loan.purpose} className="sm:col-span-2 lg:col-span-3" />
            </dl>
          )}
        </section>

        {showSchedule && (
          <RepaymentScheduleTable
            schedule={loan.repayment_schedule}
            canEditPaymentStatus={canEditRepaymentStatus}
            onPaymentStatusChange={handlePaymentStatusChange}
            updatingScheduleId={updatingScheduleId}
          />
        )}

        <LoanApprovalLogs loanId={loan.id} enabled={viewLogs} />
      </div>

      {approvalModal && (
        <LoanActionDialog
          action={approvalModal.action}
          loan={loan}
          onClose={() => setApprovalModal(null)}
          onConfirm={handleApprovalConfirm}
          isPending={approveMutation.isPending || rejectMutation.isPending}
        />
      )}

      {submitConfirm && (
        <ConfirmDialog
          title="Submit for approval?"
          body="Your application will be submitted for approval. You won't be able to edit it after submission."
          confirmLabel="Submit"
          onClose={() => setSubmitConfirm(false)}
          onConfirm={handleSubmit}
          isPending={submitMutation.isPending}
        />
      )}

      {hrConfirm && (
        <ConfirmDialog
          title={hrConfirmCopy[hrConfirm].title}
          body={hrConfirmCopy[hrConfirm].body}
          confirmLabel={hrConfirmCopy[hrConfirm].confirm}
          destructive={hrConfirm === "liquidate"}
          onClose={() => setHrConfirm(null)}
          onConfirm={handleHrAction}
          isPending={
            disburseMutation.isPending ||
            liquidateMutation.isPending ||
            resignationMutation.isPending
          }
        />
      )}
    </>
  );
}

function DetailItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  );
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  destructive,
  onClose,
  onConfirm,
  isPending,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50",
              destructive
                ? "bg-destructive text-destructive-foreground"
                : "bg-primary text-primary-foreground"
            )}
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
