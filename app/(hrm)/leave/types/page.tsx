"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useLeaveTypes,
  useCreateLeaveType,
  useUpdateLeaveType,
  useDeleteLeaveType,
} from "@/lib/api/leave-types";
import type {
  LeaveType,
  LeaveTypeCreatePayload,
  LeaveTypeUpdatePayload,
} from "@/lib/types/leave";

// ─── Overlay ──────────────────────────────────────────────────────────────────

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

// ─── Create / Edit Modal ────────────────────────────────────────────────────────

interface LeaveTypeFormModalProps {
  mode: "create" | "edit";
  type?: LeaveType;
  onClose: () => void;
}

function LeaveTypeFormModal({ mode, type, onClose }: LeaveTypeFormModalProps) {
  const createLeaveType = useCreateLeaveType();
  const updateLeaveType = useUpdateLeaveType(type?.id ?? "");

  const [form, setForm] = useState<LeaveTypeCreatePayload & { description: string }>({
    name: type?.name ?? "",
    description: type?.description ?? "",
    default_days: type?.default_days ?? 0,
  });
  const [error, setError] = useState<string | null>(null);
  const isPending = createLeaveType.isPending || updateLeaveType.isPending;

  const fieldCls =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const payload: LeaveTypeCreatePayload | LeaveTypeUpdatePayload =
        mode === "create"
          ? { name: form.name.trim(), description: form.description || undefined, default_days: form.default_days }
          : { name: form.name.trim(), description: form.description || undefined, default_days: form.default_days };
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

  return (
    <Overlay onClose={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h2 className="mb-5 text-lg font-semibold text-foreground">
          {mode === "create" ? "Add Leave Type" : "Edit Leave Type"}
        </h2>
        {error && (
          <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Name
            </label>
            <input
              className={fieldCls}
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Annual Leave"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Description
            </label>
            <textarea
              rows={2}
              className={fieldCls}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional description…"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Default days
            </label>
            <input
              className={fieldCls}
              type="number"
              min={0}
              required
              value={form.default_days}
              onChange={(e) =>
                setForm((f) => ({ ...f, default_days: parseInt(e.target.value, 10) || 0 }))
              }
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              )}
            >
              {isPending && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
              )}
              {mode === "create" ? "Create" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </Overlay>
  );
}

// ─── Delete Confirm ────────────────────────────────────────────────────────────

function ConfirmDelete({
  name,
  onConfirm,
  onClose,
}: {
  name: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  async function handle() {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  }
  return (
    <Overlay onClose={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <Trash2 className="h-5 w-5 text-destructive" />
        </div>
        <h2 className="mt-3 text-base font-semibold text-foreground">
          Delete leave type?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{name}</span> will be
          permanently removed.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handle}
            disabled={busy}
            className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {busy && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            Delete
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function getEligibility(name: string): "All" | "Female only" | "Male only" {
  const n = name.toLowerCase();
  if (n.includes("maternity")) return "Female only";
  if (n.includes("paternity")) return "Male only";
  return "All";
}

export default function LeaveTypesPage() {
  const { data: leaveTypes, isLoading } = useLeaveTypes();
  const deleteLeaveType = useDeleteLeaveType();

  const [createOpen, setCreateOpen] = useState(false);
  const [editType, setEditType] = useState<LeaveType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeaveType | null>(null);

  const list: LeaveType[] = leaveTypes ?? [];

  return (
    <div className="space-y-6 p-8">
      <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link href="/leave" className="text-primary hover:underline">
          Leave Management
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">Leave Types</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Leave Types
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage leave types and policies.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add leave type
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Description
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Default Days
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Eligibility
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No leave types found.
                  </td>
                </tr>
              ) : (
                list.map((t) => {
                  const eligibility = getEligibility(t.name);
                  return (
                    <tr
                      key={t.id}
                      className="border-t border-border transition hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {t.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t.description || (
                          <span className="italic opacity-60">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {t.default_days} days
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            eligibility === "All"
                              ? "bg-muted text-muted-foreground"
                              : eligibility === "Female only"
                              ? "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          )}
                        >
                          {eligibility}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditType(t)}
                            className="rounded p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            aria-label={`Edit ${t.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(t)}
                            className="rounded p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Delete ${t.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {createOpen && (
        <LeaveTypeFormModal
          mode="create"
          onClose={() => setCreateOpen(false)}
        />
      )}
      {editType && (
        <LeaveTypeFormModal
          mode="edit"
          type={editType}
          onClose={() => setEditType(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmDelete
          name={deleteTarget.name}
          onConfirm={() => deleteLeaveType.mutateAsync(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
