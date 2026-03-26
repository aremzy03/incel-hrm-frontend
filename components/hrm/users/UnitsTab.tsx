"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, ChevronDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDepartments } from "@/lib/api/departments";
import {
  useUnits,
  useCreateUnit,
  useUpdateUnit,
  useDeleteUnit,
} from "@/lib/api/units";
import { useAuth } from "@/contexts/AuthContext";
import { canManageUsers } from "@/lib/rbac";
import type { Department, Unit, UnitCreatePayload, UnitUpdatePayload } from "@/lib/types/auth";

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

function getLineManagerId(lm: Department["line_manager"]): string | null {
  if (!lm) return null;
  return typeof lm === "string" ? lm : lm?.id ?? null;
}

interface UnitFormModalProps {
  mode: "create" | "edit";
  unit?: Unit;
  departmentId: string;
  onClose: () => void;
}

function UnitFormModal({
  mode,
  unit,
  departmentId,
  onClose,
}: UnitFormModalProps) {
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit(unit?.id ?? "");

  const [form, setForm] = useState<UnitCreatePayload & UnitUpdatePayload>({
    name: unit?.name ?? "",
    department: departmentId,
  });
  const [error, setError] = useState<string | null>(null);
  const isPending = createUnit.isPending || updateUnit.isPending;

  const fieldCls =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "create") {
        await createUnit.mutateAsync({ name: form.name, department: departmentId });
      } else {
        await updateUnit.mutateAsync({ name: form.name });
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
          {mode === "create" ? "Create Unit" : "Edit Unit"}
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
              placeholder="Unit A"
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
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
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
          Delete unit?
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

export function UnitsTab() {
  const { user } = useAuth();
  const { data: deptsData, isLoading: deptsLoading } = useDepartments();
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const { data: units = [], isLoading: unitsLoading } = useUnits(selectedDeptId);
  const deleteUnit = useDeleteUnit();

  const [createOpen, setCreateOpen] = useState(false);
  const [editUnit, setEditUnit] = useState<Unit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null);

  const departments = deptsData?.results ?? [];

  const selectedDept = departments.find((d) => d.id === selectedDeptId);
  const isLineManagerOfDept =
    selectedDept &&
    getLineManagerId(selectedDept.line_manager) === user?.id;
  const canManage = canManageUsers(user);
  const canCreateEditDelete =
    selectedDeptId && (isLineManagerOfDept || canManage);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className={cn(
              "appearance-none rounded-lg border border-border bg-background py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
            )}
            aria-label="Select department"
          >
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
        {canCreateEditDelete && (
          <button
            onClick={() => setCreateOpen(true)}
            disabled={!selectedDeptId}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add unit
          </button>
        )}
      </div>

      {!selectedDeptId ? (
        <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Select a department to view its units.
        </p>
      ) : deptsLoading || unitsLoading ? (
        <div className="flex justify-center py-12">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Supervisor
                  </th>
                  {canCreateEditDelete && (
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {units.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canCreateEditDelete ? 4 : 3}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      No units in this department.
                    </td>
                  </tr>
                ) : (
                  units.map((u) => (
                    <tr
                      key={u.id}
                      className="border-t border-border transition hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/units/${u.id}`}
                          className="font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {u.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u.department?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u.supervisor
                          ? `${u.supervisor.first_name} ${u.supervisor.last_name}`
                          : <span className="italic opacity-60">None</span>}
                      </td>
                      {canCreateEditDelete && (
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Link
                              href={`/units/${u.id}`}
                              title="View unit"
                              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => setEditUnit(u)}
                              title="Edit"
                              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(u)}
                              title="Delete"
                              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {createOpen && selectedDeptId && (
        <UnitFormModal
          mode="create"
          departmentId={selectedDeptId}
          onClose={() => setCreateOpen(false)}
        />
      )}
      {editUnit && (
        <UnitFormModal
          mode="edit"
          unit={editUnit}
          departmentId={editUnit.department?.id ?? selectedDeptId}
          onClose={() => setEditUnit(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmDelete
          name={deleteTarget.name}
          onConfirm={() => deleteUnit.mutateAsync(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
