"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/hrm/ui/StatusBadge";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { Breadcrumb } from "@/components/hrm/ui/Breadcrumb";
import { DataTable } from "@/components/hrm/ui/DataTable";
import { LeaveBalanceStrip } from "@/components/hrm/leave/LeaveBalanceStrip";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/hrm/forms/FieldLabel";
import { stitchSelectClass } from "@/lib/design/field-styles";
import { useLeaveBalances, useLeaveRequestsPage } from "@/lib/api/leave";
import { useLeaveTypes } from "@/lib/api/leave-types";
import { useAuth } from "@/contexts/AuthContext";
import type { LeaveRequest, LeaveStatus } from "@/lib/types/leave";
import {
  availableBalanceDays,
  formatLeaveDays,
  formatLeaveDuration,
  leaveStatusHint,
} from "@/lib/leave/format";

/** Matches backend DRF PageNumberPagination PAGE_SIZE default. */
const PAGE_SIZE = 20;

const WAITING_STATUSES: LeaveStatus[] = [
  "PENDING_TEAM_LEAD",
  "PENDING_SUPERVISOR",
  "PENDING_MANAGER",
  "PENDING_HR",
  "PENDING_ED",
];

type StatusChipId = "all" | "waiting" | "approved" | "rejected" | "draft";

const STATUS_CHIPS: {
  id: StatusChipId;
  label: string;
  statuses?: LeaveStatus[];
}[] = [
  { id: "all", label: "All" },
  { id: "waiting", label: "Waiting", statuses: WAITING_STATUSES },
  { id: "approved", label: "Approved", statuses: ["APPROVED"] },
  { id: "rejected", label: "Rejected", statuses: ["REJECTED"] },
  { id: "draft", label: "Draft", statuses: ["DRAFT"] },
];

const TABLE_COLUMNS = [
  { key: "type", label: "Leave type" },
  { key: "duration", label: "Duration" },
  { key: "days", label: "Days", mono: true },
  { key: "reason", label: "Reason" },
  { key: "status", label: "Status" },
];

const filterSelectClass = cn(
  stitchSelectClass,
  "w-full max-w-full sm:w-auto sm:min-w-52"
);

function requestRowLabel(row: LeaveRequest): string {
  const duration = formatLeaveDuration(row.start_date, row.end_date);
  const hint = leaveStatusHint(row.status);
  const base = `View ${row.leave_type.name} leave ${duration}`;
  return hint ? `${base}. ${hint}` : base;
}

