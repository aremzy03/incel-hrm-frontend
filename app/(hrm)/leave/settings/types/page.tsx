"use client";

import { useId, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { DataTable } from "@/components/hrm/ui/DataTable";
import { StatusBadge } from "@/components/hrm/ui/StatusBadge";
import { FieldLabel } from "@/components/hrm/forms/FieldLabel";
import { Button } from "@/components/ui/button";
import {
  SettingsConfirmDialog,
  SettingsDialog,
  SettingsLiveRegion,
  SettingsQueryPanel,
} from "@/components/hrm/leave/SettingsDialog";
import {
  useLeaveTypes,
  useCreateLeaveType,
  useUpdateLeaveType,
  useDeleteLeaveType,
  useActivateLeaveType,
  useDeactivateLeaveType,
} from "@/lib/api/leave-types";
import { stitchFieldClass, stitchCardClass } from "@/lib/design/field-styles";
import { leaveTypeCode } from "@/lib/leave/reliever";
import { formatLeaveDays } from "@/lib/leave/format";
import { mutationErrorMessage } from "@/lib/leave/settings-labels";
import type {
  LeaveType,
  LeaveTypeCreatePayload,
  LeaveTypeUpdatePayload,
} from "@/lib/types/leave";

const TABLE_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "code", label: "Code", mono: true },
  { key: "state", label: "State" },
  { key: "days", label: "Fallback days" },
  { key: "eligibility", label: "Eligibility" },
  { key: "actions", label: "Actions" },
];

type ConfirmKind =
  | { kind: "delete"; row: LeaveType }
  | { kind: "deactivate"; row: LeaveType };

function getEligibility(type: LeaveType): "Everyone" | "Women only" | "Men only" {
  const code = leaveTypeCode(type);
  if (code === "MATERNITY") return "Women only";
  if (code === "PATERNITY") return "Men only";
  return "Everyone";
}

