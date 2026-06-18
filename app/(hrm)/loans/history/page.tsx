"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Eye } from "lucide-react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { DataTable } from "@/components/hrm/ui/DataTable";
import { LoanStatusBadge } from "@/components/hrm/loans/LoanStatusBadge";
import { useLoanApplications, useLoanTypes } from "@/lib/api/loans";
import { useLoanAccessFlags } from "@/lib/loans/access";
import { formatLoanCurrency, formatLoanDate } from "@/lib/loans/format";
import { LOAN_STATUS_DISPLAY, type LoanStatus } from "@/lib/types/loan";
import { Button } from "@/components/ui/button";

const ALL_STATUSES = Object.keys(LOAN_STATUS_DISPLAY) as LoanStatus[];

const TABLE_COLUMNS = [
  { key: "employee", label: "Employee" },
  { key: "type", label: "Loan type" },
  { key: "amount", label: "Amount" },
  { key: "tenure", label: "Tenure" },
  { key: "status", label: "Status" },
  { key: "balance", label: "Outstanding" },
  { key: "created", label: "Created" },
  { key: "view", label: "" },
];

const selectClass =
  "rounded-lg border border-border bg-input px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

function sortByCreatedDesc<T extends { created_at: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export default function LoanHistoryPage() {
  const { isPrivilegedList: privileged } = useLoanAccessFlags();

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loanTypeFilter, setLoanTypeFilter] = useState<string>("");
  const [employeeFilter, setEmployeeFilter] = useState<string>("");

  const listParams = useMemo(
    () => ({
      ...(privileged && statusFilter ? { status: statusFilter } : {}),
      ...(privileged && loanTypeFilter ? { loan_type: loanTypeFilter } : {}),
      ...(privileged && employeeFilter.trim()
        ? { employee: employeeFilter.trim() }
        : {}),
    }),
    [privileged, statusFilter, loanTypeFilter, employeeFilter]
  );

  const { data: loans = [], isLoading } = useLoanApplications(listParams);
  const { data: loanTypes = [] } = useLoanTypes();

  const sorted = sortByCreatedDesc(loans);

  const tableRows = sorted.map((row) => ({
    employee: privileged ? (
      <span className="font-medium text-foreground">
        {row.employee.first_name} {row.employee.last_name}
      </span>
    ) : null,
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
    balance: (
      <span className="text-muted-foreground">
        {row.outstanding_balance != null
          ? formatLoanCurrency(row.outstanding_balance)
          : "—"}
      </span>
    ),
    created: (
      <span className="text-muted-foreground">
        {formatLoanDate(row.created_at)}
      </span>
    ),
    view: (
      <Link
        href={`/loans/requests/${row.id}`}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        <Eye className="h-3.5 w-3.5" />
        View
      </Link>
    ),
  }));

  const columns = privileged
    ? TABLE_COLUMNS
    : TABLE_COLUMNS.filter((c) => c.key !== "employee");

  const rows = tableRows.map((r) => {
    if (!privileged) {
      const { employee: _e, ...rest } = r;
      return rest;
    }
    return r;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link href="/loans" className="text-primary hover:underline">
          Staff Loans
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">
          {privileged ? "All loans" : "My loans"}
        </span>
      </nav>

      <PageHeader
        title={privileged ? "Loan history" : "My loan history"}
        subtitle="View and filter loan applications."
        action={
          <Button
            nativeButton={false}
            render={<Link href="/loans/apply" />}
            className="rounded-full"
          >
            Apply for loan
          </Button>
        }
      />

      {privileged && (
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={selectClass}
            >
              <option value="">All statuses</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {LOAN_STATUS_DISPLAY[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Loan type
            </label>
            <select
              value={loanTypeFilter}
              onChange={(e) => setLoanTypeFilter(e.target.value)}
              className={selectClass}
            >
              <option value="">All types</option>
              {loanTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Employee ID
            </label>
            <input
              type="text"
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              placeholder="UUID"
              className={selectClass}
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
        <div data-tour="loans-history-table">
        <DataTable
          columns={columns}
          rows={rows}
          emptyMessage={
            privileged
              ? "No loan applications match your filters."
              : "You have no loan applications yet. Apply for a loan to get started."
          }
        />
        </div>
        <p
          data-tour="loans-workflow-tip"
          className="mt-4 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
        >
          Open a draft application to submit it for approval. Active loans show a
          repayment schedule on the request detail page after HR disburses.
        </p>
        </>
      )}
    </div>
  );
}
