"use client";

import Link from "next/link";
import { Loader2, FileEdit, Clock, Wallet } from "lucide-react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { StatCard } from "@/components/hrm/ui/StatCard";
import { DataTable } from "@/components/hrm/ui/DataTable";
import { Button } from "@/components/ui/button";
import { LoanStatusBadge } from "@/components/hrm/loans/LoanStatusBadge";
import { useLoanApplications } from "@/lib/api/loans";
import { useLoanAccessFlags } from "@/lib/loans/access";
import { formatLoanCurrency, formatLoanDate } from "@/lib/loans/format";
import type { LoanApplication, LoanStatus } from "@/lib/types/loan";

const TABLE_COLUMNS = [
  { key: "type", label: "Loan type" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
  { key: "created", label: "Created" },
  { key: "action", label: "" },
];

const PENDING_STATUSES: LoanStatus[] = [
  "PENDING_MANAGER",
  "PENDING_HR",
  "PENDING_ED",
  "PENDING_MD",
];

function sortByCreatedDesc(loans: LoanApplication[]): LoanApplication[] {
  return [...loans].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export default function LoansDashboardPage() {
  const { isPrivilegedList: privileged } = useLoanAccessFlags();
  const { data: loans = [], isLoading } = useLoanApplications();

  const sorted = sortByCreatedDesc(loans);
  const recent = sorted.slice(0, 8);

  const draftCount = loans.filter((l) => l.status === "DRAFT").length;
  const pendingCount = loans.filter((l) =>
    PENDING_STATUSES.includes(l.status)
  ).length;
  const activeCount = loans.filter((l) => l.status === "ACTIVE").length;

  const tableRows = recent.map((row) => ({
    type: (
      <span className="font-medium text-foreground">{row.loan_type.name}</span>
    ),
    amount: (
      <span className="text-muted-foreground">
        {formatLoanCurrency(row.amount)}
      </span>
    ),
    status: <LoanStatusBadge status={row.status} />,
    created: (
      <span className="text-muted-foreground">
        {formatLoanDate(row.created_at)}
      </span>
    ),
    action: (
      <Link
        href={`/loans/requests/${row.id}`}
        className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-muted hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        View
      </Link>
    ),
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="Staff Loans"
        subtitle={
          privileged
            ? "Overview of loan applications across the organisation."
            : "Apply for loans and track your applications and repayments."
        }
        action={
          <span data-tour="loans-apply-btn">
          <Button
            nativeButton={false}
            render={<Link href="/loans/apply" />}
            size="lg"
            className="rounded-full px-5 shadow-sm"
          >
            Apply for loan
          </Button>
          </span>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <section className="space-y-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 custom-shadow sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" data-tour="loans-stats">
            <StatCard
              label="Draft applications"
              value={String(draftCount)}
              icon={<FileEdit className="h-4 w-4" />}
              trend={privileged ? "organisation" : "yours"}
            />
            <StatCard
              label="Pending approval"
              value={String(pendingCount)}
              icon={<Clock className="h-4 w-4" />}
              trend="in workflow"
            />
            <StatCard
              label="Active loans"
              value={String(activeCount)}
              icon={<Wallet className="h-4 w-4" />}
              trend={privileged ? "disbursed" : "current"}
            />
          </div>

          <DataTable
            columns={TABLE_COLUMNS}
            rows={tableRows}
            emptyMessage="No loan applications yet. Start by applying for a loan."
            header={
              <div className="flex items-center justify-between px-6 py-4">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Recent applications
                </h2>
                <Link
                  href="/loans/history"
                  className="cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  View all
                </Link>
              </div>
            }
          />
        </section>
      )}
    </div>
  );
}
