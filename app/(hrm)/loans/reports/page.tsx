"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Download } from "lucide-react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import {
  useLoanTypes,
  useOutstandingLoansReport,
  useScheduleSummaryReport,
  useEmployeeLedgerReport,
  downloadLoanReportCsv,
} from "@/lib/api/loans";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessLoanReports } from "@/lib/rbac";
import { formatLoanCurrency, formatLoanDate } from "@/lib/loans/format";
import { getLoanApiErrorMessage } from "@/lib/loans/errors";
import { useLoanToast } from "@/components/hrm/loans/LoanToast";

type Tab = "outstanding" | "schedule" | "ledger";

const selectClass =
  "rounded-lg border border-border bg-input px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export default function LoanReportsPage() {
  const { user } = useAuth();
  const { showToast, Toast } = useLoanToast();
  const allowed = canAccessLoanReports(user);

  const [tab, setTab] = useState<Tab>("outstanding");
  const [loanTypeFilter, setLoanTypeFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [ledgerEmployeeId, setLedgerEmployeeId] = useState("");
  const [csvLoading, setCsvLoading] = useState(false);

  const { data: loanTypes = [] } = useLoanTypes();
  const outstanding = useOutstandingLoansReport(
    { loan_type: loanTypeFilter || undefined, employee: employeeFilter || undefined },
    { enabled: allowed && tab === "outstanding" }
  );
  const schedule = useScheduleSummaryReport({
    enabled: allowed && tab === "schedule",
  });
  const ledger = useEmployeeLedgerReport(ledgerEmployeeId, {
    enabled: allowed && tab === "ledger" && !!ledgerEmployeeId.trim(),
  });

  async function exportCsv(path: string) {
    setCsvLoading(true);
    try {
      await downloadLoanReportCsv(path);
      showToast("Download started.");
    } catch (err) {
      showToast(getLoanApiErrorMessage(err, "CSV export failed."));
    } finally {
      setCsvLoading(false);
    }
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-7xl space-y-4">
        <PageHeader title="Loan reports" subtitle="HR finance reports" />
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to access loan reports. HR role is required.
        </p>
        <Link href="/loans" className="text-sm text-primary hover:underline">
          Back to Staff Loans
        </Link>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "outstanding", label: "Outstanding loans" },
    { id: "schedule", label: "Schedule summary" },
    { id: "ledger", label: "Employee ledger" },
  ];

  return (
    <>
      {Toast}
      <div className="mx-auto max-w-7xl space-y-8">
        <PageHeader
          title="Loan reports"
          subtitle="Finance views for outstanding balances, repayment schedules, and employee ledgers."
        />

        <div className="flex flex-wrap gap-2 border-b border-border pb-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={
                tab === t.id
                  ? "rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                  : "rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted"
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "outstanding" && (
          <ReportSection
            loading={outstanding.isLoading}
            toolbar={
              <>
                <select
                  value={loanTypeFilter}
                  onChange={(e) => setLoanTypeFilter(e.target.value)}
                  className={selectClass}
                >
                  <option value="">All loan types</option>
                  {loanTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={employeeFilter}
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                  placeholder="Employee UUID"
                  className={selectClass}
                />
                <ExportButton
                  disabled={csvLoading}
                  onClick={() => {
                    const qs = new URLSearchParams({ format: "csv" });
                    if (loanTypeFilter) qs.set("loan_type", loanTypeFilter);
                    if (employeeFilter.trim()) qs.set("employee", employeeFilter.trim());
                    exportCsv(`loans/reports/outstanding/?${qs.toString()}`);
                  }}
                />
              </>
            }
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="px-4 py-2 text-xs font-semibold text-muted-foreground">Employee</th>
                  <th className="px-4 py-2 text-xs font-semibold text-muted-foreground">Type</th>
                  <th className="px-4 py-2 text-xs font-semibold text-muted-foreground">Original</th>
                  <th className="px-4 py-2 text-xs font-semibold text-muted-foreground">Outstanding</th>
                  <th className="px-4 py-2 text-xs font-semibold text-muted-foreground">Disbursed</th>
                  <th className="px-4 py-2 text-xs font-semibold text-muted-foreground">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {(outstanding.data?.results ?? []).map((row) => (
                  <tr key={row.loan_id} className="border-t border-border/60">
                    <td className="px-4 py-3">{row.employee_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.loan_type}</td>
                    <td className="px-4 py-3">{formatLoanCurrency(row.original_amount)}</td>
                    <td className="px-4 py-3 font-medium">{formatLoanCurrency(row.outstanding_balance)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatLoanDate(row.disbursed_at)}</td>
                    <td className="px-4 py-3">{row.remaining_installments_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!outstanding.isLoading && !(outstanding.data?.results?.length) && (
              <EmptyReport message="No outstanding loans." />
            )}
          </ReportSection>
        )}

        {tab === "schedule" && (
          <ReportSection
            loading={schedule.isLoading}
            toolbar={
              <ExportButton
                disabled={csvLoading}
                onClick={() =>
                  exportCsv("loans/reports/schedule-summary/?format=csv")
                }
              />
            }
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="px-4 py-2 text-xs font-semibold text-muted-foreground">Month</th>
                  <th className="px-4 py-2 text-xs font-semibold text-muted-foreground">Total due</th>
                  <th className="px-4 py-2 text-xs font-semibold text-muted-foreground">Installments</th>
                </tr>
              </thead>
              <tbody>
                {(schedule.data?.results ?? []).map((row) => (
                  <tr key={row.month_label} className="border-t border-border/60">
                    <td className="px-4 py-3 font-medium">{row.month_label}</td>
                    <td className="px-4 py-3">{formatLoanCurrency(row.total_amount_due)}</td>
                    <td className="px-4 py-3">{row.installment_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!schedule.isLoading && !(schedule.data?.results?.length) && (
              <EmptyReport message="No schedule data." />
            )}
          </ReportSection>
        )}

        {tab === "ledger" && (
          <ReportSection
            loading={ledger.isLoading}
            toolbar={
              <>
                <input
                  type="text"
                  value={ledgerEmployeeId}
                  onChange={(e) => setLedgerEmployeeId(e.target.value)}
                  placeholder="Employee UUID"
                  className={selectClass}
                />
                <ExportButton
                  disabled={csvLoading || !ledgerEmployeeId.trim()}
                  onClick={() =>
                    exportCsv(
                      `loans/reports/employee-ledger/${ledgerEmployeeId.trim()}/?format=csv`
                    )
                  }
                />
              </>
            }
          >
            {!ledgerEmployeeId.trim() ? (
              <EmptyReport message="Enter an employee ID to load their loan ledger." />
            ) : ledger.data?.loans.length ? (
              <div className="space-y-6">
                {(ledger.data.loans ?? []).map((loan) => (
                  <div
                    key={loan.id}
                    className="rounded-lg border border-border/80 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-foreground">
                        {loan.loan_type.name} — {formatLoanCurrency(loan.amount)}
                      </p>
                      <span className="text-sm text-muted-foreground">{loan.status_display}</span>
                    </div>
                    {loan.repayment_schedule.length > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {loan.repayment_schedule.length} installments in schedule
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : !ledger.isLoading ? (
              <EmptyReport message="No loans found for this employee." />
            ) : null}
          </ReportSection>
        )}
      </div>
    </>
  );
}

function ReportSection({
  loading,
  toolbar,
  children,
}: {
  loading: boolean;
  toolbar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/90 bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-border/80 px-4 py-3">
        {toolbar}
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="overflow-x-auto p-2">{children}</div>
      )}
    </section>
  );
}

function ExportButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
    >
      <Download className="h-3.5 w-3.5" />
      Export CSV
    </button>
  );
}

function EmptyReport({ message }: { message: string }) {
  return (
    <p className="px-4 py-8 text-center text-sm text-muted-foreground">{message}</p>
  );
}
