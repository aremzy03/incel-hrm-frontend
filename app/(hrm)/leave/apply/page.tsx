"use client";

import { useMemo, useState, useId } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Paperclip, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { apiGet, apiPost, ApiError } from "@/lib/api-client";
import { useDepartmentMembers } from "@/lib/api/departments";
import { useLeaveTypes } from "@/lib/api/leave-types";
import { useAuth } from "@/contexts/AuthContext";
import { HolidayDatePicker } from "@/components/hrm/leave/HolidayDatePicker";
import { listPublicHolidays } from "@/lib/api/public-holidays";
import { buildHolidayLookup, countWorkingDaysPreview, toYmd } from "@/lib/public-holidays/utils";
import type { PublicHoliday } from "@/lib/types/public-holidays";
import type {
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  LeaveRequestCreatePayload,
  LeaveStatus,
  PaginatedResponse,
} from "@/lib/types/leave";

const APPROVAL_STEPS = [
  "Team Lead (if applicable)",
  "Unit Supervisor (if applicable)",
  "Line Manager",
  "HR Department",
  "Executive Director",
];

const VALIDATION_FIELDS = [
  "leave_balance",
  "leave_request",
  "leave_type",
  "cover_person",
  "end_date",
] as const;

function getValidationMessage(data: Record<string, unknown> | undefined): string {
  if (!data) return "";
  const extract = (v: unknown): string | null => {
    if (typeof v === "string") return v;
    if (Array.isArray(v) && v.length > 0 && typeof v[0] === "string") return v[0];
    return null;
  };
  for (const field of VALIDATION_FIELDS) {
    const msg = extract(data[field]);
    if (msg) return msg;
  }
  const detail = extract(data.detail);
  if (detail) return detail;
  const firstArray = Object.values(data).find(
    (v) => Array.isArray(v) && v.length > 0 && typeof v[0] === "string"
  ) as string[] | undefined;
  return firstArray?.[0] ?? "";
}

function isLeaveTypeEligible(
  leaveTypeName: string,
  gender: string | undefined
): boolean {
  const n = leaveTypeName.toLowerCase();
  if (n.includes("maternity")) return gender === "FEMALE";
  if (n.includes("paternity")) return gender === "MALE";
  return true;
}

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

const OVERLAP_STATUSES: LeaveStatus[] = [
  "DRAFT",
  "PENDING_TEAM_LEAD",
  "PENDING_SUPERVISOR",
  "PENDING_MANAGER",
  "PENDING_HR",
  "PENDING_ED",
  "APPROVED",
];

function datesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  const aS = new Date(aStart).getTime();
  const aE = new Date(aEnd).getTime();
  const bS = new Date(bStart).getTime();
  const bE = new Date(bEnd).getTime();
  return aS <= bE && bS <= aE;
}

function hasOverlappingRequest(
  requests: LeaveRequest[],
  startDate: string,
  endDate: string
): LeaveRequest | null {
  for (const r of requests) {
    if (!OVERLAP_STATUSES.includes(r.status as LeaveStatus)) continue;
    if (datesOverlap(r.start_date, r.end_date, startDate, endDate)) return r;
  }
  return null;
}

