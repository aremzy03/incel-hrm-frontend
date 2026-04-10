"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/hrm/ui/StatusBadge";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { DataTable } from "@/components/hrm/ui/DataTable";
import { apiGet, apiPost } from "@/lib/api-client";
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

/** Statuses from which the owner can cancel their leave request */
const CANCELLABLE_BY_OWNER: LeaveStatus[] = [
  "DRAFT",
  "PENDING_TEAM_LEAD",
  "PENDING_SUPERVISOR",
  "PENDING_MANAGER",
];

const TABLE_COLUMNS = [
  { key: "type", label: "Leave Type" },
  { key: "start", label: "Start Date" },
  { key: "end", label: "End Date" },
  { key: "days", label: "Days" },
  { key: "reason", label: "Reason" },
  { key: "status", label: "Status" },
  { key: "action", label: "Actions" },
];

const selectClass =
  "rounded-lg border border-border bg-input px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export default function LeaveHistoryPage() {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();

  const { data: requestsRaw, isLoading: requestsLoading } = useQuery({
    queryKey: ["my-leave-requests"],
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

  const records: LeaveRequest[] = Array.isArray(requestsRaw)
    ? requestsRaw
    : requestsRaw?.results ?? [];

  const balances: LeaveBalance[] = Array.isArray(balancesRaw)
    ? balancesRaw
    : balancesRaw?.results ?? [];

  const [statusFilter, setStatusFilter] = useState<"all" | LeaveStatus>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | string>("all");
  const [page, setPage] = useState(1);
  const [cancelTarget, setCancelTarget] = useState<LeaveRequest | null>(null);

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

  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      apiPost<LeaveRequest>(`leave-requests/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-leave-requests"] });
      setCancelTarget(null);
    },
  });

  const isLoading = requestsLoading || balancesLoading;

  return (
    <>
      <div className="space-y-8 p-8">
        <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
          <Link href="/leave" className="text-primary hover:underline">
            Leave Management
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium text-foreground">My Leave History</span>
        </nav>

        <PageHeader
          title="My Leave History"
          subtitle="Your leave requests and current balances for the year."
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {balances.map((b) => {
                const pct =
                  b.allocated_days > 0
                    ? (b.used_days / b.allocated_days) * 100
                    : 0;
                return (
                  <div
                    key={b.id}
                    className="rounded-xl border border-border bg-card p-4 shadow-sm"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {b.leave_type.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {b.allocated_days} days allocated
                    </p>

                    <div className="mt-3 flex items-end justify-between">
                      <div className="text-center">
                        <p className="text-xl font-bold text-foreground">
                          {b.used_days}
                        </p>
                        <p className="text-xs text-muted-foreground">Used</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-primary">
                          {b.remaining_days}
                        </p>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                      </div>
                    </div>

                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <div className="mb-4 flex flex-wrap gap-3">
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
              </div>

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
                  action: CANCELLABLE_BY_OWNER.includes(
                    row.status as LeaveStatus
                  ) ? (
                      <button
                        onClick={() => setCancelTarget(row)}
                        className="rounded-md border border-destructive px-2 py-1 text-xs text-destructive transition hover:bg-destructive/10"
                      >
                        Cancel
                      </button>
                    ) : (
                      <span className="text-muted-foreground">&mdash;</span>
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
            </div>
          </>
        )}
      </div>

      {cancelTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
        >
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setCancelTarget(null)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-md">
            <button
              onClick={() => setCancelTarget(null)}
              className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-muted transition"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>

            <h2
              id="cancel-dialog-title"
              className="text-base font-semibold text-foreground"
            >
              Cancel Leave Request
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to cancel this leave request?
            </p>

            <div className="mt-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
              <p className="font-medium text-foreground">
                {cancelTarget.leave_type.name}
              </p>
              <p className="text-muted-foreground">
                {cancelTarget.start_date} &mdash; {cancelTarget.end_date} &middot;{" "}
                {cancelTarget.total_working_days} day
                {cancelTarget.total_working_days !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition hover:bg-muted"
              >
                Go Back
              </button>
              <button
                onClick={() => cancelMutation.mutate(cancelTarget.id)}
                disabled={cancelMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {cancelMutation.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
