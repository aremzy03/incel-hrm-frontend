"use client";

import { useMemo, useState, useId } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Paperclip, CheckCircle, CalendarRange, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "@/components/hrm/ui/Breadcrumb";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import type { ApprovalStep } from "@/components/hrm/leave/ApprovalChain";
import { ApprovalChain } from "@/components/hrm/leave/ApprovalChain";
import { LeaveBalancePanel } from "@/components/hrm/leave/LeaveBalancePanel";
import { PolicyNotice } from "@/components/hrm/leave/PolicyNotice";
import { RelieverField } from "@/components/hrm/leave/RelieverField";
import { FieldLabel } from "@/components/hrm/forms/FieldLabel";
import {
  stitchCardClass,
  stitchSelectClass,
  stitchTextareaClass,
} from "@/lib/design/field-styles";
import { apiGet, apiPost, ApiError } from "@/lib/api-client";
import { useEligibleRelievers } from "@/lib/api/leave";
import { useLeaveTypes } from "@/lib/api/leave-types";
import { useAuth } from "@/contexts/AuthContext";
import {
  extractFieldError,
  isRelieverRequired,
  shouldShowRelieverField,
} from "@/lib/leave/reliever";
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
  const coverPerson = extractFieldError(data, "cover_person");
  if (coverPerson) return coverPerson;
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

function isSickLeave(name: string): boolean {
  return name.toLowerCase().includes("sick");
}

function todayYmd(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return toYmd(d);
}

