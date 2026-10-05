"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle,
  Clock,
  Users,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { StatCard } from "@/components/hrm/ui/StatCard";
import { DataTable } from "@/components/hrm/ui/DataTable";
import { StatusBadge } from "@/components/hrm/ui/StatusBadge";
import { EmployeeAvatar } from "@/components/hrm/ui/EmployeeAvatar";
import { LeaveBalanceStrip } from "@/components/hrm/leave/LeaveBalanceStrip";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { hasRole } from "@/lib/rbac";
import { useLeaveBalances } from "@/lib/api/leave";
import { formatLeaveDays, formatLeaveDuration } from "@/lib/leave/format";
import type { LeaveRequest, PaginatedResponse } from "@/lib/types/leave";

export default function LeaveDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const currentYear = new Date().getFullYear();
  const isApprover = hasRole(
    user,
    "TEAM_LEAD",
    "SUPERVISOR",
    "LINE_MANAGER",
    "HR",
    "EXECUTIVE_DIRECTOR",
    "MANAGING_DIRECTOR"
  );

  const {
    data: balanceList = [],
    isLoading: balancesLoading,
    isPending: balancesPending,
    isError: balancesError,
    refetch: refetchBalances,
  } = useLeaveBalances({ year: currentYear }, { enabled: !!user });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ["leave-requests"],
    queryFn: () =>
      apiGet<PaginatedResponse<LeaveRequest> | LeaveRequest[]>("leave-requests"),
  });

  const requestList: LeaveRequest[] = Array.isArray(requests)
    ? requests
    : requests?.results ?? [];

  const recentRequests = useMemo(
    () =>
      [...requestList]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 5),
    [requestList]
  );

  const totalUsed = balanceList.reduce(
    (acc, b) => acc + Number(b.used_days ?? 0),
    0
  );
  const pendingCount = requestList.filter((r) =>
    r.status.startsWith("PENDING")
  ).length;
  const onLeaveToday = requestList.filter((r) => {
    if (r.status !== "APPROVED") return false;
    const today = new Date().toISOString().split("T")[0];
    return r.start_date <= today && r.end_date >= today;
  }).length;

  const balancesBusy = authLoading || balancesLoading || balancesPending;
  const showEmployee = recentRequests.some((row) => row.employee.id !== user?.id);

  const tableColumns = showEmployee
    ? [
        { key: "employee", label: "Employee" },
        { key: "type", label: "Leave type" },
        { key: "duration", label: "Duration" },
        { key: "days", label: "Days", mono: true },
        { key: "status", label: "Status" },
      ]
    : [
        { key: "type", label: "Leave type" },
        { key: "duration", label: "Duration" },
        { key: "days", label: "Days", mono: true },
        { key: "status", label: "Status" },
      ];

  const tableRows = recentRequests.map((row) => {
    const name = `${row.employee.first_name} ${row.employee.last_name}`;
    const type = (
      <span className="font-medium text-on-surface">{row.leave_type.name}</span>
    );
    const duration = (
      <span className="text-on-surface-variant">
        {formatLeaveDuration(row.start_date, row.end_date)}
      </span>
    );
    const days = (
      <span className="text-on-surface-variant">
        {formatLeaveDays(row.total_working_days)}
      </span>
    );
    const status = <StatusBadge status={row.status} />;

    if (showEmployee) {
      return {
        employee: (
          <span className="flex items-center gap-3">
            <EmployeeAvatar name={name} />
            <span className="font-medium text-on-surface">{name}</span>
          </span>
        ),
        type,
        duration,
        days,
        status,
      };
    }

    return { type, duration, days, status };
  });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        className="mb-0"
        title="Leave Management"
        subtitle={
          isApprover
            ? "Your remaining days, requests that need a decision, and recent leave in your scope."
            : "See remaining days, track your requests, and apply when you need time off."
        }
        action={
          <span data-tour="leave-apply-btn">
            <Button
              nativeButton={false}
              render={<Link href="/leave/apply" />}
              size="lg"
              className="rounded-xl px-6"
            >
              Apply for Leave
            </Button>
          </span>
        }
      />

      <section
        className="space-y-4 pt-6"
        aria-labelledby="leave-balances-heading"
      >
        <h2
          id="leave-balances-heading"
          className="text-title-sm font-semibold text-on-surface"
        >
          Leave balances
        </h2>
        <div data-tour="leave-balance-strip">
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
                Check your connection and try again. The rest of this page is
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
          ) : balanceList.length > 0 ? (
            <LeaveBalanceStrip balances={balanceList} />
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

      {requestsLoading ? (
        <div className="space-y-8">
          <div
            className="grid grid-cols-1 gap-4 sm:grid-cols-3"
            data-tour="leave-stats"
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl bg-surface-container-high"
              />
            ))}
          </div>
          <div className="h-56 animate-pulse rounded-xl bg-surface-container-high" />
        </div>
      ) : (
        <>
          <section
            className="space-y-4"
            aria-labelledby="leave-snapshot-heading"
          >
            <h2
              id="leave-snapshot-heading"
              className="text-title-sm font-semibold text-on-surface"
            >
              This year
            </h2>
            <div
              className="grid grid-cols-1 gap-4 sm:grid-cols-3"
              data-tour="leave-stats"
            >
              <StatCard
                label="Leave taken this year"
                value={formatLeaveDays(totalUsed)}
                icon={<CheckCircle />}
                trend="days"
                href="/leave/history"
              />
              <StatCard
                label="Pending requests"
                value={String(pendingCount)}
                icon={<Clock />}
                trend="awaiting a decision"
                accent="warning"
                href={isApprover ? "/leave/admin" : "/leave/history"}
              />
              <StatCard
                label="On leave today"
                value={String(onLeaveToday)}
                icon={<Users />}
                trend="staff"
                href="/leave/calendar"
              />
            </div>
          </section>

          <section aria-labelledby="leave-recent-heading">
            <DataTable
              columns={tableColumns}
              rows={tableRows}
              getRowHref={(i) => `/leave/requests/${recentRequests[i].id}`}
              getRowLabel={(i) => {
                const row = recentRequests[i];
                const name = `${row.employee.first_name} ${row.employee.last_name}`;
                return `View ${row.leave_type.name} request for ${name}`;
              }}
              emptyMessage={
                isApprover ? (
                  "No leave requests in your scope yet."
                ) : (
                  <span className="inline-flex flex-col items-center gap-3">
                    <span>You have not applied for leave yet.</span>
                    <Link
                      href="/leave/apply"
                      className="font-semibold text-primary-container hover:underline"
                    >
                      Apply for leave
                    </Link>
                  </span>
                )
              }
              header={
                <div className="flex items-center justify-between gap-4 px-6 py-4">
                  <h2
                    id="leave-recent-heading"
                    className="text-title-sm font-semibold text-on-surface"
                  >
                    Recent leave requests
                  </h2>
                  <Link
                    href={isApprover ? "/leave/requests" : "/leave/history"}
                    className="inline-flex min-h-11 items-center gap-1 text-body-md font-semibold text-primary-container hover:underline"
                  >
                    View all <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              }
            />
          </section>
        </>
      )}
    </div>
  );
}
