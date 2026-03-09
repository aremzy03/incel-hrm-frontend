"use client";

import { useState, useId } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Paperclip, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { apiGet, apiPost, ApiError } from "@/lib/api-client";
import type {
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  LeaveRequestCreatePayload,
  PaginatedResponse,
} from "@/lib/types/leave";

const APPROVAL_STEPS = ["Line Manager", "HR Department", "Executive Director"];

function countWorkingDays(startStr: string, endStr: string): number {
  if (!startStr || !endStr) return 0;
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;

  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

const fieldClass =
  "w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition";

function FieldLabel({
  htmlFor,
  children,
  optional,
}: {
  htmlFor: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-foreground"
    >
      {children}
      {optional && (
        <span className="ml-1 text-xs font-normal text-muted-foreground">
          (optional)
        </span>
      )}
    </label>
  );
}

function BalanceBar({
  name,
  remaining,
  total,
}: {
  name: string;
  remaining: number;
  total: number;
}) {
  const pct = total > 0 ? (remaining / total) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground">{name}</span>
        <span className="text-xs font-medium text-primary">
          {remaining}/{total} days
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className="h-1.5 rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ApplyLeavePage() {
  const formId = useId();
  const queryClient = useQueryClient();

  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: leaveTypesRaw, isLoading: typesLoading } = useQuery({
    queryKey: ["leave-types"],
    queryFn: () =>
      apiGet<PaginatedResponse<LeaveType> | LeaveType[]>("leave-types"),
  });

  const currentYear = new Date().getFullYear();
  const { data: balancesRaw } = useQuery({
    queryKey: ["leave-balances", currentYear],
    queryFn: () =>
      apiGet<PaginatedResponse<LeaveBalance> | LeaveBalance[]>(
        `leave-balances?year=${currentYear}`
      ),
  });

  const leaveTypes: LeaveType[] = Array.isArray(leaveTypesRaw)
    ? leaveTypesRaw
    : leaveTypesRaw?.results ?? [];

  const balances: LeaveBalance[] = Array.isArray(balancesRaw)
    ? balancesRaw
    : balancesRaw?.results ?? [];

  const workingDays = countWorkingDays(startDate, endDate);
  const canSubmit = leaveTypeId !== "" && startDate !== "" && endDate !== "";

  const createMutation = useMutation({
    mutationFn: async (payload: LeaveRequestCreatePayload) => {
      const created = await apiPost<LeaveRequest>("leave-requests", payload);
      await apiPost<LeaveRequest>(`leave-requests/${created.id}/submit`);
      return created;
    },
    onSuccess: () => {
      setSubmitted(true);
      setApiError(null);
      queryClient.invalidateQueries({ queryKey: ["leave-requests-recent"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const data = err.data;
        const firstFieldError = Object.values(data).find(
          (v) => Array.isArray(v) && v.length > 0
        ) as string[] | undefined;
        setApiError(firstFieldError?.[0] ?? err.message);
      } else {
        setApiError("Something went wrong. Please try again.");
      }
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setApiError(null);
    createMutation.mutate({
      leave_type: leaveTypeId,
      start_date: startDate,
      end_date: endDate,
      reason,
      is_emergency: false,
    });
  }

  return (
    <div className="space-y-6 p-8">
      <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link href="/leave" className="text-primary hover:underline">
          Leave Management
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">Apply for Leave</span>
      </nav>

      <PageHeader
        title="Apply for Leave"
        subtitle="Submit a request for approval by your Line Manager, HR, and Executive Director."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow">
            <h1 className="text-lg font-semibold text-foreground">
              New Leave Request
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Submit a request for approval by your Line Manager, HR, and
              Executive Director.
            </p>

            {apiError && (
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {apiError}
              </div>
            )}

            <form
              id={formId}
              onSubmit={handleSubmit}
              className="mt-6 space-y-5"
            >
              <div>
                <FieldLabel htmlFor={`${formId}-type`}>Leave Type</FieldLabel>
                {typesLoading ? (
                  <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading types...
                  </div>
                ) : (
                  <select
                    id={`${formId}-type`}
                    value={leaveTypeId}
                    onChange={(e) => setLeaveTypeId(e.target.value)}
                    className={cn(fieldClass, "cursor-pointer")}
                    required
                  >
                    <option value="" disabled>
                      Select leave type
                    </option>
                    {leaveTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor={`${formId}-start`}>
                    Start Date
                  </FieldLabel>
                  <input
                    id={`${formId}-start`}
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={fieldClass}
                    required
                  />
                </div>
                <div>
                  <FieldLabel htmlFor={`${formId}-end`}>End Date</FieldLabel>
                  <input
                    id={`${formId}-end`}
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={fieldClass}
                    required
                  />
                </div>
              </div>

              <div>
                <FieldLabel htmlFor={`${formId}-days`}>
                  Working Days
                </FieldLabel>
                <div
                  id={`${formId}-days`}
                  className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground"
                >
                  {startDate && endDate
                    ? workingDays === 0
                      ? "0 days (check your dates)"
                      : `${workingDays} working day${workingDays !== 1 ? "s" : ""}`
                    : "Select start and end dates"}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Weekends and public holidays are excluded from the
                  calculation.
                </p>
              </div>

              <div>
                <FieldLabel htmlFor={`${formId}-reason`} optional>
                  Reason
                </FieldLabel>
                <textarea
                  id={`${formId}-reason`}
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Briefly describe the reason for your leave..."
                  className={cn(fieldClass, "resize-none")}
                />
              </div>

              <div>
                <FieldLabel htmlFor={`${formId}-file`} optional>
                  Attach Document
                </FieldLabel>
                <label
                  htmlFor={`${formId}-file`}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 text-center text-sm text-muted-foreground transition hover:border-primary hover:text-primary",
                    fileName && "border-primary/50 bg-accent/40"
                  )}
                >
                  <Paperclip className="h-4 w-4" />
                  {fileName ? (
                    <span className="font-medium text-foreground">
                      {fileName}
                    </span>
                  ) : (
                    "Attach supporting document (optional)"
                  )}
                  <input
                    id={`${formId}-file`}
                    type="file"
                    className="sr-only"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {submitted ? (
                <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <span>
                    Your leave request has been submitted and is awaiting Line
                    Manager approval.
                  </span>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={!canSubmit || createMutation.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Submit Leave Request"
                  )}
                </button>
              )}
            </form>
          </div>
        </div>

        <div className="space-y-4">
          <div className="sticky top-6 space-y-4">
            <div className="rounded-xl border border-border bg-card p-5 shadow">
              <h2 className="mb-4 text-sm font-semibold text-foreground">
                Leave Balances
              </h2>
              <div className="space-y-4">
                {balances.length > 0 ? (
                  balances.map((entry) => (
                    <BalanceBar
                      key={entry.id}
                      name={entry.leave_type.name}
                      remaining={entry.remaining_days}
                      total={entry.allocated_days}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No balance data available.
                  </p>
                )}
              </div>

              <div className="mt-4 rounded-lg bg-accent p-3 text-xs text-accent-foreground">
                Leave requests follow a 3-stage approval: Line Manager &rarr; HR &rarr;
                Executive Director. Rejection at any stage ends the process.
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow">
              <h2 className="mb-4 text-sm font-semibold text-foreground">
                Approval Chain
              </h2>
              <ol className="space-y-0" aria-label="Approval steps">
                {APPROVAL_STEPS.map((step, i) => {
                  const isFirst = i === 0;
                  const isLast = i === APPROVAL_STEPS.length - 1;

                  return (
                    <li key={step} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                            isFirst
                              ? "border-transparent bg-primary text-primary-foreground"
                              : "border-border bg-muted text-muted-foreground"
                          )}
                        >
                          {i + 1}
                        </div>
                        {!isLast && (
                          <div
                            className="my-1 w-px flex-1 bg-border"
                            style={{ minHeight: "1.5rem" }}
                          />
                        )}
                      </div>

                      <span
                        className={cn(
                          "pb-6 pt-1 text-sm leading-none",
                          isFirst
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {step}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
