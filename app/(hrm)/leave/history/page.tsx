"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/hrm/ui/StatusBadge";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { Breadcrumb } from "@/components/hrm/ui/Breadcrumb";
import { DataTable } from "@/components/hrm/ui/DataTable";
import { LeaveBalanceStrip } from "@/components/hrm/leave/LeaveBalanceStrip";
import { stitchSelectClass } from "@/lib/design/field-styles";
import { apiGet } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { LEAVE_STATUS_DISPLAY } from "@/lib/types/leave";
import type {
  LeaveRequest,
  LeaveBalance,
  LeaveStatus,
  PaginatedResponse,
} from "@/lib/types/leave";

const PAGE_SIZE = 5;

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

  const { data: requestsRaw, isLoading: requestsLoading } = useQuery({
    queryKey: ["leave-requests"],
    queryFn: () =>
      apiGet<PaginatedResponse<LeaveRequest> | LeaveRequest[]>("leave-requests"),
  });

  const { data: balancesRaw, isLoading: balancesLoading } = useQuery({
    queryKey: ["leave-balances", currentYear],
    queryFn: () =>
      apiGet<PaginatedResponse<LeaveBalance> | LeaveBalance[]>(
        `leave-balances?year=${currentYear}`
      ),
  });

  const allRequests: LeaveRequest[] = Array.isArray(requestsRaw)
    ? requestsRaw
    : requestsRaw?.results ?? [];

  const records: LeaveRequest[] = useMemo(() => {
    if (!user) return [];
    return allRequests.filter((r) => r.employee.id === user.id);
  }, [allRequests, user]);

  const balances: LeaveBalance[] = Array.isArray(balancesRaw)
    ? balancesRaw
    : balancesRaw?.results ?? [];

  const [statusFilter, setStatusFilter] = useState<"all" | LeaveStatus>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | string>("all");
  const [page, setPage] = useState(1);

  const leaveTypeNames = useMemo(() => {
    const names = new Set(records.map((r) => r.leave_type.name));
    return Array.from(names).sort();
  }, [records]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const statusMatch = statusFilter === "all" || r.status === statusFilter;
      const typeMatch = typeFilter === "all" || r.leave_type.name === typeFilter;
      return statusMatch && typeMatch;
    });
  }, [records, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRecords = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const isLoading = authLoading || requestsLoading || balancesLoading;

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
            {isLoading ? (
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
                  className={stitchSelectClass}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter by leave type"
                >
                  <option value="all">All Types</option>
                  {leaveTypeNames.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                {(statusFilter !== "all" || typeFilter !== "all") && (
                  <button
                    onClick={() => {
                      setStatusFilter("all");
                      setTypeFilter("all");
                      setPage(1);
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

          <div data-tour="leave-history-table">
            {isLoading ? (
              <div className="h-48 animate-pulse rounded-xl bg-muted" />
            ) : (
              <>
              <DataTable
                columns={TABLE_COLUMNS}
                emptyMessage="No records match the selected filters."
                rows={pageRecords.map((row) => ({
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

              {totalPages > 1 && (
                <div className="mt-1 flex items-center justify-between rounded-xl border border-border bg-card px-5 py-3">
                  <p className="text-sm text-muted-foreground">
                    Showing{" "}
                    {Math.min((safePage - 1) * PAGE_SIZE + 1, filtered.length)}&ndash;
                    {Math.min(safePage * PAGE_SIZE, filtered.length)} of{" "}
                    {filtered.length} records
                  </p>
                  <nav className="flex items-center gap-1" aria-label="Pagination">
                    <button
                      disabled={safePage === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (n) => (
                        <button
                          key={n}
                          onClick={() => setPage(n)}
                          aria-current={n === safePage ? "page" : undefined}
                          className={cn(
                            "rounded-md px-2.5 py-1 text-sm transition",
                            n === safePage
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {n}
                        </button>
                      )
                    )}
                    <button
                      disabled={safePage === totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
