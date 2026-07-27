"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle,
  Download,
  Loader2,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { Breadcrumb } from "@/components/hrm/ui/Breadcrumb";
import { FieldLabel } from "@/components/hrm/forms/FieldLabel";
import { UserSearchField } from "@/components/hrm/leave/UserSearchField";
import { LeaveBalancePanel } from "@/components/hrm/leave/LeaveBalancePanel";
import { ReconciledBadge } from "@/components/hrm/leave/ReconciledBadge";
import { StatusBadge } from "@/components/hrm/ui/StatusBadge";
import { DataTable } from "@/components/hrm/ui/DataTable";
import {
  stitchCardClass,
  stitchFieldClass,
  stitchSelectClass,
  stitchTextareaClass,
} from "@/lib/design/field-styles";
import { useAuth } from "@/contexts/AuthContext";
import { hasRole } from "@/lib/rbac";
import { ApiError } from "@/lib/api-client";
import {
  useBulkReconcileLeave,
  useBulkReconcileLeaveCsv,
  useLeaveBalances,
  useReconcileLeaveRequest,
  useReconciledLeaveRequestsPage,
} from "@/lib/api/leave";
import { useLeaveTypes } from "@/lib/api/leave-types";
import { extractFieldError } from "@/lib/leave/reliever";
import {
  downloadCsvTemplate,
  spansMultipleYears,
} from "@/lib/leave/reconciliation";
import type {
  BulkReconcileResponse,
  LeaveReconcileRowPayload,
} from "@/lib/types/leave";

type TabId = "single" | "bulk" | "history";

const EMPTY_BULK_ROW = (): LeaveReconcileRowPayload & { key: string } => ({
  key: crypto.randomUUID(),
  employee: "",
  leave_type: "",
  start_date: "",
  end_date: "",
  reconciliation_note: "",
  reason: "",
  cover_person: "",
});

function formatBulkErrors(errors: BulkReconcileResponse["errors"]): string {
  return errors
    .map((e) => {
      const detail =
        typeof e.errors === "object" && e.errors !== null
          ? Object.entries(e.errors as Record<string, unknown>)
              .map(([k, v]) => {
                const msg = Array.isArray(v) ? v[0] : String(v);
                return `${k}: ${msg}`;
              })
              .join("; ")
          : String(e.errors);
      return `Row ${e.index + 1}: ${detail}`;
    })
    .join("\n");
}

