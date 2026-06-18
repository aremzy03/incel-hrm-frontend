"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { requiresCommentOnApprove } from "@/lib/loans/approval";
import type { LoanApplication, LoanStatus } from "@/lib/types/loan";

export type LoanModalAction = "approve" | "reject";

interface LoanActionDialogProps {
  action: LoanModalAction;
  loan: LoanApplication;
  onClose: () => void;
  onConfirm: (comment: string) => void;
  isPending: boolean;
}

function approvalNextStepCopy(status: LoanStatus): string {
  switch (status) {
    case "PENDING_MANAGER":
      return "Approving moves this application to HR review.";
    case "PENDING_HR":
      return "Approving moves this application to the Executive Director.";
    case "PENDING_ED":
      return "Approving moves this application to the Managing Director.";
    case "PENDING_MD":
      return "Approving fully approves this loan application.";
    default:
      return "Approving moves this application to the next stage in the approval chain.";
  }
}

export function LoanActionDialog({
  action,
  loan,
  onClose,
  onConfirm,
  isPending,
}: LoanActionDialogProps) {
  const [comment, setComment] = useState("");
  const isApprove = action === "approve";
  const commentRequiredOnApprove = requiresCommentOnApprove(
    loan.status as LoanStatus
  );
  const confirmTitle = isApprove ? "Confirm approval" : "Confirm rejection";

  const canSubmit = isApprove
    ? !commentRequiredOnApprove || comment.trim().length > 0
    : comment.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition hover:bg-muted"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold text-foreground">{confirmTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isApprove
            ? approvalNextStepCopy(loan.status as LoanStatus)
            : "Rejecting ends the process and notifies the employee."}
        </p>

        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {isApprove ? (
              <>
                Comment{" "}
                {commentRequiredOnApprove ? (
                  <span className="text-xs font-normal text-destructive">
                    (required for MD approval)
                  </span>
                ) : (
                  <span className="text-xs font-normal text-muted-foreground">
                    (optional)
                  </span>
                )}
              </>
            ) : (
              <>
                Reason{" "}
                <span className="text-xs font-normal text-destructive">
                  (required)
                </span>
              </>
            )}
          </label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full resize-none rounded-lg border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder={
              isApprove ? "Add a comment…" : "Provide a reason for the employee…"
            }
          />
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:opacity-80"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(comment.trim())}
            disabled={isPending || !canSubmit}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition hover:opacity-90 disabled:opacity-50",
              isApprove
                ? "bg-primary text-primary-foreground"
                : "bg-destructive text-destructive-foreground"
            )}
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmTitle}
          </button>
        </div>
      </div>
    </div>
  );
}
