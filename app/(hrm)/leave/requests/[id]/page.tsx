"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  User,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/hrm/ui/StatusBadge";
import { apiGet } from "@/lib/api-client";
import type { LeaveRequest, LeaveApprovalLog } from "@/lib/types/leave";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getActionIcon(action: string) {
  switch (action) {
    case "APPROVE":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "REJECT":
      return <XCircle className="h-4 w-4 text-red-600" />;
    case "CANCEL":
      return <XCircle className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Clock className="h-4 w-4 text-yellow-600" />;
  }
}

export default function LeaveRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const {
    data: request,
    isLoading: requestLoading,
    error: requestError,
  } = useQuery({
    queryKey: ["leave-request", id],
    queryFn: () => apiGet<LeaveRequest>(`leave-requests/${id}`),
  });

  const { data: logsRaw } = useQuery({
    queryKey: ["leave-request-logs", id],
    queryFn: () =>
      apiGet<LeaveApprovalLog[] | { results: LeaveApprovalLog[] }>(
        `leave-requests/${id}/logs`
      ),
    enabled: !!request,
  });

  const logs: LeaveApprovalLog[] = Array.isArray(logsRaw)
    ? logsRaw
    : (logsRaw as { results: LeaveApprovalLog[] })?.results ?? [];

  if (requestLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (requestError || !request) {
    return (
      <div className="space-y-4 p-8">
        <Link
          href="/leave/history"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to History
        </Link>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
          <p className="mt-2 text-sm text-destructive">
            Failed to load leave request. It may not exist or you may not have
            permission to view it.
          </p>
        </div>
      </div>
    );
  }

  const employeeName = `${request.employee.first_name} ${request.employee.last_name}`;

  return (
    <div className="space-y-6 p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link href="/leave" className="text-primary hover:underline">
          Leave Management
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link href="/leave/history" className="text-primary hover:underline">
          History
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">Request Detail</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {request.leave_type.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Submitted by {employeeName} on{" "}
            {formatDate(request.created_at)}
          </p>
        </div>
        <StatusBadge
          status={request.status}
          className="text-sm px-3 py-1"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Detail card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-semibold text-foreground mb-4">
              Request Details
            </h2>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Employee</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {employeeName}
                  </dd>
                  <dd className="text-xs text-muted-foreground">
                    {request.employee.email}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Leave Type</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {request.leave_type.name}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Duration</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {formatDate(request.start_date)} &mdash;{" "}
                    {formatDate(request.end_date)}
                  </dd>
                  <dd className="text-xs text-muted-foreground">
                    {request.total_working_days} working day
                    {request.total_working_days !== 1 ? "s" : ""}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Submitted</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {formatTimestamp(request.created_at)}
                  </dd>
                </div>
              </div>
            </dl>

            {request.is_emergency && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                This is marked as an emergency leave request.
              </div>
            )}

            {request.reason && (
              <div className="mt-4">
                <h3 className="text-xs font-medium text-muted-foreground mb-1">
                  Reason
                </h3>
                <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground">
                  {request.reason}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Approval timeline */}
        <div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground mb-4">
              Approval Timeline
            </h2>

            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No approval actions recorded yet.
              </p>
            ) : (
              <ol className="space-y-0">
                {logs.map((log, i) => {
                  const isLast = i === logs.length - 1;
                  const actorName = log.actor
                    ? `${log.actor.first_name} ${log.actor.last_name}`
                    : "System";

                  return (
                    <li key={log.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                          {getActionIcon(log.action)}
                        </div>
                        {!isLast && (
                          <div
                            className="my-1 w-px flex-1 bg-border"
                            style={{ minHeight: "1.5rem" }}
                          />
                        )}
                      </div>

                      <div className={cn("pb-4", isLast && "pb-0")}>
                        <p className="text-sm font-medium text-foreground">
                          {log.action_display}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          by {actorName} &middot;{" "}
                          {formatTimestamp(log.timestamp)}
                        </p>
                        {log.comment && (
                          <p className="mt-1 rounded-md bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                            &ldquo;{log.comment}&rdquo;
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
