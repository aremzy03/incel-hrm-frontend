"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, X, Loader2, Eye, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/hrm/ui/StatusBadge";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { DataTable } from "@/components/hrm/ui/DataTable";
import { useLeaveRequestsPage } from "@/lib/api/leave";
import { useLeaveTypes } from "@/lib/api/leave-types";
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
  { key: "employee", label: "Employee" },
  { key: "type", label: "Leave Type" },
  { key: "start", label: "Start Date" },
  { key: "end", label: "End Date" },
  { key: "days", label: "Days" },
  { key: "reason", label: "Reason" },
  { key: "status", label: "Status" },
  { key: "view", label: "View" },
];

const selectClass =
  "rounded-lg border border-border bg-input px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

function LeaveRequestsDirectoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeParam = searchParams.get("employee");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LeaveStatus>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | string>("all");
  const [page, setPage] = useState(1);

  const { data: requestsPage, isLoading, isFetching } = useLeaveRequestsPage({
    employee: employeeParam ?? undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    leave_type: typeFilter === "all" ? undefined : typeFilter,
    page,
  });

  const { data: leaveTypes = [] } = useLeaveTypes();

  const records = requestsPage?.results ?? [];
  const total = requestsPage?.count ?? 0;
  const canPrev = !!requestsPage?.previous && page > 1;
  const canNext = !!requestsPage?.next;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const employeeFilterLabel = useMemo(() => {
    if (!employeeParam || records.length === 0) return null;
    const match = records.find((r) => r.employee.id === employeeParam);
    if (!match) return null;
    return `${match.employee.first_name} ${match.employee.last_name}`;
  }, [employeeParam, records]);

  useEffect(() => {
    setPage(1);
  }, [employeeParam, statusFilter, typeFilter]);

  useEffect(() => {
    if (total === 0) return;
    const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (page > maxPage) setPage(maxPage);
  }, [total, page]);

  // Search is not supported by the list API; filter the current page only.
  const pageRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => {
      const fullName =
        `${r.employee.first_name} ${r.employee.last_name}`.toLowerCase();
      const email = (r.employee.email ?? "").toLowerCase();
      return fullName.includes(q) || email.includes(q);
    });
  }, [records, search]);

  const rangeStart =
    total === 0 ? 0 : Math.min((page - 1) * PAGE_SIZE + 1, total);
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link href="/leave" className="text-primary hover:underline">
          Leave Management
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">Leave Requests</span>
      </nav>

      <PageHeader
        title="Leave Requests"
        subtitle={
          employeeFilterLabel
            ? `Showing requests for ${employeeFilterLabel}.`
            : "All leave requests across the organisation. Open a record for full details."
        }
      />

      {employeeParam && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm">
          <span className="text-muted-foreground">
            Filtered by employee
            {employeeFilterLabel ? `: ${employeeFilterLabel}` : ""}
          </span>
          <Link
            href="/leave/requests"
            className="ml-auto inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Clear employee filter
          </Link>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className={cn(isFetching && "opacity-70 transition-opacity")}>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search this page by name or email…"
                className={cn(selectClass, "w-full pl-9")}
                aria-label="Search employees on this page"
              />
            </div>

            <select
              value={statusFilter}
              className={selectClass}
              onChange={(e) => {
                setStatusFilter(e.target.value as "all" | LeaveStatus);
                setPage(1);
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
              className={selectClass}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by leave type"
            >
              <option value="all">All Types</option>
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            {(search.trim() !== "" ||
              statusFilter !== "all" ||
              typeFilter !== "all" ||
              !!employeeParam) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                  setPage(1);
                  if (employeeParam) {
                    router.push("/leave/requests");
                  }
                }}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            )}
          </div>

          <DataTable
            columns={TABLE_COLUMNS}
            emptyMessage="No leave requests match the selected filters."
            rows={pageRecords.map((row) => ({
              employee: (
                <div>
                  <span className="font-medium text-foreground">
                    {row.employee.first_name} {row.employee.last_name}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {row.employee.email}
                  </p>
                </div>
              ),
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
              <nav className="flex items-center gap-1" aria-label="Pagination">
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
                      // Keep the page button strip usable for large totals.
                      if (totalPages <= 7) return true;
                      if (n === 1 || n === totalPages) return true;
                      return Math.abs(n - page) <= 2;
                    })
                    .map((n, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev !== undefined && n - prev > 1;
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
                            aria-current={n === page ? "page" : undefined}
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
        </div>
      )}
    </div>
  );
}

export default function LeaveRequestsDirectoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LeaveRequestsDirectoryContent />
    </Suspense>
  );
}
