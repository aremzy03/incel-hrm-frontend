"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Breadcrumb } from "@/components/hrm/ui/Breadcrumb";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { DataTable } from "@/components/hrm/ui/DataTable";
import { HrOnly } from "@/components/hrm/leave/HrOnly";
import { FieldLabel } from "@/components/hrm/forms/FieldLabel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  stitchCardClass,
  stitchFieldClass,
  stitchSelectClass,
} from "@/lib/design/field-styles";
import { ApiError } from "@/lib/api-client";
import {
  useBlackoutPeriods,
  useCreateBlackout,
  useDeleteBlackout,
  useUpdateBlackout,
} from "@/lib/api/leave-settings";
import { useLeaveTypes } from "@/lib/api/leave-types";
import { useDepartments } from "@/lib/api/departments";
import { formatLeaveDuration } from "@/lib/leave/format";
import type { LeaveBlackoutPeriod, OverlapEnforcement } from "@/lib/types/leave";

const TABLE_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "dates", label: "Dates", mono: true },
  { key: "applies", label: "Applies to" },
  { key: "state", label: "State" },
  { key: "actions", label: "Actions" },
];

type ConfirmState =
  | { kind: "delete"; row: LeaveBlackoutPeriod }
  | { kind: "deactivate"; row: LeaveBlackoutPeriod }
  | { kind: "block-org" };

function mutationErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.message) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function enforcementLabel(value: OverlapEnforcement): string {
  return value === "BLOCK" ? "Block submit" : "Warn only";
}

function enforcementClass(value: OverlapEnforcement): string {
  return value === "BLOCK"
    ? "bg-red-100 text-red-700"
    : "bg-amber-100 text-amber-800";
}

function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit max-w-full items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold",
        className
      )}
    >
      {children}
    </span>
  );
}

