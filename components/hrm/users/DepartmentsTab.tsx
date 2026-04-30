"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Users, ExternalLink } from "lucide-react";
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useDepartmentMembers,
} from "@/lib/api/departments";
import type { Department, DepartmentPayload } from "@/lib/types/auth";

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

// ─── Department Form Modal ────────────────────────────────────────────────────

interface DeptFormModalProps {
  mode: "create" | "edit";
  dept?: Department;
  onClose: () => void;
}

function DeptFormModal({ mode, dept, onClose }: DeptFormModalProps) {
  const createDept = useCreateDepartment();
  const updateDept = useUpdateDepartment(dept?.id ?? "");

  const [form, setForm] = useState<DepartmentPayload>({
    name: dept?.name ?? "",
    description: dept?.description ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const isPending = createDept.isPending || updateDept.isPending;

  const fieldCls =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "create") await createDept.mutateAsync(form);
      else await updateDept.mutateAsync(form);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h2 className="mb-5 text-lg font-semibold text-foreground">
          {mode === "create" ? "Create Department" : "Edit Department"}
        </h2>
        {error && (
          <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
            <input className={fieldCls} required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Engineering" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
            <textarea rows={3} className={fieldCls} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional description…" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted">Cancel</button>
            <button type="submit" disabled={isPending} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
              {isPending && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />}
              {mode === "create" ? "Create" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </Overlay>
  );
}

// (Removed line-manager assignment UI here to keep /departments free of /users requests.)

// ─── Department Members Modal ─────────────────────────────────────────────────

function DepartmentMembersModal({ dept, onClose }: { dept: Department; onClose: () => void }) {
  const { data: members = [], isLoading } = useDepartmentMembers(dept.id);

  return (
    <Overlay onClose={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-foreground">Department Members</h2>
        <p className="mb-5 text-xs text-muted-foreground">{dept.name}</p>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : members.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No members in this department.</p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {members.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{u.full_name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex gap-2 text-xs">
                  {u.gender && <span className="text-muted-foreground">{u.gender}</span>}
                  {u.roles?.[0] && (
                    <span className="rounded-full bg-muted px-2 py-0.5">{u.roles[0].replace(/_/g, " ")}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={onClose} className="mt-5 w-full rounded-lg border border-border py-2 text-sm font-medium transition hover:bg-muted">
          Close
        </button>
      </div>
    </Overlay>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function ConfirmDelete({ name, onConfirm, onClose }: { name: string; onConfirm: () => Promise<void>; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  async function handle() { setBusy(true); try { await onConfirm(); onClose(); } finally { setBusy(false); } }
  return (
    <Overlay onClose={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <Trash2 className="h-5 w-5 text-destructive" />
        </div>
        <h2 className="mt-3 text-base font-semibold text-foreground">Delete department?</h2>
        <p className="mt-1 text-sm text-muted-foreground"><span className="font-medium text-foreground">{name}</span> will be permanently removed.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted">Cancel</button>
          <button onClick={handle} disabled={busy} className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
            {busy && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />} Delete
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ─── Main Departments Tab ─────────────────────────────────────────────────────

export function DepartmentsTab() {
  const { data: deptsData, isLoading } = useDepartments();
  const deleteDept = useDeleteDepartment();

  const [createOpen, setCreateOpen] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [membersDept, setMembersDept] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  const departments = deptsData?.results ?? [];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {departments.length} department{departments.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add department
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Line Manager</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Members</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No departments yet.</td>
                </tr>
              ) : (
                departments.map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{d.name}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                      {d.description || <span className="italic opacity-50">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {d.line_manager ? (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          {typeof d.line_manager === "string"
                            ? d.line_manager
                            : `${d.line_manager.first_name} ${d.line_manager.last_name}`.trim() ||
                              d.line_manager.email}
                        </span>
                      ) : (
                        <span className="text-xs italic text-muted-foreground/60">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {typeof d.members_count === "number" ? d.members_count : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/departments/${d.id}`} title="View department" className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <button onClick={() => setMembersDept(d)} title="View members" className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground">
                          <Users className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditDept(d)} title="Edit" className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(d)} title="Delete" className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
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
      </div>

      {/* Modals */}
      {createOpen && <DeptFormModal mode="create" onClose={() => setCreateOpen(false)} />}
      {editDept && <DeptFormModal mode="edit" dept={editDept} onClose={() => setEditDept(null)} />}
      {membersDept && <DepartmentMembersModal dept={membersDept} onClose={() => setMembersDept(null)} />}
      {deleteTarget && (
        <ConfirmDelete
          name={deleteTarget.name}
          onConfirm={async () => { await deleteDept.mutateAsync(deleteTarget.id); }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
