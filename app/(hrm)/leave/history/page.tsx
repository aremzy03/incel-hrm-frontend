"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/hrm/ui/StatusBadge";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { Breadcrumb } from "@/components/hrm/ui/Breadcrumb";
import { DataTable } from "@/components/hrm/ui/DataTable";
import { LeaveBalanceStrip } from "@/components/hrm/leave/LeaveBalanceStrip";
import { stitchSelectClass } from "@/lib/design/field-styles";
import { useLeaveBalances, useLeaveRequestsPage } from "@/lib/api/leave";
import { useLeaveTypes } from "@/lib/api/leave-types";
import { useAuth } from "@/contexts/AuthContext";
import { LEAVE_STATUS_DISPLAY } from "@/lib/types/leave";
import type { LeaveStatus } from "@/lib/types/leave";

/** Matches backend DRF PageNumberPagination PAGE_SIZE default. */
const PAGE_SIZE = 20;

const ALL_STATUSES: LeaveStatus[] = [
  "DRAFT",
  "PENDING_TEAM_LEAD",
  "PENDING_SUPERVISOR",
  "PENDING_MANAGER",
  "PENDING_HR",
  "PENDING_ED",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
];

const TABLE_COLUMNS = [
  { key: "type", label: "Leave Type" },
  { key: "start", label: "Start Date" },
  { key: "end", label: "End Date" },
  { key: "days", label: "Days" },
  { key: "reason", label: "Reason" },
  { key: "status", label: "Status" },
  { key: "view", label: "View" },
];

export default function LeaveHistoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const currentYear = new Date().getFullYear();

  const [statusFilter, setStatusFilter] = useState<"all" | LeaveStatus>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | string>("all");
  const [page, setPage] = useState(1);

  const { data: requestsPage, isLoading: requestsLoading, isFetching } =
    useLeaveRequestsPage(
      {
        employee: user?.id,
        status: statusFilter === "all" ? undefined : statusFilter,
        leave_type: typeFilter === "all" ? undefined : typeFilter,
        page,
      },
      { enabled: !!user?.id }
    );

  const { data: balances = [], isLoading: balancesLoading } = useLeaveBalances(
    { year: currentYear },
    { enabled: !!user }
  );

  const { data: leaveTypes = [] } = useLeaveTypes();

  const records = requestsPage?.results ?? [];
  const total = requestsPage?.count ?? 0;
  const canPrev = !!requestsPage?.previous && page > 1;
  const canNext = !!requestsPage?.next;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    if (total === 0) return;
    const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (page > maxPage) setPage(maxPage);
  }, [total, page]);

  const isLoading = authLoading || requestsLoading || balancesLoading;
  const rangeStart =
    total === 0 ? 0 : Math.min((page - 1) * PAGE_SIZE + 1, total);
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-8">
        <Breadcrumb
          items={[
            { label: "Leave Management", href: "/leave" },
            { label: "Leave History" },
          ]}
        />

        <div data-tour="leave-history-intro">
          <PageHeader
            title="My Leave History"
            subtitle="Your leave requests and current balances for the year."
          />
        </div>

        <div data-tour="leave-history-balances">
          {isLoading ? (
            <div className="h-20 animate-pulse rounded-xl bg-muted" />
          ) : (
            <LeaveBalanceStrip balances={balances} />
          )}
        </div>

        <div>
          <div
            className="mb-4 flex flex-wrap gap-3"
            data-tour="leave-history-filters"
          >
            {authLoading ? (
              <div className="flex gap-3">
                <div className="h-10 w-40 animate-pulse rounded-lg bg-muted" />
                <div className="h-10 w-40 animate-pulse rounded-lg bg-muted" />
              </div>
            ) : (
              <>
                <select
                  value={statusFilter}
                  className={stitchSelectClass}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as "all" | LeaveStatus);
                  }}
                  aria-label="Filter by status"
                >
                  <option value="all">All Statuses</option>
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {LEAVE_STATUS_DISPLAY[s]}
                    </option>
                  ))}
                </select>

                <select
                  value={typeFilter}
                  className={stitchSelectClass}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                  }}
                  aria-label="Filter by leave type"
                >
                  <option value="all">All Types</option>
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>

                {(statusFilter !== "all" || typeFilter !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("all");
                      setTypeFilter("all");
                    }}
                    className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear filters
                  </button>
                )}
              </>
            )}
          </div>

          <div
            className={cn(isFetching && "opacity-70 transition-opacity")}
            data-tour="leave-history-table"
          >
            {isLoading ? (
              <div className="h-48 animate-pulse rounded-xl bg-muted" />
            ) : (
              <>
                <DataTable
                  columns={TABLE_COLUMNS}
                  emptyMessage="No records match the selected filters."
                  rows={records.map((row) => ({
                    type: (
                      <span className="font-medium text-foreground">
                        {row.leave_type.name}
                      </span>
                    ),
                    start: row.start_date,
                    end: row.end_date,
                    days: String(row.total_working_days),
                    reason: (
                      <span className="block max-w-[160px] truncate text-muted-foreground">
                        {row.reason || "\u2014"}
                      </span>
                    ),
                    status: <StatusBadge status={row.status} />,
                    view: (
                      <Link
                        href={`/leave/requests/${row.id}`}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition hover:bg-muted"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden />
                        View
                      </Link>
                    ),
                  }))}
                />

                {total > 0 && (
                  <div className="mt-1 flex items-center justify-between rounded-xl border border-border bg-card px-5 py-3">
                    <p className="text-sm text-muted-foreground">
                      Showing {rangeStart}&ndash;{rangeEnd} of {total} records
                      {totalPages > 1 ? (
                        <>
                          {" "}
                          (page {page} of {totalPages})
                        </>
                      ) : null}
                    </p>
                    <nav
                      className="flex items-center gap-1"
                      aria-label="Pagination"
                    >
                      <button
                        type="button"
                        disabled={!canPrev}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </button>
                      {totalPages > 1 &&
                        Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((n) => {
                            if (totalPages <= 7) return true;
                            if (n === 1 || n === totalPages) return true;
                            return Math.abs(n - page) <= 2;
                          })
                          .map((n, idx, arr) => {
                            const prev = arr[idx - 1];
                            const showEllipsis =
                              prev !== undefined && n - prev > 1;
                            return (
                              <span key={n} className="contents">
                                {showEllipsis && (
                                  <span className="px-1 text-sm text-muted-foreground">
                                    …
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setPage(n)}
                                  aria-current={
                                    n === page ? "page" : undefined
                                  }
                                  className={cn(
                                    "rounded-md px-2.5 py-1 text-sm transition",
                                    n === page
                                      ? "bg-primary text-primary-foreground"
                                      : "text-muted-foreground hover:bg-muted"
                                  )}
                                >
                                  {n}
                                </button>
                              </span>
                            );
                          })}
                      <button
                        type="button"
                        disabled={!canNext}
                        onClick={() => setPage((p) => p + 1)}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Next page"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