export default function LeaveHistoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const currentYear = new Date().getFullYear();

  const [statusFilter, setStatusFilter] = useState<StatusChipId>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | string>("all");
  const [page, setPage] = useState(1);

  const selectedStatuses = STATUS_CHIPS.find((c) => c.id === statusFilter)
    ?.statuses;

  const {
    data: requestsPage,
    isLoading: requestsLoading,
    isFetching,
    isError: requestsError,
    refetch: refetchRequests,
  } = useLeaveRequestsPage(
    {
      employee: user?.id,
      status: selectedStatuses?.join(","),
      leave_type: typeFilter === "all" ? undefined : typeFilter,
      page,
    },
    { enabled: !!user?.id }
  );

  const {
    data: balances = [],
    isLoading: balancesLoading,
    isError: balancesError,
    refetch: refetchBalances,
  } = useLeaveBalances(
    { year: currentYear },
    { enabled: !!user }
  );

  const { data: leaveTypes = [] } = useLeaveTypes();

  const records = requestsPage?.results ?? [];
  const total = requestsPage?.count ?? 0;
  const canPrev = !!requestsPage?.previous && page > 1;
  const canNext = !!requestsPage?.next;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const annualBalance = balances.find(
    (b) => (b.leave_type.code ?? "").toUpperCase() === "ANNUAL"
  );
  const annualRemaining = annualBalance
    ? availableBalanceDays(annualBalance)
    : 0;

  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    if (total === 0) return;
    const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (page > maxPage) setPage(maxPage);
  }, [total, page]);

  const tableLoading = authLoading || requestsLoading;
  const balancesBusy = authLoading || balancesLoading;
  const filtersActive = statusFilter !== "all" || typeFilter !== "all";
  const rangeStart =
    total === 0 ? 0 : Math.min((page - 1) * PAGE_SIZE + 1, total);
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const resultsAnnouncement = requestsError
    ? "Could not load your leave history."
    : tableLoading
      ? "Loading leave requests."
      : total === 0
        ? filtersActive
          ? "No requests match the selected filters."
          : "You have not applied for leave yet."
        : `Showing ${rangeStart} to ${rangeEnd} of ${total} requests.`;

  const clearFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
  };

  const emptyMessage = filtersActive ? (
    <span className="inline-flex flex-col items-center gap-3">
      <span>No requests match the selected filters.</span>
      <button
        type="button"
        onClick={clearFilters}
        className="inline-flex min-h-11 items-center font-semibold text-primary-container hover:underline"
      >
        Clear filters
      </button>
    </span>
  ) : (
    <span className="inline-flex flex-col items-center gap-3">
      <span>You have not applied for leave yet.</span>
      <Link
        href="/leave/apply"
        className="inline-flex min-h-11 items-center font-semibold text-primary-container hover:underline"
      >
        Apply for leave
      </Link>
    </span>
  );

  const table = (
    <DataTable
      columns={TABLE_COLUMNS}
      emptyMessage={emptyMessage}
      className={total > 0 ? "rounded-none border-0 [box-shadow:none]" : undefined}
      getRowHref={(i) => `/leave/requests/${records[i].id}`}
      getRowLabel={(i) => requestRowLabel(records[i])}
      rows={records.map((row) => {
        const hint = leaveStatusHint(row.status);
        return {
          type: (
            <span className="font-medium text-on-surface">
              {row.leave_type.name}
            </span>
          ),
          duration: (
            <span className="text-on-surface-variant">
              {formatLeaveDuration(row.start_date, row.end_date)}
            </span>
          ),
          days: (
            <span className="text-on-surface-variant">
              {formatLeaveDays(row.total_working_days)}
            </span>
          ),
          reason: (
            <span
              className="block max-w-[14rem] min-w-0 truncate text-on-surface-variant"
              title={row.reason || undefined}
            >
              {row.reason || "\u2014"}
            </span>
          ),
          status: (
            <div className="flex flex-col items-start gap-1">
              <StatusBadge status={row.status} />
              {hint ? (
                <p className="text-body-md text-on-surface-variant">{hint}</p>
              ) : null}
            </div>
          ),
        };
      })}
    />
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <Breadcrumb
        items={[
          { label: "Leave Management", href: "/leave" },
          { label: "Leave History" },
        ]}
      />

      <div data-tour="leave-history-intro">
        <PageHeader
          className="mb-0"
          title="My Leave History"
          subtitle="Your leave requests and current balances for the year."
          action={
            <div className="w-full sm:w-auto">
              <Button
                nativeButton={false}
                render={<Link href="/leave/apply" />}
                size="lg"
                className="w-full rounded-xl px-6 sm:w-auto"
              >
                Apply for Leave
              </Button>
            </div>
          }
        />
      </div>

      <section
        className="space-y-4"
        aria-labelledby="leave-history-balances-heading"
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2
              id="leave-history-balances-heading"
              className="text-title-sm font-semibold text-on-surface"
            >
              Leave balances
            </h2>
            <p className="text-body-md text-on-surface-variant">
              {balancesBusy || balancesError
                ? `Entitlement by leave type for ${currentYear}.`
                : annualBalance
                  ? `${formatLeaveDays(annualRemaining)} days of annual leave remaining this year.`
                  : `Entitlement by leave type for ${currentYear}.`}
            </p>
          </div>
        </div>
        <div data-tour="leave-history-balances">
          {balancesBusy ? (
            <div className="h-36 animate-pulse rounded-xl bg-surface-container-high" />
          ) : balancesError ? (
            <div
              className="rounded-xl border border-outline-variant bg-surface-container-lowest px-6 py-8 text-center custom-shadow"
              role="alert"
            >
              <p className="text-body-md text-on-surface">
                Could not load your leave balances.
              </p>
              <p className="mt-1 text-body-md text-on-surface-variant">
                Check your connection and try again. Your request list below is
                unaffected.
              </p>
              <button
                type="button"
                onClick={() => refetchBalances()}
                className="mt-4 min-h-11 rounded-xl bg-primary-container px-6 py-3 text-body-md font-semibold text-on-primary hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Try again
              </button>
            </div>
          ) : balances.length > 0 ? (
            <LeaveBalanceStrip balances={balances} />
          ) : (
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest px-6 py-8 text-center custom-shadow">
              <p className="text-body-md text-on-surface-variant">
                No leave balances yet. They appear once HR allocates your
                entitlement for {currentYear}.
              </p>
            </div>
          )}
        </div>
      </section>

      <section
        className="space-y-4"
        aria-labelledby="leave-history-requests-heading"
      >
        <h2
          id="leave-history-requests-heading"
          className="text-title-sm font-semibold text-on-surface"
        >
          Leave requests
        </h2>

        <div
          className="flex flex-col gap-4"
          data-tour="leave-history-filters"
        >
          {authLoading ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-11 w-20 animate-pulse rounded-full bg-surface-container-high"
                />
              ))}
              <div className="h-11 w-52 animate-pulse rounded-xl bg-surface-container-high" />
            </div>
          ) : (
            <>
              <div>
                <p
                  id="leave-history-status-label"
                  className="mb-1.5 text-label-md text-on-surface-variant"
                >
                  Status
                </p>
                <div
                  role="group"
                  aria-labelledby="leave-history-status-label"
                  className="flex flex-wrap gap-2"
                >
                  {STATUS_CHIPS.map((chip) => {
                    const selected = statusFilter === chip.id;
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => setStatusFilter(chip.id)}
                        aria-pressed={selected}
                        className={cn(
                          "inline-flex min-h-11 items-center rounded-full px-4 text-body-md font-medium transition",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          selected
                            ? "bg-primary-container text-on-primary"
                            : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                        )}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="w-full min-w-0 sm:w-auto">
                  <FieldLabel htmlFor="leave-history-type-filter">
                    Leave type
                  </FieldLabel>
                  <select
                    id="leave-history-type-filter"
                    value={typeFilter}
                    className={filterSelectClass}
                    onChange={(e) => {
                      setTypeFilter(e.target.value);
                    }}
                  >
                    <option value="all">All types</option>
                    {leaveTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {filtersActive && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-xl border border-outline-variant px-3 text-body-md text-on-surface-variant transition hover:bg-surface-container-high sm:w-auto"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                    Clear filters
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {resultsAnnouncement}
        </p>
        <div
          data-tour="leave-history-table"
          aria-busy={isFetching && !requestsError}
        >
          {tableLoading ? (
            <div className="h-48 animate-pulse rounded-xl bg-surface-container-high" />
          ) : requestsError ? (
            <div
              className="rounded-xl border border-outline-variant bg-surface-container-lowest px-6 py-10 text-center custom-shadow"
              role="alert"
            >
              <p className="text-body-md text-on-surface">
                Could not load your leave history.
              </p>
              <p className="mt-1 text-body-md text-on-surface-variant">
                The list did not load. Try again, or open a request from Leave
                Dashboard if you just applied.
              </p>
              <button
                type="button"
                onClick={() => refetchRequests()}
                className="mt-4 min-h-11 rounded-xl bg-primary-container px-6 py-3 text-body-md font-semibold text-on-primary hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Try again
              </button>
            </div>
          ) : total > 0 ? (
            <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest custom-shadow">
              <div className="hidden md:block">{table}</div>
              <ul className="divide-y divide-outline-variant md:hidden">
                {records.map((row) => {
                  const hint = leaveStatusHint(row.status);
                  return (
                    <li key={row.id}>
                      <Link
                        href={`/leave/requests/${row.id}`}
                        aria-label={requestRowLabel(row)}
                        className="flex min-h-11 flex-col gap-2 px-4 py-4 active:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 font-medium text-on-surface">
                            {row.leave_type.name}
                          </p>
                          <StatusBadge status={row.status} />
                        </div>
                        <p className="text-body-md text-on-surface-variant">
                          {formatLeaveDuration(row.start_date, row.end_date)}
                          <span className="font-data-table text-data-table tabular-nums">
                            {" "}
                            · {formatLeaveDays(row.total_working_days)}
                            {Number(row.total_working_days) === 1
                              ? " day"
                              : " days"}
                          </span>
                        </p>
                        {hint ? (
                          <p className="text-body-md text-on-surface-variant">
                            {hint}
                          </p>
                        ) : null}
                        {row.reason ? (
                          <p className="line-clamp-2 text-body-md text-on-surface-variant">
                            {row.reason}
                          </p>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="flex flex-col gap-3 border-t border-outline-variant px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-body-md text-on-surface-variant">
                  Showing {rangeStart}&ndash;{rangeEnd} of {total} requests
                  {totalPages > 1 ? (
                    <>
                      {" "}
                      (page {page} of {totalPages})
                    </>
                  ) : null}
                </p>
                <nav
                  className="flex flex-wrap items-center gap-1"
                  aria-label="Pagination"
                >
                  <button
                    type="button"
                    disabled={!canPrev}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-body-md text-on-surface-variant transition hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
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
                              <span className="px-1 text-body-md text-on-surface-variant">
                                …
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setPage(n)}
                              aria-current={n === page ? "page" : undefined}
                              className={cn(
                                "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2.5 text-body-md transition",
                                n === page
                                  ? "bg-primary text-on-primary"
                                  : "text-on-surface-variant hover:bg-surface-container-high"
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
                    className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-body-md text-on-surface-variant transition hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Next page"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </nav>
              </div>
            </div>
          ) : (
            <>
              <div className="hidden md:block">{table}</div>
              <div className="rounded-xl border border-outline-variant bg-surface-container-lowest px-6 py-10 text-center text-body-md text-on-surface-variant custom-shadow md:hidden">
                {emptyMessage}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
