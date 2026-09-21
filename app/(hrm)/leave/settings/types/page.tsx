"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
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
import type {
  LeaveType,
  LeaveTypeCreatePayload,
  LeaveTypeUpdatePayload,
} from "@/lib/types/leave";

function Overlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}

function LeaveTypeFormModal({
  mode,
  type,
  onClose,
}: {
  mode: "create" | "edit";
  type?: LeaveType;
  onClose: () => void;
}) {
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
      } else {
        await updateLeaveType.mutateAsync(payload as LeaveTypeUpdatePayload);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  const colorValue = /^#[0-9A-Fa-f]{6}$/.test(form.calendar_color)
    ? form.calendar_color
    : "#4F46E5";

  return (
    <Overlay onClose={onClose}>
      <div className="w-full max-w-sm max-h-[min(72vh,560px)] overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-xl">
        <h2 className="mb-3 text-base font-semibold text-foreground">
          {mode === "create" ? "Add Leave Type" : "Edit Leave Type"}
        </h2>
        {error && (
          <p className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
            <input className={stitchFieldClass} required value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Code</label>
            <input className={stitchFieldClass} value={form.code} disabled={codeLocked}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="e.g. STUDY" />
            {codeLocked && (
              <p className="mt-1 text-xs text-muted-foreground">Code is locked after create if requests exist.</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
            <textarea rows={2} className={stitchFieldClass} value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Fallback days</label>
              <input className={stitchFieldClass} type="number" min={0} required value={form.default_days}
                onChange={(e) => setForm((f) => ({ ...f, default_days: parseInt(e.target.value, 10) || 0 }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Display order</label>
              <input className={stitchFieldClass} type="number" value={form.display_order}
                onChange={(e) => setForm((f) => ({ ...f, display_order: parseInt(e.target.value, 10) || 0 }))} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Calendar color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                aria-label="Calendar color"
                className="h-10 w-14 cursor-pointer rounded-lg border-none bg-surface-container-low p-1"
                value={colorValue}
                onChange={(e) => setForm((f) => ({ ...f, calendar_color: e.target.value }))}
              />
              <span className="font-mono text-xs text-muted-foreground">{colorValue}</span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Reason (audit)</label>
            <input className={stitchFieldClass} value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
              {mode === "create" ? "Create" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </Overlay>
  );
}

function getEligibility(type: LeaveType): "All" | "Female only" | "Male only" {
  const code = leaveTypeCode(type);
  if (code === "MATERNITY") return "Female only";
  if (code === "PATERNITY") return "Male only";
  return "All";
}

export default function LeaveTypesPage() {
  const { data: leaveTypes, isLoading } = useLeaveTypes();
  const deleteLeaveType = useDeleteLeaveType();
  const activate = useActivateLeaveType();
  const deactivate = useDeactivateLeaveType();
  const [createOpen, setCreateOpen] = useState(false);
  const [editType, setEditType] = useState<LeaveType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeaveType | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");

  const list = (leaveTypes ?? []).filter((t) => {
    if (activeFilter === "active") return t.is_active !== false;
    if (activeFilter === "inactive") return t.is_active === false;
    return true;
  });

  return (
    <div className="space-y-6">
        <PageHeader
          title="Leave Types"
          subtitle="Codes drive eligibility and staffing rules. Deactivate unused types instead of deleting when they have history."
          action={
            <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              <Plus className="h-4 w-4" /> Add leave type
            </button>
          }
        />

        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={cn("rounded-full px-3 py-1 text-xs font-medium", activeFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
              {f}
            </button>
          ))}
        </div>

        <div className={cn(stitchCardClass, "overflow-hidden")} data-tour="leave-types-list">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Code</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Active</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fallback days</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Order</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Color</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Eligibility</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">Loading…</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No leave types found.</td></tr>
              ) : (
                list.map((t) => (
                  <tr key={t.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{t.code ?? "—"}</td>
                    <td className="px-4 py-3">{t.is_active === false ? "Inactive" : "Active"}</td>
                    <td className="px-4 py-3">{t.default_days}</td>
                    <td className="px-4 py-3">{t.display_order ?? "—"}</td>
                    <td className="px-4 py-3">
                      {t.calendar_color ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full border" style={{ background: t.calendar_color }} />
                          {t.calendar_color}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">{getEligibility(t)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button className="rounded p-1.5 hover:bg-muted" onClick={() => setEditType(t)} aria-label={`Edit ${t.name}`}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        {t.is_active === false ? (
                          <button className="rounded px-2 py-1 text-xs hover:bg-muted" onClick={() => activate.mutate({ id: t.id })}>Activate</button>
                        ) : (
                          <button className="rounded px-2 py-1 text-xs hover:bg-muted" onClick={() => deactivate.mutate({ id: t.id })}>Deactivate</button>
                        )}
                        <button className="rounded p-1.5 hover:bg-destructive/10" onClick={() => setDeleteTarget(t)} aria-label={`Delete ${t.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {createOpen && <LeaveTypeFormModal mode="create" onClose={() => setCreateOpen(false)} />}
        {editType && <LeaveTypeFormModal mode="edit" type={editType} onClose={() => setEditType(null)} />}
        {deleteTarget && (
          <Overlay onClose={() => setDeleteTarget(null)}>
            <div className="w-full max-w-sm rounded-2xl border bg-card p-6">
              <h2 className="font-semibold">Delete leave type?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Delete is blocked if the type has policies, balances, or requests. Deactivate instead when it has history.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button className="rounded-lg border px-4 py-2 text-sm" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="rounded-lg bg-destructive px-4 py-2 text-sm text-white" onClick={async () => {
                  try {
                    await deleteLeaveType.mutateAsync(deleteTarget.id);
                    setDeleteTarget(null);
                  } catch {
                    /* shown via mutation */
                  }
                }}>Delete</button>
              </div>
            </div>
          </Overlay>
        )}
    </div>
  );
}
