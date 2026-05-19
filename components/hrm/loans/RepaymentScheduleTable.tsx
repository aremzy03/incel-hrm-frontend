"use client";

import { Loader2 } from "lucide-react";
import {
  LOAN_REPAYMENT_PAYMENT_STATUS_DISPLAY,
  type LoanRepaymentPaymentStatus,
  type LoanRepaymentScheduleItem,
} from "@/lib/types/loan";
import { formatLoanCurrency, formatLoanDate } from "@/lib/loans/format";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = Object.keys(
  LOAN_REPAYMENT_PAYMENT_STATUS_DISPLAY
) as LoanRepaymentPaymentStatus[];

function statusBadgeClass(status: LoanRepaymentPaymentStatus): string {
  switch (status) {
    case "PAID":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
    case "OVERDUE":
      return "bg-destructive/15 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}

interface RepaymentScheduleTableProps {
  schedule: LoanRepaymentScheduleItem[];
  canEditPaymentStatus?: boolean;
  onPaymentStatusChange?: (
    scheduleId: string,
    paymentStatus: LoanRepaymentPaymentStatus
  ) => void;
  updatingScheduleId?: string | null;
}

export function RepaymentScheduleTable({
  schedule,
  canEditPaymentStatus = false,
  onPaymentStatusChange,
  updatingScheduleId = null,
}: RepaymentScheduleTableProps) {
  if (!schedule.length) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border/90 bg-card shadow-sm">
      <div className="border-b border-border/80 px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Repayment schedule</h3>
        {canEditPaymentStatus && (
          <p className="mt-1 text-xs text-muted-foreground">
            Mark installments as paid or overdue. Outstanding balance is the sum of
            amounts not yet paid.
          </p>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-left">
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">#</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Due date</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Amount due</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Payment status</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((row) => {
              const isUpdating = updatingScheduleId === row.id;
              return (
                <tr key={row.id} className="border-t border-border/60">
                  <td className="px-4 py-3 tabular-nums text-foreground">{row.installment_number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatLoanDate(row.due_date)}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{formatLoanCurrency(row.amount_due)}</td>
                  <td className="px-4 py-3">
                    {canEditPaymentStatus && onPaymentStatusChange ? (
                      <div className="relative inline-flex items-center">
                        <select
                          className={cn(
                            "rounded-lg border border-border bg-input px-2 py-1.5 text-sm",
                            "focus:outline-none focus:ring-2 focus:ring-ring",
                            isUpdating && "opacity-60"
                          )}
                          value={row.payment_status}
                          disabled={isUpdating}
                          onChange={(e) => {
                            const next = e.target
                              .value as LoanRepaymentPaymentStatus;
                            if (next === row.payment_status) return;
                            onPaymentStatusChange(row.id, next);
                          }}
                          aria-label={`Payment status for installment ${row.installment_number}`}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {LOAN_REPAYMENT_PAYMENT_STATUS_DISPLAY[status]}
                            </option>
                          ))}
                        </select>
                        {isUpdating && (
                          <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    ) : (
                      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", statusBadgeClass(row.payment_status))}>
                        {row.payment_status_display}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}