export default function BlackoutsPage() {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const {
    data: rows = [],
    isLoading: rowsLoading,
    isError: rowsError,
    refetch: refetchRows,
  } = useBlackoutPeriods();
  const { data: types = [], isLoading: typesLoading } = useLeaveTypes();
  const { data: depts, isLoading: deptsLoading } = useDepartments();
  const create = useCreateBlackout();
  const update = useUpdateBlackout();
  const del = useDeleteBlackout();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [enforcement, setEnforcement] = useState<OverlapEnforcement>("BLOCK");
  const [allTypes, setAllTypes] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<string[]>([]);
  const [department, setDepartment] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [liveMessage, setLiveMessage] = useState("");

  const isSaving = create.isPending || update.isPending;
  const isDeleting = del.isPending;
  const isMutating = isSaving || isDeleting || update.isPending;
  const departments = depts?.results ?? [];

  const typeNameById = new Map(types.map((t) => [t.id, t.name]));
  const deptNameById = new Map(departments.map((d) => [d.id, d.name]));

  useEffect(() => {
    if (!confirm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isMutating) setConfirm(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirm, isMutating]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setStart("");
    setEnd("");
    setEnforcement("BLOCK");
    setAllTypes(false);
    setLeaveTypes([]);
    setDepartment("");
    setReason("");
    setFormError(null);
  }

  function scopeParts(row: LeaveBlackoutPeriod): { types: string; department: string } {
    const types =
      row.leave_types.length === 0
        ? "All leave types"
        : row.leave_types
            .map((id) => typeNameById.get(id) ?? "Unknown type")
            .join(", ");
    const department = row.department
      ? (deptNameById.get(row.department) ?? "Unknown department")
      : "Organisation-wide";
    return { types, department };
  }

  function appliesTo(row: LeaveBlackoutPeriod): string {
    const { types, department } = scopeParts(row);
    return `${types} · ${department}`;
  }

  function startEdit(row: LeaveBlackoutPeriod) {
    setEditingId(row.id);
    setName(row.name);
    setStart(row.start_date);
    setEnd(row.end_date);
    setEnforcement(row.enforcement);
    setAllTypes(row.leave_types.length === 0);
    setLeaveTypes(row.leave_types);
    setDepartment(row.department ?? "");
    setReason("");
    setFormError(null);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    requestAnimationFrame(() => nameInputRef.current?.focus());
  }

  function validate(): string | null {
    if (!name.trim()) return "Enter a period name.";
    if (!start) return "Choose a start date.";
    if (!end) return "Choose an end date.";
    if (end < start) return "End date must be on or after the start date.";
    if (!allTypes && leaveTypes.length === 0) {
      return "Choose at least one leave type, or select all leave types.";
    }
    return null;
  }

  function buildPayload() {
    return {
      name: name.trim(),
      start_date: start,
      end_date: end,
      enforcement,
      leave_types: allTypes ? [] : leaveTypes,
      department: department || null,
      is_active: true,
      reason: reason.trim() || undefined,
    };
  }

  async function savePeriod() {
    const problem = validate();
    if (problem) {
      setFormError(problem);
      return;
    }
    setFormError(null);
    const { is_active, ...fields } = buildPayload();
    const label = fields.name;
    try {
      if (editingId) {
        await update.mutateAsync({
          id: editingId,
          payload: fields,
        });
        setLiveMessage(`Saved ${label}.`);
      } else {
        await create.mutateAsync({ ...fields, is_active });
        setLiveMessage(`Created ${label}.`);
      }
      resetForm();
      setConfirm(null);
    } catch (err) {
      setFormError(
        mutationErrorMessage(
          err,
          editingId
            ? "Could not save this blackout period. Check the dates and try again."
            : "Could not create this blackout period. Check the dates and try again."
        )
      );
      setConfirm(null);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setFormError(problem);
      return;
    }
    if (enforcement === "BLOCK" && !department) {
      setConfirm({ kind: "block-org" });
      return;
    }
    void savePeriod();
  }

  async function setActive(row: LeaveBlackoutPeriod, next: boolean) {
    try {
      await update.mutateAsync({
        id: row.id,
        payload: { is_active: next },
      });
      setLiveMessage(
        next ? `${row.name} is on.` : `${row.name} is off. Leave can be submitted through this window.`
      );
      setConfirm(null);
    } catch (err) {
      setFormError(
        mutationErrorMessage(err, "Could not update this period. Try again.")
      );
      setConfirm(null);
    }
  }

  async function removePeriod(row: LeaveBlackoutPeriod) {
    try {
      await del.mutateAsync(row.id);
      setLiveMessage(`Deleted ${row.name}.`);
      setConfirm(null);
      if (editingId === row.id) resetForm();
    } catch (err) {
      setFormError(
        mutationErrorMessage(err, "Could not delete this period. Try again.")
      );
      setConfirm(null);
    }
  }

  function onToggleActive(row: LeaveBlackoutPeriod) {
    if (row.is_active && row.enforcement === "BLOCK") {
      setConfirm({ kind: "deactivate", row });
      return;
    }
    void setActive(row, !row.is_active);
  }

  const emptyMessage = (
    <span className="inline-flex flex-col items-center gap-3">
      <span>
        No blackout periods. Create one when leave should be frozen — for
        example year-end close.
      </span>
    </span>
  );

  const listAnnouncement = rowsError
    ? "Could not load blackout periods."
    : rowsLoading
      ? "Loading blackout periods."
      : rows.length === 0
        ? "No blackout periods yet."
        : `${rows.length} blackout ${rows.length === 1 ? "period" : "periods"}.`;

  const table = (
    <DataTable
      columns={TABLE_COLUMNS}
      emptyMessage={emptyMessage}
      className={rows.length > 0 ? "rounded-none border-0 [box-shadow:none]" : undefined}
      rows={rows.map((row) => {
        const scope = scopeParts(row);
        return {
          name: (
            <span
              className="block min-w-0 truncate font-medium text-on-surface"
              title={row.name}
            >
              {row.name}
            </span>
          ),
          dates: (
            <span className="whitespace-nowrap text-on-surface-variant">
              {formatLeaveDuration(row.start_date, row.end_date)}
            </span>
          ),
          applies: (
            <span className="min-w-0 text-on-surface-variant">
              <span className="block">{scope.types}</span>
              <span className="block">{scope.department}</span>
            </span>
          ),
          state: (
            <div className="flex flex-col items-start gap-1">
              <Pill className={enforcementClass(row.enforcement)}>
                {enforcementLabel(row.enforcement)}
              </Pill>
              {row.is_active ? (
                <Pill className="bg-green-100 text-green-700">On</Pill>
              ) : (
                <Pill className="bg-surface-container-high text-on-surface-variant">
                  Off
                </Pill>
              )}
            </div>
          ),
          actions: (
            <div className="relative z-[2] flex flex-col items-start">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-11 min-w-11 px-3"
                onClick={() => startEdit(row)}
                aria-label={`Edit ${row.name}`}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-11 min-w-11 px-3"
                disabled={update.isPending}
                onClick={() => onToggleActive(row)}
                aria-label={
                  row.is_active ? `Turn off ${row.name}` : `Turn on ${row.name}`
                }
              >
                {row.is_active ? "Turn off" : "Turn on"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="min-h-11 min-w-11 px-3"
                onClick={() => setConfirm({ kind: "delete", row })}
                aria-label={`Delete ${row.name}`}
              >
                Delete
              </Button>
            </div>
          ),
        };
      })}
    />
  );

  return (
    <HrOnly title="Blackout periods">
      <div className="mx-auto max-w-7xl space-y-8">
        <Breadcrumb
          items={[
            { label: "Leave Management", href: "/leave" },
            { label: "Blackout periods" },
          ]}
        />

        <PageHeader
          className="mb-0"
          title="Blackout periods"
          subtitle="Stop or warn on leave requests during a date window. Applies to employees submitting leave, not to already-approved requests."
        />

        <section className="space-y-4" aria-labelledby="blackout-form-heading">
          <div>
            <h2
              id="blackout-form-heading"
              className="text-title-sm font-semibold text-on-surface"
            >
              {editingId ? "Edit period" : "New period"}
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Name the window, set the dates, then choose which leave types and
              departments it covers.
            </p>
          </div>

          <form
            ref={formRef}
            className={cn(stitchCardClass, "grid items-start gap-4 p-6 md:grid-cols-2 md:p-8")}
            onSubmit={onSubmit}
          >
            <div className="md:col-span-2">
              <FieldLabel htmlFor={`${formId}-name`}>Period name</FieldLabel>
              <input
                id={`${formId}-name`}
                ref={nameInputRef}
                className={stitchFieldClass}
                value={name}
                maxLength={120}
                autoComplete="off"
                required
                placeholder="e.g. Year-end freeze"
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <FieldLabel htmlFor={`${formId}-start`}>Starts</FieldLabel>
              <input
                id={`${formId}-start`}
                type="date"
                lang="en-GB"
                className={stitchFieldClass}
                value={start}
                required
                onChange={(e) => {
                  const next = e.target.value;
                  setStart(next);
                  if (end && next && end < next) setEnd(next);
                }}
              />
            </div>

            <div>
              <FieldLabel htmlFor={`${formId}-end`}>Ends</FieldLabel>
              <input
                id={`${formId}-end`}
                type="date"
                lang="en-GB"
                className={stitchFieldClass}
                value={end}
                min={start || undefined}
                required
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>

            <div>
              <FieldLabel htmlFor={`${formId}-enforcement`}>Enforcement</FieldLabel>
              <select
                id={`${formId}-enforcement`}
                className={stitchSelectClass}
                value={enforcement}
                aria-describedby={`${formId}-enforcement-hint`}
                onChange={(e) =>
                  setEnforcement(e.target.value as OverlapEnforcement)
                }
              >
                <option value="BLOCK">Block submit</option>
                <option value="WARN">Warn only — allow submit</option>
              </select>
              <p
                id={`${formId}-enforcement-hint`}
                className="mt-1.5 text-body-md text-on-surface-variant"
              >
                {enforcement === "BLOCK"
                  ? "Employees cannot submit the selected leave types in this window."
                  : "Employees can still submit, and see a warning first."}
              </p>
            </div>

            <div>
              <FieldLabel htmlFor={`${formId}-department`}>Department</FieldLabel>
              <select
                id={`${formId}-department`}
                className={stitchSelectClass}
                value={department}
                disabled={deptsLoading}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="">All departments (organisation-wide)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <fieldset className="md:col-span-2">
              <legend className="mb-1.5 text-label-md text-on-surface-variant">
                Leave types
              </legend>
              <label className="flex min-h-11 items-center gap-2 text-body-md text-on-surface">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={allTypes}
                  onChange={(e) => {
                    setAllTypes(e.target.checked);
                    if (e.target.checked) setLeaveTypes([]);
                  }}
                />
                All leave types
              </label>
              <p className="mt-1 text-body-md text-on-surface-variant">
                Includes Sick, Maternity, and Paternity unless you pick specific
                types instead.
              </p>
              {!allTypes ? (
                <div className="mt-3 space-y-1 rounded-xl bg-surface-container-low px-3 py-2">
                  {typesLoading ? (
                    <p className="py-2 text-body-md text-on-surface-variant">
                      Loading leave types…
                    </p>
                  ) : types.length === 0 ? (
                    <p className="py-2 text-body-md text-on-surface-variant">
                      No leave types yet. Add them in Leave settings, or choose
                      all leave types.
                    </p>
                  ) : (
                    types.map((t) => (
                      <label
                        key={t.id}
                        className="flex min-h-11 items-center gap-2 text-body-md text-on-surface"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          checked={leaveTypes.includes(t.id)}
                          onChange={(e) => {
                            setLeaveTypes((prev) =>
                              e.target.checked
                                ? [...prev, t.id]
                                : prev.filter((id) => id !== t.id)
                            );
                          }}
                        />
                        {t.name}
                      </label>
                    ))
                  )}
                </div>
              ) : null}
            </fieldset>

            <div className="md:col-span-2">
              <FieldLabel htmlFor={`${formId}-reason`} optional>
                Note
              </FieldLabel>
              <input
                id={`${formId}-reason`}
                className={stitchFieldClass}
                value={reason}
                maxLength={240}
                autoComplete="off"
                placeholder="Why this window exists"
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {formError ? (
              <div
                className="md:col-span-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-body-md text-destructive"
                role="alert"
              >
                {formError}
              </div>
            ) : null}

            <div className="flex flex-col gap-2 md:col-span-2 md:flex-row md:justify-end">
              {editingId ? (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="min-h-11 w-full rounded-xl px-6 md:w-auto"
                  disabled={isSaving}
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              ) : null}
              <Button
                type="submit"
                size="lg"
                className="min-h-11 w-full rounded-xl px-6 md:w-auto"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                {editingId ? "Save changes" : "Create period"}
              </Button>
            </div>
          </form>
        </section>

        <section className="space-y-4" aria-labelledby="blackout-list-heading">
          <h2
            id="blackout-list-heading"
            className="text-title-sm font-semibold text-on-surface"
          >
            Configured periods
          </h2>

          <div aria-busy={rowsLoading}>
            {rowsLoading ? (
              <div className="h-48 animate-pulse rounded-xl bg-surface-container-high" />
            ) : rowsError ? (
              <div
                className="rounded-xl border border-outline-variant bg-surface-container-lowest px-6 py-10 text-center custom-shadow"
                role="alert"
              >
                <p className="text-body-md text-on-surface">
                  Could not load blackout periods.
                </p>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  Check your connection and try again. Existing windows on Apply
                  are unchanged.
                </p>
                <button
                  type="button"
                  onClick={() => refetchRows()}
                  className="mt-4 min-h-11 rounded-xl bg-primary-container px-6 py-3 text-body-md font-semibold text-on-primary hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Try again
                </button>
              </div>
            ) : rows.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest custom-shadow">
                <div className="hidden md:block">{table}</div>
                <ul className="divide-y divide-outline-variant md:hidden">
                  {rows.map((row) => (
                    <li key={row.id} className="flex flex-col gap-3 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 font-medium text-on-surface">
                          {row.name}
                        </p>
                        <Pill className={enforcementClass(row.enforcement)}>
                          {enforcementLabel(row.enforcement)}
                        </Pill>
                      </div>
                      <p className="font-data-table text-data-table tabular-nums text-on-surface-variant">
                        {formatLeaveDuration(row.start_date, row.end_date)}
                      </p>
                      <p className="text-body-md text-on-surface-variant">
                        {appliesTo(row)}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {row.is_active ? (
                          <Pill className="bg-green-100 text-green-700">On</Pill>
                        ) : (
                          <Pill className="bg-surface-container-high text-on-surface-variant">
                            Off
                          </Pill>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          className="min-h-11 w-full rounded-xl sm:w-auto"
                          onClick={() => startEdit(row)}
                          aria-label={`Edit ${row.name}`}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          className="min-h-11 w-full rounded-xl sm:w-auto"
                          disabled={update.isPending}
                          onClick={() => onToggleActive(row)}
                          aria-label={
                            row.is_active
                              ? `Turn off ${row.name}`
                              : `Turn on ${row.name}`
                          }
                        >
                          {row.is_active ? "Turn off" : "Turn on"}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="lg"
                          className="min-h-11 w-full rounded-xl sm:w-auto"
                          onClick={() => setConfirm({ kind: "delete", row })}
                          aria-label={`Delete ${row.name}`}
                        >
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <>
                <div className="hidden md:block">{table}</div>
                <div className="rounded-xl border border-outline-variant bg-surface-container-lowest px-6 py-10 text-center text-body-md text-on-surface-variant custom-shadow md:hidden">
                  {emptyMessage}
                </div>
              </>
            )}
          </div>
        </section>

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {liveMessage} {listAnnouncement}
        </p>
      </div>

      {confirm ? (
        <ConfirmDialog
          title={
            confirm.kind === "delete"
              ? `Delete ${confirm.row.name}?`
              : confirm.kind === "deactivate"
                ? `Turn off ${confirm.row.name}?`
                : "Block leave organisation-wide?"
          }
          body={
            confirm.kind === "delete"
              ? `${confirm.row.name} (${formatLeaveDuration(confirm.row.start_date, confirm.row.end_date)}, ${enforcementLabel(confirm.row.enforcement)}, ${appliesTo(confirm.row)}) will be removed. This cannot be undone.`
              : confirm.kind === "deactivate"
                ? `Employees will be able to submit leave through ${formatLeaveDuration(confirm.row.start_date, confirm.row.end_date)} for ${appliesTo(confirm.row)}.`
                : `${name.trim() || "This period"} will block submit for ${allTypes || leaveTypes.length === 0 ? "all leave types" : "the selected leave types"} across every department.`
          }
          confirmLabel={
            confirm.kind === "delete"
              ? "Delete period"
              : confirm.kind === "deactivate"
                ? "Turn off"
                : "Block organisation-wide"
          }
          destructive={confirm.kind !== "block-org"}
          isPending={
            confirm.kind === "delete"
              ? isDeleting
              : confirm.kind === "deactivate"
                ? update.isPending
                : isSaving
          }
          onClose={() => {
            if (!isMutating) setConfirm(null);
          }}
          onConfirm={() => {
            if (confirm.kind === "delete") void removePeriod(confirm.row);
            else if (confirm.kind === "deactivate")
              void setActive(confirm.row, false);
            else void savePeriod();
          }}
        />
      ) : null}
    </HrOnly>
  );
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  destructive,
  onClose,
  onConfirm,
  isPending,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const titleId = useId();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-xl border border-outline-variant bg-surface-container-lowest p-6 custom-shadow">
        <h2 id={titleId} className="text-title-sm font-semibold text-on-surface">
          {title}
        </h2>
        <p className="mt-2 text-body-md text-on-surface-variant">{body}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-h-11 rounded-xl"
            disabled={isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            size="lg"
            className="min-h-11 rounded-xl"
            disabled={isPending}
            autoFocus
            onClick={onConfirm}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
