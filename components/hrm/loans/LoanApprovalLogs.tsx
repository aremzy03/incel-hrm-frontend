"use client";

import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { useLoanLogs } from "@/lib/api/loans";
import type { LoanApprovalLog } from "@/lib/types/loan";
import { formatLoanDateTime } from "@/lib/loans/format";
import { LOAN_STATUS_DISPLAY, type LoanStatus } from "@/lib/types/loan";

function getActionIcon(action: string) {
  switch (action) {
    case "APPROVE":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "REJECT":
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Clock className="h-4 w-4 text-yellow-600" />;
  }
}

function statusLabel(status: string): string {
  if (status in LOAN_STATUS_DISPLAY) {
    return LOAN_STATUS_DISPLAY[status as LoanStatus];
  }
  return status || "—";
}

interface LoanApprovalLogsProps {
  loanId: string;
  enabled: boolean;
}

export function LoanApprovalLogs({ loanId, enabled }: LoanApprovalLogsProps) {
  const { data: logs, isLoading } = useLoanLogs(loanId, { enabled });

  if (!enabled) return null;

  return (
    <section className="rounded-xl border border-border/90 bg-card shadow-sm">
      <div className="border-b border-border/80 px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Approval history</h3>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !logs?.length ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">
          No approval activity recorded yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left">
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                  When
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                  Actor
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                  Action
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                  Comment
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: LoanApprovalLog) => (
                <tr key={log.id} className="border-t border-border/60">
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatLoanDateTime(log.timestamp)}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {log.actor
                      ? `${log.actor.first_name} ${log.actor.last_name}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      {getActionIcon(log.action)}
                      {log.action_display}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {log.previous_status || log.new_status
                      ? `${statusLabel(log.previous_status)} → ${statusLabel(log.new_status)}`
                      : "—"}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-muted-foreground">
                    {log.comment || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
