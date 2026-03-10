"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from "@/lib/api/roles";
import type { Role, RolePayload } from "@/lib/types/auth";

// ─── Overlay ──────────────────────────────────────────────────────────────────

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}

// ─── Role Form Modal ──────────────────────────────────────────────────────────

interface RoleFormModalProps {
  mode: "create" | "edit";
  role?: Role;
  onClose: () => void;
}

function RoleFormModal({ mode, role, onClose }: RoleFormModalProps) {
  const createRole = useCreateRole();
  const updateRole = useUpdateRole(role?.id ?? "");

  const [form, setForm] = useState<RolePayload>({
    name: role?.name ?? "",
    description: role?.description ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const isPending = createRole.isPending || updateRole.isPending;

  const fieldCls =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "create") await createRole.mutateAsync(form);
      else await updateRole.mutateAsync(form);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h2 className="mb-5 text-lg font-semibold text-foreground">
          {mode === "create" ? "Create Role" : "Edit Role"}
        </h2>
        {error && (
          <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Role name
            </label>
            <input
              className={fieldCls}
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. HR"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Description
            </label>
            <textarea
              rows={3}
              className={fieldCls}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional description…"
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

// ─── Delete Confirm ───────────────────────────────────────────────────────────

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
    try { await onConfirm(); onClose(); } finally { setBusy(false); }
  }
  return (
    <Overlay onClose={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <Trash2 className="h-5 w-5 text-destructive" />
        </div>
        <h2 className="mt-3 text-base font-semibold text-foreground">Delete role?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{name}</span> will be permanently removed.
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
            {busy && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
            Delete
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ─── Role badge colour ────────────────────────────────────────────────────────

function roleBadgeClass(name: string) {
  const map: Record<string, string> = {
    HR: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    EXECUTIVE_DIRECTOR: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    MANAGING_DIRECTOR: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    LINE_MANAGER: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    EMPLOYEE: "bg-muted text-muted-foreground",
  };
  return map[name] ?? "bg-muted text-muted-foreground";
}

// ─── Main Roles Tab ───────────────────────────────────────────────────────────

export function RolesTab() {
  const { data: rolesData, isLoading } = useRoles();
  const deleteRole = useDeleteRole();

  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const roles = rolesData?.results ?? [];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {roles.length} role{roles.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add role
        </button>
      </div>

      {/* Cards grid */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : roles.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
          No roles defined yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((r) => (
            <div
              key={r.id}
              className="group relative rounded-xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md"
            >
              {/* Badge */}
              <span
                className={`mb-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleBadgeClass(r.name)}`}
              >
                {r.name.replace(/_/g, " ")}
              </span>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {r.description || <span className="italic opacity-60">No description.</span>}
              </p>
              <p className="mt-3 text-[11px] text-muted-foreground/60">
                Created {new Date(r.created_at).toLocaleDateString()}
              </p>

              {/* Actions */}
              <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={() => setEditRole(r)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(r)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {createOpen && <RoleFormModal mode="create" onClose={() => setCreateOpen(false)} />}
      {editRole && <RoleFormModal mode="edit" role={editRole} onClose={() => setEditRole(null)} />}
      {deleteTarget && (
        <ConfirmDelete
          name={deleteTarget.name}
          onConfirm={async () => { await deleteRole.mutateAsync(deleteTarget.id); }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
