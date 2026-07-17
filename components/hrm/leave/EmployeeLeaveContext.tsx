"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Eye, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/hrm/ui/StatusBadge";
import { DataTable } from "@/components/hrm/ui/DataTable";
import { LeaveBalanceStrip } from "@/components/hrm/leave/LeaveBalanceStrip";
import { stitchCardClass } from "@/lib/design/field-styles";
import { useLeaveBalances, useLeaveRequests } from "@/lib/api/leave";
import { canViewEmployeeLeaveProfile } from "@/lib/leave/access";
import { formatLeaveDuration } from "@/lib/leave/format";
import type { LeaveStatus } from "@/lib/types/leave";
import type { User } from "@/lib/types/auth";

const RECENT_LIMIT = 5;

const ACTIVE_STATUSES: LeaveStatus[] = [
  "APPROVED",
  "PENDING_TEAM_LEAD",
  "PENDING_SUPERVISOR",
  "PENDING_MANAGER",
  "PENDING_HR",
  "PENDING_ED",
];

const TABLE_COLUMNS = [
  { key: "type", label: "Type" },
  { key: "duration", label: "Duration" },
  { key: "days", label: "Days", mono: true },
  { key: "status", label: "Status" },
  { key: "view", label: "" },
];

interface EmployeeLeaveContextProps {
  employeeId: string;
  employeeName: string;
  currentRequestId: string;
  viewer: User | null;
  isOwner: boolean;
}

export function EmployeeLeaveContext({
  employeeId,
  employeeName,
  currentRequestId,
  viewer,
  isOwner,
}: EmployeeLeaveContextProps) {
  const currentYear = new Date().getFullYear();
  const canViewProfile = canViewEmployeeLeaveProfile(viewer, employeeId);

  const { data: balances = [], isLoading: balancesLoading } = useLeaveBalances(
    { employee: employeeId, year: currentYear },
    { enabled: canViewProfile }
  );

  const { data: requests = [], isLoading: requestsLoading } = useLeaveRequests(
    { employee: employeeId, exclude: currentRequestId },
    { enabled: !!employeeId }
  );

  const recentRequests = useMemo(() => {
    return requests
      .filter((r) => ACTIVE_STATUSES.includes(r.status as LeaveStatus))
      .slice(0, RECENT_LIMIT);
  }, [requests]);

  const viewAllHref = isOwner
    ? "/leave/history"
    : `/leave/requests?employee=${employeeId}`;

  const showBalances = canViewProfile && (balancesLoading || balances.length > 0);
  const showRecent = requestsLoading || recentRequests.length > 0;

  if (!showBalances && !showRecent && !requestsLoading && !balancesLoading) {
    return null;
  }

  return (
    <div className="space-y-4">
      {showBalances && (
        <div className={cn(stitchCardClass, "p-5")}>
          <h3 className="mb-4 text-title-sm font-semibold text-on-surface">
            {isOwner ? "Your leave balances" : `${employeeName}'s leave balances`}
          </h3>
          {balancesLoading ? (
            <div className="h-20 animate-pulse rounded-lg bg-muted" />
          ) : (
            <LeaveBalanceStrip balances={balances} embedded />
          )}
        </div>
      )}

      {showRecent && (
        <div className={cn(stitchCardClass, "p-5")}>
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-title-sm font-semibold text-on-surface">
              {isOwner
                ? "Your recent requests"
                : `Recent requests by ${employeeName}`}
            </h3>
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>

          {requestsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : recentRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No other active or approved leave requests.
            </p>
          ) : (
            <DataTable
              columns={TABLE_COLUMNS}
              emptyMessage="No recent requests."
              rows={recentRequests.map((row) => ({
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
                    {row.total_working_days}
                  </span>
                ),
                status: <StatusBadge status={row.status} />,
                view: (
                  <Link
                    href={`/leave/requests/${row.id}`}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground transition hover:bg-muted"
                    aria-label={`View ${row.leave_type.name} request`}
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                ),
              }))}
            />
          )}
        </div>
      )}
    </div>
  );
}