export default function LeaveReconciliationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canAccess = hasRole(user, "HR");

  const [tab, setTab] = useState<TabId>("single");

  // Single form state
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [reconciliationNote, setReconciliationNote] = useState("");
  const [coverPersonId, setCoverPersonId] = useState<string | null>(null);
  const [allowInsufficient, setAllowInsufficient] = useState(false);
  const [notifyDept, setNotifyDept] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Bulk state
  const [bulkRows, setBulkRows] = useState(() => [EMPTY_BULK_ROW()]);
  const [bulkAllowInsufficient, setBulkAllowInsufficient] = useState(false);
  const [bulkNotifyDept, setBulkNotifyDept] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkReconcileResponse | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [bulkMode, setBulkMode] = useState<"rows" | "csv">("rows");

  const { data: leaveTypes = [] } = useLeaveTypes();
  const reconcileMutation = useReconcileLeaveRequest();
  const bulkMutation = useBulkReconcileLeave();
  const csvMutation = useBulkReconcileLeaveCsv();

  const balanceYear = startDate
    ? new Date(startDate + "T00:00:00").getFullYear()
    : new Date().getFullYear();

  const { data: balances = [], isLoading: balancesLoading } = useLeaveBalances(
    { employee: employeeId ?? undefined, year: balanceYear },
    { enabled: !!employeeId }
  );

  const { data: reconciledPage, isLoading: historyLoading } =
    useReconciledLeaveRequestsPage({ page: 1 }, { enabled: canAccess && tab === "history" });

  const crossYear = spansMultipleYears(startDate, endDate);

  const canSubmitSingle =
    employeeId &&
    leaveTypeId &&
    startDate &&
    endDate &&
    reconciliationNote.trim().length > 0;

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmitSingle || !employeeId) return;
    setFormError(null);
    setFieldErrors({});

    try {
      const created = await reconcileMutation.mutateAsync({
        employee: employeeId,
        leave_type: leaveTypeId,
        start_date: startDate,
        end_date: endDate,
        reconciliation_note: reconciliationNote.trim(),
        reason: reason.trim() || undefined,
        cover_person: coverPersonId || undefined,
        allow_insufficient_balance: allowInsufficient,
        notify_department_colleagues: notifyDept,
      });
      router.push(`/leave/requests/${created.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        const d = err.data as Record<string, unknown>;
        const fields: Record<string, string> = {};
        for (const key of [
          "employee",
          "leave_type",
          "start_date",
          "end_date",
          "reconciliation_note",
          "reason",
          "cover_person",
          "leave_balance",
          "leave_request",
        ]) {
          const msg = extractFieldError(d, key);
          if (msg) fields[key] = msg;
        }
        setFieldErrors(fields);
        if (!Object.keys(fields).length) {
          setFormError(err.message);
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  }

  async function handleBulkSubmit() {
    setBulkError(null);
    setBulkResult(null);

    const rows: LeaveReconcileRowPayload[] = bulkRows
      .filter((r) => r.employee && r.leave_type && r.start_date && r.end_date)
      .map((r) => ({
        employee: r.employee,
        leave_type: r.leave_type,
        start_date: r.start_date,
        end_date: r.end_date,
        reconciliation_note: r.reconciliation_note.trim(),
        reason: r.reason?.trim() || undefined,
        cover_person: r.cover_person || undefined,
      }));

    if (rows.length === 0) {
      setBulkError("Add at least one complete row.");
      return;
    }

    try {
      const result = await bulkMutation.mutateAsync({
        rows,
        allow_insufficient_balance: bulkAllowInsufficient,
        notify_department_colleagues: bulkNotifyDept,
      });
      setBulkResult(result);
    } catch (err) {
      setBulkError(err instanceof ApiError ? err.message : "Bulk reconcile failed.");
    }
  }

  async function handleCsvUpload() {
    if (!csvFile) return;
    setBulkError(null);
    setBulkResult(null);

    const form = new FormData();
    form.append("file", csvFile);
    form.append("allow_insufficient_balance", String(bulkAllowInsufficient));
    form.append("notify_department_colleagues", String(bulkNotifyDept));

    try {
      const result = await csvMutation.mutateAsync(form);
      setBulkResult(result);
    } catch (err) {
      setBulkError(err instanceof ApiError ? err.message : "CSV upload failed.");
    }
  }

  const historyRows = reconciledPage?.results ?? [];

  if (!canAccess) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Breadcrumb
          items={[
            { label: "Leave Management", href: "/leave" },
            { label: "Leave Reconciliation" },
          ]}
        />
        <PageHeader
          title="Leave Reconciliation"
          subtitle="You don't have permission to reconcile leave."
        />
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm font-medium text-foreground">Access denied</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Only HR staff can record backdated leave.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Breadcrumb
        items={[
          { label: "Leave Management", href: "/leave" },
          { label: "Leave Reconciliation" },
        ]}
      />

      <PageHeader
        title="Leave Reconciliation"
        subtitle="Record leave retroactively for staff who were absent without applying. Reconciled requests are immediately approved."
      />

      <div className="flex flex-wrap gap-2 border-b border-border pb-1">
        {(
          [
            { id: "single" as TabId, label: "Single record" },
            { id: "bulk" as TabId, label: "Bulk reconcile" },
            { id: "history" as TabId, label: "Reconciled history" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition",
              tab === t.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "single" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSingleSubmit}
              className={cn(stitchCardClass, "p-6 space-y-5")}
              data-tour="leave-reconcile-form"
            >
              <p className="text-sm text-muted-foreground">
                Record leave retroactively — this creates an immediately approved
                request (not submitted for approval).
              </p>

              {formError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {formError}
                </div>
              )}

              <UserSearchField
                label="Employee"
                value={employeeId}
                onChange={(id) => {
                  setEmployeeId(id);
                  setFieldErrors((f) => ({ ...f, employee: "" }));
                }}
                error={fieldErrors.employee}
              />

              <div>
                <FieldLabel htmlFor="reconcile-leave-type">Leave Type</FieldLabel>
                <select
                  id="reconcile-leave-type"
                  value={leaveTypeId}
                  onChange={(e) => {
                    setLeaveTypeId(e.target.value);
                    setFieldErrors((f) => ({ ...f, leave_type: "" }));
                  }}
                  className={stitchSelectClass}
                  required
                >
                  <option value="" disabled>Select leave type</option>
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {fieldErrors.leave_type && (
                  <p className="mt-1.5 text-xs text-destructive">{fieldErrors.leave_type}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="reconcile-start">Start Date</FieldLabel>
                  <input
                    id="reconcile-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setFieldErrors((f) => ({ ...f, start_date: "" }));
                    }}
                    className={stitchFieldClass}
                    required
                  />
                  {fieldErrors.start_date && (
                    <p className="mt-1.5 text-xs text-destructive">{fieldErrors.start_date}</p>
                  )}
                </div>
                <div>
                  <FieldLabel htmlFor="reconcile-end">End Date</FieldLabel>
                  <input
                    id="reconcile-end"
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setFieldErrors((f) => ({ ...f, end_date: "" }));
                    }}
                    className={stitchFieldClass}
                    required
                  />
                  {fieldErrors.end_date && (
                    <p className="mt-1.5 text-xs text-destructive">{fieldErrors.end_date}</p>
                  )}
                </div>
              </div>

              {crossYear && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  This date range spans multiple calendar years. Working days will
                  be deducted from each year&apos;s balance separately.
                </div>
              )}

              <div>
                <FieldLabel htmlFor="reconcile-reason" optional>
                  Reason (shown on leave record)
                </FieldLabel>
                <textarea
                  id="reconcile-reason"
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Absent without prior application"
                  className={stitchTextareaClass}
                />
              </div>

              <div>
                <FieldLabel htmlFor="reconcile-note">
                  Reconciliation note (internal HR justification)
                </FieldLabel>
                <textarea
                  id="reconcile-note"
                  rows={3}
                  value={reconciliationNote}
                  onChange={(e) => {
                    setReconciliationNote(e.target.value);
                    setFieldErrors((f) => ({ ...f, reconciliation_note: "" }));
                  }}
                  placeholder="Required — e.g. Confirmed with line manager on…"
                  className={stitchTextareaClass}
                  required
                />
                {fieldErrors.reconciliation_note && (
                  <p className="mt-1.5 text-xs text-destructive">
                    {fieldErrors.reconciliation_note}
                  </p>
                )}
              </div>

              <UserSearchField
                label="Cover person (reliever)"
                value={coverPersonId}
                onChange={(id) => {
                  setCoverPersonId(id);
                  setFieldErrors((f) => ({ ...f, cover_person: "" }));
                }}
                optional
                error={fieldErrors.cover_person}
              />

              <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={allowInsufficient}
                    onChange={(e) => setAllowInsufficient(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm">
                    <span className="font-medium text-foreground">
                      Allow insufficient balance
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      This may result in negative remaining balance.
                    </span>
                  </span>
                </label>
                {fieldErrors.leave_balance && (
                  <p className="text-xs text-destructive">{fieldErrors.leave_balance}</p>
                )}
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={notifyDept}
                    onChange={(e) => setNotifyDept(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm">
                    <span className="font-medium text-foreground">
                      Notify department colleagues
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Sends an informational notice to colleagues in the employee&apos;s department.
                    </span>
                  </span>
                </label>
              </div>

              {fieldErrors.leave_request && (
                <p className="text-sm text-destructive">{fieldErrors.leave_request}</p>
              )}

              <button
                type="submit"
                disabled={!canSubmitSingle || reconcileMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {reconcileMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Record leave retroactively
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <LeaveBalancePanel balances={balances} loading={balancesLoading} />
            {!employeeId && (
              <p className="text-xs text-muted-foreground">
                Select an employee to preview their leave balance for {balanceYear}.
              </p>
            )}
          </div>
        </div>
      )}

      {tab === "bulk" && (
        <div className={cn(stitchCardClass, "p-6 space-y-5")} data-tour="leave-bulk-reconcile">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setBulkMode("rows")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                bulkMode === "rows" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              Row editor
            </button>
            <button
              type="button"
              onClick={() => setBulkMode("csv")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                bulkMode === "csv" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              CSV upload
            </button>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={bulkAllowInsufficient}
                onChange={(e) => setBulkAllowInsufficient(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm font-medium">Allow insufficient balance</span>
            </label>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={bulkNotifyDept}
                onChange={(e) => setBulkNotifyDept(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm font-medium">Notify department colleagues</span>
            </label>
          </div>

          {bulkError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {bulkError}
            </div>
          )}

          {bulkMode === "rows" ? (
            <>
              <div className="space-y-4">
                {bulkRows.map((row, idx) => (
                  <div
                    key={row.key}
                    className="rounded-lg border border-border p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        Row {idx + 1}
                      </span>
                      {bulkRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setBulkRows((rows) => rows.filter((r) => r.key !== row.key))
                          }
                          className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                          aria-label="Remove row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <UserSearchField
                      label="Employee"
                      value={row.employee || null}
                      onChange={(id) => {
                        if (!id) return;
                        setBulkRows((rows) =>
                          rows.map((r) =>
                            r.key === row.key ? { ...r, employee: id } : r
                          )
                        );
                      }}
                    />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <FieldLabel htmlFor={`bulk-type-${row.key}`}>Leave type</FieldLabel>
                        <select
                          id={`bulk-type-${row.key}`}
                          value={row.leave_type}
                          onChange={(e) =>
                            setBulkRows((rows) =>
                              rows.map((r) =>
                                r.key === row.key
                                  ? { ...r, leave_type: e.target.value }
                                  : r
                              )
                            )
                          }
                          className={stitchSelectClass}
                        >
                          <option value="">Select…</option>
                          {leaveTypes.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <FieldLabel htmlFor={`bulk-note-${row.key}`}>Reconciliation note</FieldLabel>
                        <input
                          id={`bulk-note-${row.key}`}
                          type="text"
                          value={row.reconciliation_note}
                          onChange={(e) =>
                            setBulkRows((rows) =>
                              rows.map((r) =>
                                r.key === row.key
                                  ? { ...r, reconciliation_note: e.target.value }
                                  : r
                              )
                            )
                          }
                          className={stitchFieldClass}
                        />
                      </div>
                      <div>
                        <FieldLabel htmlFor={`bulk-start-${row.key}`}>Start</FieldLabel>
                        <input
                          id={`bulk-start-${row.key}`}
                          type="date"
                          value={row.start_date}
                          onChange={(e) =>
                            setBulkRows((rows) =>
                              rows.map((r) =>
                                r.key === row.key
                                  ? { ...r, start_date: e.target.value }
                                  : r
                              )
                            )
                          }
                          className={stitchFieldClass}
                        />
                      </div>
                      <div>
                        <FieldLabel htmlFor={`bulk-end-${row.key}`}>End</FieldLabel>
                        <input
                          id={`bulk-end-${row.key}`}
                          type="date"
                          value={row.end_date}
                          min={row.start_date || undefined}
                          onChange={(e) =>
                            setBulkRows((rows) =>
                              rows.map((r) =>
                                r.key === row.key
                                  ? { ...r, end_date: e.target.value }
                                  : r
                              )
                            )
                          }
                          className={stitchFieldClass}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setBulkRows((rows) => [...rows, EMPTY_BULK_ROW()])}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                >
                  <Plus className="h-4 w-4" /> Add row
                </button>
                <button
                  type="button"
                  onClick={handleBulkSubmit}
                  disabled={bulkMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  {bulkMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Submit bulk reconcile
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={downloadCsvTemplate}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                >
                  <Download className="h-4 w-4" /> Download template
                </button>
                <p className="text-xs text-muted-foreground">
                  Columns: email, leave_type, start_date, end_date, reconciliation_note,
                  reason, cover_person_email
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-input px-3 py-2 text-sm">
                  <span className="truncate">
                    {csvFile?.name ?? "Choose CSV file"}
                  </span>
                  <UploadCloud className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="file"
                    accept=".csv"
                    className="sr-only"
                    onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleCsvUpload}
                  disabled={!csvFile || csvMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  {csvMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Upload CSV
                </button>
              </div>
            </>
          )}

          {bulkResult && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm dark:border-green-900/40 dark:bg-green-950/30">
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">
                    Created {bulkResult.created_count} reconciled request
                    {bulkResult.created_count !== 1 ? "s" : ""}.
                  </p>
                  {bulkResult.errors.length > 0 && (
                    <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-black/5 p-3 text-xs text-destructive dark:bg-white/5">
                      {formatBulkErrors(bulkResult.errors)}
                    </pre>
                  )}
                  {bulkResult.parse_errors && bulkResult.parse_errors.length > 0 && (
                    <ul className="mt-2 max-h-40 overflow-auto text-xs text-destructive">
                      {bulkResult.parse_errors.map((p) => (
                        <li key={p.line}>
                          Line {p.line}: {p.error}
                        </li>
                      ))}
                    </ul>
                  )}
                  {bulkResult.created.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs">
                      {bulkResult.created.map((id) => (
                        <li key={id}>
                          <Link
                            href={`/leave/requests/${id}`}
                            className="text-primary hover:underline"
                          >
                            View request {id}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-4" data-tour="leave-reconcile-history">
          {historyLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable
              columns={[
                { key: "employee", label: "Employee" },
                { key: "type", label: "Type" },
                { key: "dates", label: "Dates" },
                { key: "status", label: "Status" },
                { key: "link", label: "" },
              ]}
              emptyMessage="No reconciled leave requests yet."
              rows={historyRows.map((r) => ({
                employee: (
                  <span className="font-medium text-foreground">
                    {r.employee.first_name} {r.employee.last_name}
                  </span>
                ),
                type: r.leave_type.name,
                dates: `${r.start_date} — ${r.end_date}`,
                status: (
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={r.status} />
                    <ReconciledBadge />
                  </div>
                ),
                link: (
                  <Link
                    href={`/leave/requests/${r.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View
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
