"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { DataTable } from "@/components/hrm/ui/DataTable";
import { LoanStatusBadge } from "@/components/hrm/loans/LoanStatusBadge";
import {
  LoanActionDialog,
  type LoanModalAction,
} from "@/components/hrm/loans/LoanActionDialog";
import { useLoanToast } from "@/components/hrm/loans/LoanToast";
import {
  useLoanApplications,
  useApproveLoan,
  useRejectLoan,
} from "@/lib/api/loans";
import { useAuth } from "@/contexts/AuthContext";
import { hasRole } from "@/lib/rbac";
import { canUserActOnLoanApplication } from "@/lib/loans/approval";
import { getLoanApiErrorMessage } from "@/lib/loans/errors";
import { formatLoanCurrency, formatLoanDate } from "@/lib/loans/format";
import type { LoanApplication, LoanStatus } from "@/lib/types/loan";

const TABLE_COLUMNS = [
  { key: "employee", label: "Employee" },
  { key: "type", label: "Type" },
  { key: "amount", label: "Amount" },
  { key: "tenure", label: "Tenure" },
  { key: "status", label: "Status" },
  { key: "created", label: "Submitted" },
  { key: "action", label: "Actions" },
];

function pendingStatusForUser(
  user: ReturnType<typeof useAuth>["user"]
): LoanStatus | null {
  if (!user) return null;
  if (hasRole(user, "LINE_MANAGER")) return "PENDING_MANAGER";
  if (hasRole(user, "HR")) return "PENDING_HR";
  if (hasRole(user, "EXECUTIVE_DIRECTOR")) return "PENDING_ED";
  if (hasRole(user, "MANAGING_DIRECTOR")) return "PENDING_MD";
  return null;
}

interface ModalState {
  loan: LoanApplication;
  action: LoanModalAction;
}

export default function LoanApprovalsPage() {
  const { user } = useAuth();
  const { showToast, Toast } = useLoanToast();
  const pendingStatus = pendingStatusForUser(user);

  const { data: loans = [], isLoading } = useLoanApplications(
    pendingStatus ? { status: pendingStatus } : undefined
  );

  const approveMutation = useApproveLoan();
  const rejectMutation = useRejectLoan();
  const [modal, setModal] = useState<ModalState | null>(null);

  const pendingLoans = useMemo(() => {
    if (!pendingStatus) return [];
    return loans.filter((l) => l.status === pendingStatus);
  }, [loans, pendingStatus]);

  const mutationPending =
    approveMutation.isPending || rejectMutation.isPending;

  async function handleModalConfirm(comment: string) {
    if (!modal) return;
    try {
      if (modal.action === "approve") {
        await approveMutation.mutateAsync({
          id: modal.loan.id,
          comment: comment || undefined,
        });
        showToast("Loan application approved.");
      } else {
        await rejectMutation.mutateAsync({
          id: modal.loan.id,
          comment,
        });
        showToast("Loan application rejected.");
      }
      setModal(null);
    } catch (err) {
      showToast(
        getLoanApiErrorMessage(err, "Action failed. Please try again.")
      );
    }
  }

  const isLineManager = hasRole(user, "LINE_MANAGER");

  const tableRows = pendingLoans.map((row) => {
    const { canApprove, canReject } = canUserActOnLoanApplication(user, row);
    return {
      employee: (
        <span className="font-medium text-foreground">
          {row.employee.first_name} {row.employee.last_name}
        </span>
      ),
      type: <span className="text-muted-foreground">{row.loan_type.name}</span>,
      amount: (
        <span className="text-muted-foreground">
          {formatLoanCurrency(row.amount)}
        </span>
      ),
      tenure: (
        <span className="text-muted-foreground">{row.tenure_months} mo</span>
      ),
      status: <LoanStatusBadge status={row.status} />,
      created: (
        <span className="text-muted-foreground">
          {formatLoanDate(row.created_at)}
        </span>
      ),
      action: (
        <div className="flex flex-wrap items-center gap-2">
          {canApprove && (
            <button
              type="button"
              disabled={mutationPending}
              onClick={() => setModal({ loan: row, action: "approve" })}
              className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              Approve
            </button>
          )}
          {canReject && (
            <button
              type="button"
              disabled={mutationPending}
              onClick={() => setModal({ loan: row, action: "reject" })}
              className="rounded-md bg-destructive px-2.5 py-1 text-xs font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50"
            >
              Reject
            </button>
          )}
          <Link
            href={`/loans/requests/${row.id}`}
            className={cn(
              "text-xs font-medium text-primary hover:underline",
              !canApprove && !canReject && "ml-0"
            )}
          >
            Details
          </Link>
        </div>
      ),
    };
  });

  return (
    <>
      {Toast}
      <div className="mx-auto max-w-7xl space-y-8">
        <PageHeader
          title={
            isLineManager && pendingStatus === "PENDING_MANAGER"
              ? "Loans awaiting your approval"
              : "Loan approvals"
          }
          subtitle="Review and action loan applications awaiting your approval."
        />

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
          <div data-tour="loans-approvals-queue">
          <DataTable
            columns={TABLE_COLUMNS}
            rows={tableRows}
            emptyMessage="No pending approvals for your role."
          />
          </div>
          <p
            data-tour="loans-approval-actions"
            className="mt-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
          >
            Approve or reject from the Actions column. Managing Director approval
            requires a comment.
          </p>
          {hasRole(user, "HR") ? (
          <p
            data-tour="loans-hr-actions"
            className="mt-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
          >
            HR can disburse approved loans, update repayment status, liquidate
            active loans, and handle resignation from the request detail page.
          </p>
          ) : null}
          </>
        )}
      </div>

      {modal && (
        <LoanActionDialog
          action={modal.action}
          loan={modal.loan}
          onClose={() => setModal(null)}
          onConfirm={handleModalConfirm}
          isPending={mutationPending}
        />
      )}
    </>
  );
}