function isAnnualOrCasual(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes("annual") || n.includes("casual");
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
  const { user } = useAuth();

  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [coverPersonId, setCoverPersonId] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [overlapConfirmOpen, setOverlapConfirmOpen] = useState(false);

  const minStartDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1);
    return toYmd(d);
  }, []);

  const minEndDate = useMemo(() => {
    const base = startDate ? new Date(startDate + "T00:00:00") : new Date(minStartDate + "T00:00:00");
    base.setDate(base.getDate() + 1);
    return toYmd(base);
  }, [minStartDate, startDate]);

  const deptId =
    typeof user?.department === "string"
      ? user.department
      : user?.department?.id ?? null;

  const { data: leaveTypesRaw, isLoading: typesLoading } = useLeaveTypes();
  const { data: departmentMembers = [] } = useDepartmentMembers(deptId ?? "");

  const currentYear = new Date().getFullYear();
  const { data: myRequestsRaw } = useQuery({
    queryKey: ["my-leave-requests"],
    queryFn: () =>
      apiGet<PaginatedResponse<LeaveRequest> | LeaveRequest[]>("leave-requests"),
  });
  const { data: balancesRaw } = useQuery({
    queryKey: ["leave-balances", currentYear],
    queryFn: () =>
      apiGet<PaginatedResponse<LeaveBalance> | LeaveBalance[]>(
        `leave-balances?year=${currentYear}`
      ),
  });

  const allLeaveTypes: LeaveType[] = leaveTypesRaw ?? [];
  const leaveTypes = allLeaveTypes.filter((t) =>
    isLeaveTypeEligible(t.name, user?.gender)
  );

  const coverOptions = departmentMembers.filter((m) => m.id !== user?.id);

  const myRequests: LeaveRequest[] = Array.isArray(myRequestsRaw)
    ? myRequestsRaw
    : myRequestsRaw?.results ?? [];

  const selectedLeaveType = leaveTypes.find((t) => t.id === leaveTypeId);
  const showAnnualCasualHint =
    selectedLeaveType && isAnnualOrCasual(selectedLeaveType.name);

  const balances: LeaveBalance[] = Array.isArray(balancesRaw)
    ? balancesRaw
    : balancesRaw?.results ?? [];

  const startYear = startDate ? new Date(startDate + "T00:00:00").getFullYear() : currentYear;
  const endYear = endDate ? new Date(endDate + "T00:00:00").getFullYear() : startYear;
  const holidayYears = startYear === endYear ? [startYear] : [startYear, endYear];

  const { data: holidaysA } = useQuery({
    queryKey: ["public-holidays", holidayYears[0]],
    queryFn: () => listPublicHolidays(holidayYears[0]),
  });
  const { data: holidaysB } = useQuery({
    queryKey: ["public-holidays", holidayYears[1]],
    queryFn: () => listPublicHolidays(holidayYears[1]),
    enabled: holidayYears.length > 1,
  });

  const holidaysMerged = useMemo(() => {
    const toList = (raw: unknown): PublicHoliday[] =>
      Array.isArray(raw)
        ? (raw as PublicHoliday[])
        : ((raw as { results?: PublicHoliday[] } | undefined)?.results ?? []);
    const a = toList(holidaysA);
    const b = toList(holidaysB);
    const byDate = new Map<string, PublicHoliday>();
    for (const h of [...a, ...b]) {
      if (!byDate.has(h.date)) byDate.set(h.date, h);
    }
    return Array.from(byDate.values());
  }, [holidaysA, holidaysB]);

  const { dateSet: holidaySet, nameByDate: holidayNameByDate } = useMemo(
    () => buildHolidayLookup(holidaysMerged),
    [holidaysMerged]
  );

  const workingDays =
    startDate && endDate
      ? countWorkingDaysPreview(
          new Date(startDate + "T00:00:00"),
          new Date(endDate + "T00:00:00"),
          holidaySet
        )
      : 0;

  const noDepartment = !deptId;
  const noCoverOptions = deptId && coverOptions.length === 0;
  const canSubmit =
    !noDepartment &&
    leaveTypeId !== "" &&
    startDate !== "" &&
    endDate !== "";
  const canSaveDraft = canSubmit;

  const createDraftMutation = useMutation({
    mutationFn: async (payload: LeaveRequestCreatePayload) => {
      const created = await apiPost<LeaveRequest>("leave-requests", payload);
      return created;
    },
    onSuccess: (created) => {
      setApiError(null);
      queryClient.invalidateQueries({ queryKey: ["leave-requests-recent"] });
      queryClient.invalidateQueries({ queryKey: ["my-leave-requests"] });
      const id =
        (created as { id?: string }).id ?? (created as { pk?: string }).pk;
      if (id) {
        window.location.href = `/leave/requests/${id}`;
      }
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const msg = getValidationMessage(err.data as Record<string, unknown>);
        setApiError(msg || err.message);
      } else {
        setApiError("Something went wrong. Please try again.");
      }
    },
  });

  const createAndSubmitMutation = useMutation({
    mutationFn: async (payload: LeaveRequestCreatePayload) => {
      return apiPost<LeaveRequest>(
        "leave-requests/create-and-submit/",
        payload
      );
    },
    onSuccess: () => {
      setSubmitted(true);
      setApiError(null);
      queryClient.invalidateQueries({ queryKey: ["leave-requests-recent"] });
      queryClient.invalidateQueries({ queryKey: ["my-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const msg = getValidationMessage(err.data as Record<string, unknown>);
        setApiError(msg || err.message);
      } else {
        setApiError("Something went wrong. Please try again.");
      }
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : null);
  }

  const payload: LeaveRequestCreatePayload = {
    leave_type: leaveTypeId,
    start_date: startDate,
    end_date: endDate,
    reason,
    is_emergency: false,
    ...(coverPersonId ? { cover_person: coverPersonId } : {}),
  };

  function doSaveDraft() {
    setApiError(null);
    createDraftMutation.mutate(payload);
  }

  function doSubmit() {
    setApiError(null);
    createAndSubmitMutation.mutate(payload);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const overlap = hasOverlappingRequest(myRequests, startDate, endDate);
    if (overlap) {
      setOverlapConfirmOpen(true);
      return;
    }
    doSubmit();
  }

  function handleOverlapConfirm() {
    setOverlapConfirmOpen(false);
    doSubmit();
  }

  function handleOverlapCancel() {
    setOverlapConfirmOpen(false);
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
        subtitle="Submit a request for approval. Approvals may include Unit Supervisor (if applicable), Line Manager, HR, and Executive Director."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow">
            <h1 className="text-lg font-semibold text-foreground">
              New Leave Request
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Submit a request for approval. Depending on your Unit, a Unit
              Supervisor may approve first before your Line Manager, HR, and
              Executive Director.
            </p>

            {noDepartment && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                You must be assigned to a department to apply for leave.
              </div>
            )}

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
                {showAnnualCasualHint && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Only one person per department can have overlapping Annual or
                    Casual leave.{" "}
                    <Link
                      href="/leave/calendar"
                      className="text-primary hover:underline"
                    >
                      Check the calendar
                    </Link>
                  </p>
                )}
              </div>

              {deptId && (
                <div>
                  <FieldLabel htmlFor={`${formId}-cover`} optional>
                    Reliever
                  </FieldLabel>
                  <select
                    id={`${formId}-cover`}
                    value={coverPersonId}
                    onChange={(e) => setCoverPersonId(e.target.value)}
                    className={cn(fieldClass, "cursor-pointer")}
                    disabled={coverOptions.length === 0}
                  >
                    <option value="">
                      {coverOptions.length === 0 ? "No relievers available" : "None"}
                    </option>
                    {coverOptions.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor={`${formId}-start`}>
                    Start Date
                  </FieldLabel>
                  <HolidayDatePicker
                    label="Start date"
                    value={startDate}
                    onChange={(next) => {
                      setStartDate(next);
                      if (next) {
                        const nextMinEnd = toYmd(new Date(next + "T00:00:00"));
                        const d = new Date(nextMinEnd + "T00:00:00");
                        d.setDate(d.getDate() + 1);
                        const requiredEnd = toYmd(d);
                        if (!endDate || endDate < requiredEnd) setEndDate(requiredEnd);
                      }
                    }}
                    holidayNameByDate={holidayNameByDate}
                    min={minStartDate}
                    disableWeekendsAndHolidays
                  />
                </div>
                <div>
                  <FieldLabel htmlFor={`${formId}-end`}>End Date</FieldLabel>
                  <HolidayDatePicker
                    label="End date"
                    value={endDate}
                    onChange={setEndDate}
                    min={minEndDate}
                    holidayNameByDate={holidayNameByDate}
                    disableWeekendsAndHolidays
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
                    Your leave request has been submitted and is now awaiting
                    approval.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={doSaveDraft}
                    disabled={
                      !canSaveDraft ||
                      createDraftMutation.isPending ||
                      createAndSubmitMutation.isPending
                    }
                    className="order-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 sm:order-1"
                  >
                    {createDraftMutation.isPending ? (
                      <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                    ) : (
                      "Save as draft"
                    )}
                  </button>
                  <button
                    type="submit"
                    disabled={
                      !canSubmit ||
                      createAndSubmitMutation.isPending ||
                      createDraftMutation.isPending
                    }
                    className="order-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:order-2"
                  >
                    {createAndSubmitMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Submit Leave Request"
                    )}
                  </button>
                </div>
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
                Leave requests follow a staged approval: Unit Supervisor (if
                applicable) &rarr; Line Manager &rarr; HR &rarr; Executive
                Director. Rejection at any stage ends the process.
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

      {/* Overlap confirmation modal */}
      {overlapConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleOverlapCancel();
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="text-base font-semibold text-foreground">
              Overlapping leave dates
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You have an existing leave request that overlaps these dates.
              Proceed anyway?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={handleOverlapCancel}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleOverlapConfirm}
                disabled={createAndSubmitMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {createAndSubmitMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
