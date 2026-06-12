"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle,
  Clock,
  Users,
  Loader2,
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
import type { LeaveBalance, LeaveRequest, PaginatedResponse } from "@/lib/types/leave";

const TABLE_COLUMNS = [
  { key: "employee", label: "Employee" },
  { key: "type", label: "Leave Type" },
  { key: "duration", label: "Duration" },
  { key: "days", label: "Days", mono: true },
  { key: "status", label: "Status" },
];

function formatLeaveDuration(start: string, end: string): string {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const monthYear = startDate.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });

  if (start === end) {
    return startDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const sameMonth =
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear();

  if (sameMonth) {
    return `${startDate.getDate()}–${endDate.getDate()} ${monthYear}`;
  }

  const startLabel = startDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  const endLabel = endDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${startLabel} – ${endLabel}`;
}

export default function LeaveDashboardPage() {
  const currentYear = new Date().getFullYear();

  const { data: balances, isLoading: balancesLoading } = useQuery({
    queryKey: ["leave-balances", currentYear],
    queryFn: () =>
      apiGet<PaginatedResponse<LeaveBalance> | LeaveBalance[]>(
        `leave-balances?year=${currentYear}`
      ),
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ["leave-requests"],
    queryFn: () =>
      apiGet<PaginatedResponse<LeaveRequest> | LeaveRequest[]>("leave-requests"),
  });

  const balanceList: LeaveBalance[] = Array.isArray(balances)
    ? balances
    : balances?.results ?? [];

  const requestList: LeaveRequest[] = Array.isArray(requests)
    ? requests
    : requests?.results ?? [];

  const annualBalance = balanceList.find((b) =>
    b.leave_type.name.toLowerCase().includes("annual")
  );
  const totalUsed = balanceList.reduce((acc, b) => acc + b.used_days, 0);
  const pendingCount = requestList.filter((r) =>
    r.status.startsWith("PENDING")
  ).length;
  const onLeaveToday = requestList.filter((r) => {
    if (r.status !== "APPROVED") return false;
    const today = new Date().toISOString().split("T")[0];
    return r.start_date <= today && r.end_date >= today;
  }).length;

  const isLoading = balancesLoading || requestsLoading;

  const tableRows = requestList.slice(0, 5).map((row) => {
    const name = `${row.employee.first_name} ${row.employee.last_name}`;
    return {
      employee: (
        <Link
          href={`/leave/requests/${row.id}`}
          className="flex items-center gap-3 hover:opacity-80"
        >
          <EmployeeAvatar name={name} />
          <span className="font-medium text-on-surface">{name}</span>
        </Link>
      ),
      type: (
        <span className="text-on-surface-variant">{row.leave_type.name}</span>
      ),
      duration: (
        <span className="text-on-surface-variant">
          {formatLeaveDuration(row.start_date, row.end_date)}
        </span>
      ),
      days: (
        <span className="text-on-surface-variant">{row.total_working_days}</span>
      ),
      status: <StatusBadge status={row.status} />,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        subtitle="Track, apply, and manage leave across your organisation."
        action={
          <Button
            nativeButton={false}
            render={<Link href="/leave/apply" />}
            size="lg"
            className="rounded-xl px-6"
          >
            Apply for Leave
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-on-surface-variant" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Annual Leave Balance"
              value={String(annualBalance?.remaining_days ?? 0)}
              icon={<CalendarDays />}
              trend="days remaining"
            />
            <StatCard
              label="Leave Taken This Year"
              value={String(totalUsed)}
              icon={<CheckCircle />}
              trend="days"
            />
            <StatCard
              label="Pending Requests"
              value={String(pendingCount)}
              icon={<Clock />}
              trend="requests"
              accent="warning"
            />
            <StatCard
              label="On Leave Today"
              value={String(onLeaveToday)}
              icon={<Users />}
              trend="staff"
            />
          </div>

          <LeaveBalanceStrip balances={balanceList} />

          <DataTable
            columns={TABLE_COLUMNS}
            rows={tableRows}
            emptyMessage="No leave requests found."
            header={
              <div className="flex items-center justify-between px-6 py-3">
                <h2 className="text-base font-semibold text-on-surface">
                  Recent Leave Requests
                </h2>
                <Link
                  href="/leave/requests"
                  className="flex items-center gap-1 text-sm font-semibold text-primary-container hover:underline"
                >
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            }
          />
        </>
      )}
    </div>
  );
}