function LeaveTypeFormModal({
  mode,
  type,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  type?: LeaveType;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const formId = useId();
  const createLeaveType = useCreateLeaveType();
  const updateLeaveType = useUpdateLeaveType(type?.id ?? "");
  const [form, setForm] = useState({
    name: type?.name ?? "",
    code: type?.code ?? "",
    description: type?.description ?? "",
    default_days: type?.default_days ?? 0,
    display_order: type?.display_order ?? 100,
    calendar_color: type?.calendar_color ?? "",
    reason: "",
  });
  const [error, setError] = useState<string | null>(null);
  const isPending = createLeaveType.isPending || updateLeaveType.isPending;
  const codeLocked = mode === "edit";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError("Enter a leave type name.");
      return;
    }
    try {
      const payload: LeaveTypeCreatePayload | LeaveTypeUpdatePayload = {
        name: form.name.trim(),
        description: form.description || undefined,
        default_days: form.default_days,
        display_order: form.display_order,
        calendar_color: /^#[0-9A-Fa-f]{6}$/.test(form.calendar_color)
          ? form.calendar_color
          : "#4F46E5",
        reason: form.reason || undefined,
        ...(mode === "create" && form.code ? { code: form.code.toUpperCase() } : {}),
      };
      if (mode === "create") {
        await createLeaveType.mutateAsync(payload as LeaveTypeCreatePayload);
        onSaved(`Created ${form.name.trim()}.`);
      } else {
        await updateLeaveType.mutateAsync(payload as LeaveTypeUpdatePayload);
        onSaved(`Saved ${form.name.trim()}.`);
      }
      onClose();
    } catch (err: unknown) {
      setError(mutationErrorMessage(err, "Could not save this leave type. Try again."));
    }
  }

  const colorValue = /^#[0-9A-Fa-f]{6}$/.test(form.calendar_color)
    ? form.calendar_color
    : "#4F46E5";

  return (
    <SettingsDialog
      title={mode === "create" ? "Add leave type" : `Edit ${type?.name ?? "leave type"}`}
      onClose={isPending ? () => {} : onClose}
      closeOnBackdrop={!isPending}
    >
      {error ? (
        <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-body-md text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <FieldLabel htmlFor={`${formId}-name`}>Name</FieldLabel>
          <input
            id={`${formId}-name`}
            className={stitchFieldClass}
            required
            autoComplete="off"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <FieldLabel htmlFor={`${formId}-code`}>Code</FieldLabel>
          <input
            id={`${formId}-code`}
            className={stitchFieldClass}
            value={form.code}
            disabled={codeLocked}
            autoComplete="off"
            placeholder="e.g. STUDY"
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
          />
          {codeLocked ? (
            <p className="mt-1.5 text-body-md text-on-surface-variant">
              Code stays locked after create if requests already use this type.
            </p>
          ) : null}
        </div>
        <div>
          <FieldLabel htmlFor={`${formId}-desc`} optional>
            Description
          </FieldLabel>
          <textarea
            id={`${formId}-desc`}
            rows={2}
            className={stitchFieldClass}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor={`${formId}-days`}>Fallback days</FieldLabel>
            <input
              id={`${formId}-days`}
              className={stitchFieldClass}
              type="number"
              min={0}
              required
              value={form.default_days}
              onChange={(e) =>
                setForm((f) => ({ ...f, default_days: parseInt(e.target.value, 10) || 0 }))
              }
            />
          </div>
          <div>
            <FieldLabel htmlFor={`${formId}-order`}>Display order</FieldLabel>
            <input
              id={`${formId}-order`}
              className={stitchFieldClass}
              type="number"
              value={form.display_order}
              onChange={(e) =>
                setForm((f) => ({ ...f, display_order: parseInt(e.target.value, 10) || 0 }))
              }
            />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor={`${formId}-color`}>Calendar color</FieldLabel>
          <div className="flex items-center gap-3">
            <input
              id={`${formId}-color`}
              type="color"
              className="h-11 w-14 cursor-pointer rounded-lg border-none bg-surface-container-low p-1"
              value={colorValue}
              onChange={(e) => setForm((f) => ({ ...f, calendar_color: e.target.value }))}
            />
            <span className="font-data-table text-data-table text-on-surface-variant">
              {colorValue}
            </span>
          </div>
        </div>
        <div>
          <FieldLabel htmlFor={`${formId}-reason`} optional>
            Note for the audit log
          </FieldLabel>
          <input
            id={`${formId}-reason`}
            className={stitchFieldClass}
            value={form.reason}
            autoComplete="off"
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
          />
        </div>
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
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
          <Button type="submit" size="lg" className="min-h-11 rounded-xl" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {mode === "create" ? "Create type" : "Save changes"}
          </Button>
        </div>
      </form>
    </SettingsDialog>
  );
}

export default function LeaveTypesPage() {
  const {
    data: leaveTypes,
    isLoading,
    isError,
    refetch,
  } = useLeaveTypes();
  const deleteLeaveType = useDeleteLeaveType();
  const activate = useActivateLeaveType();
  const deactivate = useDeactivateLeaveType();
  const [createOpen, setCreateOpen] = useState(false);
  const [editType, setEditType] = useState<LeaveType | null>(null);
  const [confirm, setConfirm] = useState<ConfirmKind | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [liveMessage, setLiveMessage] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const all = leaveTypes ?? [];
  const list = all.filter((t) => {
    if (activeFilter === "active") return t.is_active !== false;
    if (activeFilter === "inactive") return t.is_active === false;
    return true;
  });

  const isMutating = deleteLeaveType.isPending || activate.isPending || deactivate.isPending;

  const emptyMessage =
    activeFilter === "all"
      ? "No leave types yet. Add Annual, Sick, or a custom type."
      : `No ${activeFilter} leave types.`;

  async function onDelete(row: LeaveType) {
    setActionError(null);
    try {
      await deleteLeaveType.mutateAsync(row.id);
      setLiveMessage(`Deleted ${row.name}.`);
      setConfirm(null);
    } catch (err) {
      setActionError(
        mutationErrorMessage(
          err,
          "Could not delete this type. Deactivate it if policies, balances, or requests exist."
        )
      );
      setConfirm(null);
    }
  }

  async function onDeactivate(row: LeaveType) {
    setActionError(null);
    try {
      await deactivate.mutateAsync({ id: row.id });
      setLiveMessage(`${row.name} is inactive. Staff cannot apply for it.`);
      setConfirm(null);
    } catch (err) {
      setActionError(mutationErrorMessage(err, "Could not deactivate this type. Try again."));
      setConfirm(null);
    }
  }

  async function onActivate(row: LeaveType) {
    setActionError(null);
    try {
      await activate.mutateAsync({ id: row.id });
      setLiveMessage(`${row.name} is active.`);
    } catch (err) {
      setActionError(mutationErrorMessage(err, "Could not activate this type. Try again."));
    }
  }

  function rowActions(t: LeaveType) {
    return (
      <div className="relative z-[2] flex flex-col items-start">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-11 min-w-11 px-3"
          onClick={() => setEditType(t)}
          aria-label={`Edit ${t.name}`}
        >
          Edit
        </Button>
        {t.is_active === false ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11 min-w-11 px-3"
            disabled={activate.isPending}
            onClick={() => void onActivate(t)}
            aria-label={`Activate ${t.name}`}
          >
            Activate
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11 min-w-11 px-3"
            onClick={() => setConfirm({ kind: "deactivate", row: t })}
            aria-label={`Deactivate ${t.name}`}
          >
            Deactivate
          </Button>
        )}
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="min-h-11 min-w-11 px-3"
          onClick={() => setConfirm({ kind: "delete", row: t })}
          aria-label={`Delete ${t.name}`}
        >
          Delete
        </Button>
      </div>
    );
  }

  const table = (
    <DataTable
      columns={TABLE_COLUMNS}
      emptyMessage={emptyMessage}
      className={list.length > 0 ? "rounded-none border-0 [box-shadow:none]" : undefined}
      getRowLabel={(i) => list[i]?.name}
      rows={list.map((t) => ({
        name: (
          <span className="flex min-w-0 items-center gap-2">
            {t.calendar_color ? (
              <span
                className="h-3 w-3 shrink-0 rounded-full border border-outline-variant"
                style={{ background: t.calendar_color }}
                aria-hidden
              />
            ) : null}
            <span className="truncate font-medium text-on-surface" title={t.name}>
              {t.name}
            </span>
          </span>
        ),
        code: t.code ?? "—",
        state: <StatusBadge status={t.is_active === false ? "Inactive" : "Active"} />,
        days: formatLeaveDays(t.default_days),
        eligibility: getEligibility(t),
        actions: rowActions(t),
      }))}
    />
  );

  const listAnnouncement = isError
    ? "Could not load leave types."
    : isLoading
      ? "Loading leave types."
      : list.length === 0
        ? emptyMessage
        : `${list.length} leave ${list.length === 1 ? "type" : "types"}.`;

  return (
    <div className="space-y-6">
      <PageHeader
        className="mb-0"
        title="Leave types"
        subtitle="Codes drive eligibility and staffing rules. Deactivate unused types instead of deleting them when they have history."
        action={
          <Button
            type="button"
            size="lg"
            className="min-h-11 rounded-xl px-6"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add leave type
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter leave types">
        {(
          [
            ["all", "All"],
            ["active", "Active"],
            ["inactive", "Inactive"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setActiveFilter(value)}
            className={cn(
              "min-h-11 rounded-full px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activeFilter === value
                ? "bg-primary-container text-white"
                : "bg-surface-container-high text-on-surface-variant"
            )}
            aria-pressed={activeFilter === value}
          >
            {label}
          </button>
        ))}
      </div>

      {actionError ? (
        <div
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-body-md text-destructive"
          role="alert"
        >
          {actionError}
        </div>
      ) : null}

      <section aria-labelledby="leave-types-list-heading">
        <h2 id="leave-types-list-heading" className="sr-only">
          Leave types
        </h2>
        <div aria-busy={isLoading} data-tour="leave-types-list">
          <SettingsQueryPanel
            isLoading={isLoading}
            isError={isError}
            onRetry={() => void refetch()}
            errorTitle="Could not load leave types."
            errorHint="Check your connection and try again. Existing types on Apply are unchanged."
          >
            {list.length > 0 ? (
              <div className={cn(stitchCardClass, "overflow-hidden")}>
                <div className="hidden md:block">{table}</div>
                <ul className="divide-y divide-outline-variant md:hidden">
                  {list.map((t) => (
                    <li key={t.id} className="flex flex-col gap-3 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 font-medium text-on-surface">{t.name}</p>
                        <StatusBadge status={t.is_active === false ? "Inactive" : "Active"} />
                      </div>
                      <p className="text-body-md text-on-surface-variant">
                        {t.code ?? "No code"} · {formatLeaveDays(t.default_days)} fallback days ·{" "}
                        {getEligibility(t)}
                      </p>
                      <div className="flex flex-col gap-2 sm:flex-row">{rowActions(t)}</div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <>
                <div className="hidden md:block">{table}</div>
                <div
                  className={cn(
                    stitchCardClass,
                    "px-6 py-10 text-center text-body-md text-on-surface-variant md:hidden"
                  )}
                >
                  {emptyMessage}
                </div>
              </>
            )}
          </SettingsQueryPanel>
        </div>
      </section>

      <SettingsLiveRegion message={`${liveMessage} ${listAnnouncement}`} />

      {createOpen ? (
        <LeaveTypeFormModal
          mode="create"
          onClose={() => setCreateOpen(false)}
          onSaved={setLiveMessage}
        />
      ) : null}
      {editType ? (
        <LeaveTypeFormModal
          mode="edit"
          type={editType}
          onClose={() => setEditType(null)}
          onSaved={setLiveMessage}
        />
      ) : null}
      {confirm ? (
        <SettingsConfirmDialog
          title={
            confirm.kind === "delete"
              ? `Delete ${confirm.row.name}?`
              : `Deactivate ${confirm.row.name}?`
          }
          body={
            confirm.kind === "delete"
              ? "Delete is blocked if the type has policies, balances, or requests. Deactivate instead when it has history."
              : `${confirm.row.name} will stay in history, but staff will not be able to apply for it.`
          }
          confirmLabel={confirm.kind === "delete" ? "Delete type" : "Deactivate"}
          destructive
          isPending={isMutating}
          onClose={() => {
            if (!isMutating) setConfirm(null);
          }}
          onConfirm={() => {
            if (confirm.kind === "delete") void onDelete(confirm.row);
            else void onDeactivate(confirm.row);
          }}
        />
      ) : null}
    </div>
  );
}
