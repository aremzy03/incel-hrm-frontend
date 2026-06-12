"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X, Loader2, Eye, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/hrm/ui/StatusBadge";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { DataTable } from "@/components/hrm/ui/DataTable";
import { apiGet } from "@/lib/api-client";
import { LEAVE_STATUS_DISPLAY } from "@/lib/types/leave";
import type {
  LeaveRequest,
  LeaveStatus,
  PaginatedResponse,
} from "@/lib/types/leave";

const PAGE_SIZE = 10;

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

export default function LeaveRequestsDirectoryPage() {
  const { data: requestsRaw, isLoading } = useQuery({
    queryKey: ["leave-requests"],
    queryFn: () =>
      apiGet<PaginatedResponse<LeaveRequest> | LeaveRequest[]>("leave-requests"),
  });

  const records: LeaveRequest[] = Array.isArray(requestsRaw)
    ? requestsRaw
    : requestsRaw?.results ?? [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LeaveStatus>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | string>("all");
  const [page, setPage] = useState(1);

  const leaveTypeNames = useMemo(() => {
    const names = new Set(records.map((r) => r.leave_type.name));
    return Array.from(names).sort();
  }, [records]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      const fullName =
        `${r.employee.first_name} ${r.employee.last_name}`.toLowerCase();
      const email = (r.employee.email ?? "").toLowerCase();
      const nameMatch =
        !q || fullName.includes(q) || email.includes(q);
      const statusMatch = statusFilter === "all" || r.status === statusFilter;
      const typeMatch = typeFilter === "all" || r.leave_type.name === typeFilter;
      return nameMatch && statusMatch && typeMatch;
    });
  }, [records, search, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRecords = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

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
        subtitle="All leave requests across the organisation. Open a record for full details."
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name or email…"
                className={cn(selectClass, "w-full pl-9")}
                aria-label="Search employees"
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

            {(search.trim() !== "" ||
              statusFilter !== "all" ||
              typeFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
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

          {totalPages > 1 && (
            <div className="mt-1 flex items-center justify-between rounded-xl border border-border bg-card px-5 py-3">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                {Math.min((safePage - 1) * PAGE_SIZE + 1, filtered.length)}
                &ndash;
                {Math.min(safePage * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length} records
              </p>
              <nav className="flex items-center gap-1" aria-label="Pagination">
                <button
                  type="button"
                  disabled={safePage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    type="button"
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
                ))}
                <button
                  type="button"
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
      )}
    </div>
  );
}