function tomorrowYmd(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return toYmd(d);
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
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [coverPersonError, setCoverPersonError] = useState<string | null>(null);
  const [overlapConfirmOpen, setOverlapConfirmOpen] = useState(false);

  const deptId =
    typeof user?.department === "string"
      ? user.department
      : user?.department?.id ?? null;

  const { data: leaveTypesRaw, isLoading: typesLoading } = useLeaveTypes();
  const { data: eligibleRelievers, isLoading: relieversLoading } =
    useEligibleRelievers({ enabled: !!user });

  const currentYear = new Date().getFullYear();
  const { data: myRequestsRaw } = useQuery({
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

  const allLeaveTypes: LeaveType[] = leaveTypesRaw ?? [];
  const leaveTypes = allLeaveTypes.filter((t) =>
    isLeaveTypeEligible(t.name, user?.gender)
  );

  const myRequests: LeaveRequest[] = Array.isArray(myRequestsRaw)
    ? myRequestsRaw
    : myRequestsRaw?.results ?? [];

  const selectedLeaveType = leaveTypes.find((t) => t.id === leaveTypeId);
  const allowsSameDayLeave = Boolean(
    selectedLeaveType && isSickLeave(selectedLeaveType.name)
  );
  const minStartDate = allowsSameDayLeave ? todayYmd() : tomorrowYmd();
  const minEndDate = startDate || minStartDate;
  const relieverRequired = isRelieverRequired({
    leaveTypeName: selectedLeaveType?.name ?? "",
    isEmergency: false,
    user,
  });
  const showRelieverField = shouldShowRelieverField({
    relieverRequired,
    coverPersonId,
  });
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
  const baseFieldsValid =
    !noDepartment &&
    leaveTypeId !== "" &&
    startDate !== "" &&
    endDate !== "";
  const canSubmit =
    baseFieldsValid && (!relieverRequired || !!coverPersonId);
  const canSaveDraft = baseFieldsValid;

  const createDraftMutation = useMutation({
    mutationFn: async (payload: LeaveRequestCreatePayload) => {
      const created = await apiPost<LeaveRequest>("leave-requests", payload);
      return created;
    },
    onSuccess: (created) => {
      setApiError(null);
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      const id =
        (created as { id?: string }).id ?? (created as { pk?: string }).pk;
      if (id) {
        window.location.href = `/leave/requests/${id}`;
      }
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const data = err.data as Record<string, unknown>;
        const coverErr = extractFieldError(data, "cover_person");
        setCoverPersonError(coverErr);
        const msg = getValidationMessage(data);
        setApiError(coverErr ? null : msg || err.message);
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
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const data = err.data as Record<string, unknown>;
        const coverErr = extractFieldError(data, "cover_person");
        setCoverPersonError(coverErr);
        const msg = getValidationMessage(data);
        setApiError(coverErr ? null : msg || err.message);
      } else {
        setApiError("Something went wrong. Please try again.");
      }
    },
  });

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
    setCoverPersonError(null);
    createDraftMutation.mutate(payload);
  }

  function doSubmit() {
    setApiError(null);
    setCoverPersonError(null);
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

  const approvalSteps: ApprovalStep[] = APPROVAL_STEPS.map((label, i) => ({
    label,
    state: i === 0 ? "active" : "upcoming",
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Breadcrumb
        items={[
          { label: "Leave Management", href: "/leave" },
          { label: "Apply for Leave" },
        ]}
      />

      <div data-tour="leave-apply-intro">
      <PageHeader
        title="Apply for Leave"
        subtitle="Submit a request for approval. Approvals may include Unit Supervisor (if applicable), Line Manager, HR, and Executive Director."
      />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className={cn(stitchCardClass, "p-6 md:p-8")}>
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
              <div data-tour="leave-type-select">
                <FieldLabel htmlFor={`${formId}-type`}>Leave Type</FieldLabel>
                {typesLoading ? (
                  <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading types...
                  </div>
                ) : (
                  <select
                    id={`${formId}-type`}
                    value={leaveTypeId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      setLeaveTypeId(nextId);
                      const nextType = leaveTypes.find((t) => t.id === nextId);
                      if (
                        !isRelieverRequired({
                          leaveTypeName: nextType?.name ?? "",
                          isEmergency: false,
                          user,
                        })
                      ) {
                        setCoverPersonId("");
                        setCoverPersonError(null);
                      }
                      // Same-day start is only allowed for sick leave
                      const nextMin = nextType && isSickLeave(nextType.name)
                        ? todayYmd()
                        : tomorrowYmd();
                      if (startDate && startDate < nextMin) {
                        setStartDate("");
                        setEndDate("");
                      }
                    }}
                    className={stitchSelectClass}
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
                    Only one person per team, unit, or department can have
                    overlapping Annual or Casual leave.{" "}
                    <Link
                      href="/leave/calendar"
                      className="text-primary hover:underline"
                    >
                      Check the calendar
                    </Link>
                  </p>
                )}
              </div>

              {noDepartment ? (
                <p className="text-body-md text-on-surface-variant">
                  Reliever selection requires an org assignment. Contact HR if
                  this looks wrong.
                </p>
              ) : (
                <RelieverField
                  id={`${formId}-cover`}
                  value={coverPersonId}
                  onChange={(next) => {
                    setCoverPersonId(next);
                    setCoverPersonError(null);
                  }}
                  relieverRequired={relieverRequired}
                  showField={showRelieverField}
                  relievers={eligibleRelievers?.relievers ?? []}
                  eligibleData={eligibleRelievers}
                  isLoading={relieversLoading}
                  error={coverPersonError}
                />
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" data-tour="leave-date-range">
                <div>
                  <FieldLabel htmlFor={`${formId}-start`}>
                    Start Date
                  </FieldLabel>
                  <HolidayDatePicker
                    label="Start date"
                    value={startDate}
                    onChange={(next) => {
                      setStartDate(next);
                      if (next && endDate && endDate < next) {
                        setEndDate(next);
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
                {allowsSameDayLeave && (
                  <p className="sm:col-span-2 text-xs text-muted-foreground">
                    Sick leave can start today. Other leave types require at
                    least one day&apos;s notice.
                  </p>
                )}
              </div>

              <div>
                <FieldLabel htmlFor={`${formId}-days`}>
                  Working Days
                </FieldLabel>
                <div
                  id={`${formId}-days`}
                  className="flex items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3"
                >
                  <CalendarRange className="h-5 w-5 shrink-0 text-primary-container" />
                  <span className="text-body-md font-semibold text-on-surface">
                    {startDate && endDate
                      ? workingDays === 0
                        ? "0 days (check your dates)"
                        : `${workingDays} working day${workingDays !== 1 ? "s" : ""}`
                      : "Select start and end dates"}
                  </span>
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
                  className={stitchTextareaClass}
                />
              </div>

              <div aria-disabled="true" className="relative select-none">
                <FieldLabel htmlFor={`${formId}-file`} optional>
                  Attach Document
                </FieldLabel>
                <div
                  className="pointer-events-none flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-lowest p-6 text-center text-body-md text-on-surface-variant blur-[1.5px] opacity-50"
                  aria-hidden="true"
                >
                  <Paperclip className="h-4 w-4" />
                  Attach supporting document (optional)
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Document upload is not available yet.
                </p>
                <input
                  id={`${formId}-file`}
                  type="file"
                  className="sr-only"
                  disabled
                  tabIndex={-1}
                />
              </div>

              <div data-tour="leave-submit-actions">
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
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          <div className="sticky top-32 space-y-4">
            <LeaveBalancePanel balances={balances} loading={balancesLoading} />
            <div data-tour="leave-approval-chain">
              <ApprovalChain steps={approvalSteps} />
            </div>
            <PolicyNotice message="Leave requests follow a staged approval: Unit Supervisor (if applicable) → Line Manager → HR → Executive Director. Rejection at any stage ends the process." />
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
