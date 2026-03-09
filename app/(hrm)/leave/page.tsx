"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle,
  Clock,
  Users,
  History,
  CalendarRange,
  BarChart3,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { StatCard } from "@/components/hrm/ui/StatCard";
import { DataTable } from "@/components/hrm/ui/DataTable";
import { StatusBadge } from "@/components/hrm/ui/StatusBadge";
import { apiGet } from "@/lib/api-client";
import type { LeaveBalance, LeaveRequest, PaginatedResponse } from "@/lib/types/leave";

const TABLE_COLUMNS = [
  { key: "employee", label: "Employee" },
  { key: "type", label: "Leave Type" },
  { key: "start", label: "Start" },
  { key: "end", label: "End" },
  { key: "days", label: "Days" },
  { key: "status", label: "Status" },
  { key: "action", label: "" },
];

const quickLinks = [
  {
    label: "View My Leave History",
    href: "/leave/history",
    icon: History,
    description: "See all past leave records",
  },
  {
    label: "Team Leave Calendar",
    href: "/leave/calendar",
    icon: CalendarRange,
    description: "View who's off and when",
  },
  {
    label: "Leave Balances",
    href: "/leave/balance",
    icon: BarChart3,
    description: "Check remaining entitlements",
  },
];

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
    queryKey: ["leave-requests-recent"],
    queryFn: () =>
      apiGet<PaginatedResponse<LeaveRequest> | LeaveRequest[]>("leave-requests"),
  });

  const balanceList: LeaveBalance[] = Array.isArray(balances)
    ? balances
    : balances?.results ?? [];

  const requestList: LeaveRequest[] = Array.isArray(requests)
    ? requests
    : requests?.results ?? [];

  const annualBalance = balanceList.find(
    (b) => b.leave_type.name.toLowerCase().includes("annual")
  );
  const totalUsed = balanceList.reduce((acc, b) => acc + b.used_days, 0);
  const pendingCount = requestList.filter(
    (r) => r.status.startsWith("PENDING")
  ).length;
  const onLeaveToday = requestList.filter((r) => {
    if (r.status !== "APPROVED") return false;
    const today = new Date().toISOString().split("T")[0];
    return r.start_date <= today && r.end_date >= today;
  }).length;

  const isLoading = balancesLoading || requestsLoading;

  const tableRows = requestList.slice(0, 5).map((row) => ({
    employee: (
      <span className="font-medium text-foreground">
        {row.employee.first_name} {row.employee.last_name}
      </span>
    ),
    type: <span className="text-muted-foreground">{row.leave_type.name}</span>,
    start: <span className="text-muted-foreground">{row.start_date}</span>,
    end: <span className="text-muted-foreground">{row.end_date}</span>,
    days: <span className="text-muted-foreground">{row.total_working_days}</span>,
    status: <StatusBadge status={row.status} />,
    action: (
      <Link
        href={`/leave/requests/${row.id}`}
        className="text-xs text-primary hover:underline"
      >
        View
      </Link>
    ),
  }));

  return (
    <div className="space-y-8 p-8">
      <PageHeader
        title="Leave Management"
        subtitle="Manage, request, and track leave across your organisation."
        action={
          <Link
            href="/leave/apply"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            Apply for Leave
          </Link>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Annual Leave Balance"
              value={String(annualBalance?.remaining_days ?? 0)}
              icon={<CalendarDays className="h-4 w-4" />}
              trend="days remaining"
            />
            <StatCard
              label="Leave Taken This Year"
              value={String(totalUsed)}
              icon={<CheckCircle className="h-4 w-4" />}
              trend="days"
            />
            <StatCard
              label="Pending Requests"
              value={String(pendingCount)}
              icon={<Clock className="h-4 w-4" />}
            />
            <StatCard
              label="On Leave Today"
              value={String(onLeaveToday)}
              icon={<Users className="h-4 w-4" />}
              trend="staff"
            />
          </div>

          <DataTable
            columns={TABLE_COLUMNS}
            rows={tableRows}
            emptyMessage="No leave requests found."
            header={
              <div className="flex items-center justify-between px-6 py-4">
                <h2 className="text-base font-semibold text-foreground">
                  Recent Leave Requests
                </h2>
                <Link
                  href="/leave/requests"
                  className="text-sm text-primary hover:underline"
                >
                  View All
                </Link>
              </div>
            }
          />
        </>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-4 transition hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
              <link.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {link.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {link.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
