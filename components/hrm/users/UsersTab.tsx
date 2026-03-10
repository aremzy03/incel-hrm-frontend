"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ShieldCheck,
  X,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useAssignRole, useRemoveRole } from "@/lib/api/users";
import { useDepartments } from "@/lib/api/departments";
import { useRoles } from "@/lib/api/roles";
import type { User, UserCreatePayload, UserUpdatePayload } from "@/lib/types/auth";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function getDepartmentId(dept: User["department"]): string {
  if (!dept) return "";
  return typeof dept === "string" ? dept : dept.id;
}

function roleBadgeClass(role: string) {
  const map: Record<string, string> = {
    HR: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    EXECUTIVE_DIRECTOR: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    MANAGING_DIRECTOR: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    LINE_MANAGER: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    EMPLOYEE: "bg-muted text-muted-foreground",
  };
  return map[role] ?? "bg-muted text-muted-foreground";
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────

interface UserFormModalProps {
  mode: "create" | "edit";
  user?: User;
  departments: { id: string; name: string }[];
  onClose: () => void;
}

function UserFormModal({ mode, user, departments, onClose }: UserFormModalProps) {
  const createUser = useCreateUser();
  const updateUser = useUpdateUser(user?.id ?? "");

  const [form, setForm] = useState({
    email: user?.email ?? "",
    password: "",
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    gender: (user?.gender ?? "") as "" | "MALE" | "FEMALE",
    date_of_birth: user?.date_of_birth ?? "",
    phone: user?.phone ?? "",
    department: getDepartmentId(user?.department ?? null),
    is_active: user?.is_active ?? true,
  });
  const [error, setError] = useState<string | null>(null);

  const isPending = createUser.isPending || updateUser.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "create") {
        const payload: UserCreatePayload = {
          email: form.email.trim(),
          password: form.password,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          gender: form.gender as "MALE" | "FEMALE",
          date_of_birth: form.date_of_birth,
          phone: form.phone.trim() || undefined,
          department: form.department || undefined,
        };
        await createUser.mutateAsync(payload);
      } else {
        const payload: UserUpdatePayload = {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          gender: form.gender || undefined,
          date_of_birth: form.date_of_birth || null,
          phone: form.phone.trim() || undefined,
          department: form.department || null,
          is_active: form.is_active,
        };
        await updateUser.mutateAsync(payload);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  const fieldCls =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition";

  return (
    <Overlay onClose={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h2 className="mb-5 text-lg font-semibold text-foreground">
          {mode === "create" ? "Create User" : "Edit User"}
        </h2>
        {error && (
          <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "create" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
                <input className={cn(fieldCls, "col-span-2")} type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="user@example.com" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Password</label>
                <input className={fieldCls} type="password" required value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">First name</label>
              <input className={fieldCls} required value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} placeholder="Jane" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Last name</label>
              <input className={fieldCls} required value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} placeholder="Doe" />
            </div>
          </div>
          {mode === "create" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Gender</label>
                <select className={fieldCls} required value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as "" | "MALE" | "FEMALE" }))}>
                  <option value="">— Select —</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Date of birth</label>
                <input className={fieldCls} type="date" required value={form.date_of_birth} onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))} min="1920-01-01" max={new Date().toISOString().slice(0, 10)} />
              </div>
            </div>
          )}
          {mode === "edit" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Gender</label>
                <select className={fieldCls} value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as "" | "MALE" | "FEMALE" }))}>
                  <option value="">— Select —</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Date of birth</label>
                <input className={fieldCls} type="date" value={form.date_of_birth} onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))} min="1920-01-01" max={new Date().toISOString().slice(0, 10)} />
              </div>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Phone</label>
            <input className={fieldCls} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+234..." />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Department</label>
            <select className={fieldCls} value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}>
              <option value="">— No department —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          {mode === "edit" && (
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="h-4 w-4 rounded border-border accent-primary" />
              Active account
            </label>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted">Cancel</button>
            <button type="submit" disabled={isPending} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
              {isPending && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />}
              {mode === "create" ? "Create" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </Overlay>
  );
}

// ─── Role Manager ─────────────────────────────────────────────────────────────
// User can only have one role. Selecting a new role overwrites the current one.

interface RoleManagerProps {
  user: User;
  allRoles: { id: string; name: string }[];
  onClose: () => void;
}

function RoleManager({ user, allRoles, onClose }: RoleManagerProps) {
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();
  const [busy, setBusy] = useState<string | null>(null);

  const currentRole = user.roles?.[0] ?? null;
  const currentRoleRecord = allRoles.find((r) => r.name === currentRole);

  async function selectRole(role: { id: string; name: string } | null) {
    if (!role) {
      if (!currentRoleRecord) return;
      setBusy("remove");
      try {
        await removeRole.mutateAsync({ userId: user.id, roleId: currentRoleRecord.id });
      } finally {
        setBusy(null);
      }
      return;
    }

    setBusy(role.id);
    try {
      if (currentRoleRecord && currentRoleRecord.id !== role.id) {
        await removeRole.mutateAsync({ userId: user.id, roleId: currentRoleRecord.id });
      }
      await assignRole.mutateAsync({ userId: user.id, payload: { role_id: role.id } });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Overlay onClose={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Assign Role
          </h2>
          <p className="text-xs text-muted-foreground">{user.full_name}</p>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          One role per user. Selecting a role overwrites the current assignment.
        </p>
        <div className="space-y-2">
          <button
            onClick={() => selectRole(null)}
            disabled={busy === "remove" || !currentRoleRecord}
            className={cn(
              "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition",
              !currentRoleRecord
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-background text-foreground hover:bg-muted"
            )}
          >
            <span>No role</span>
            {busy === "remove" ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
            ) : (
              <span className={cn("h-2 w-2 rounded-full", !currentRoleRecord ? "bg-primary" : "bg-muted-foreground/30")} />
            )}
          </button>
          {allRoles.map((role) => {
            const active = currentRole === role.name;
            return (
              <button
                key={role.id}
                onClick={() => selectRole(role)}
                disabled={busy === role.id}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground hover:bg-muted"
                )}
              >
                <span>{role.name.replace(/_/g, " ")}</span>
                {busy === role.id ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                ) : (
                  <span className={cn("h-2 w-2 rounded-full", active ? "bg-primary" : "bg-muted-foreground/30")} />
                )}
              </button>
            );
          })}
        </div>
        <button onClick={onClose} className="mt-4 w-full rounded-lg border border-border py-2 text-sm font-medium transition hover:bg-muted">
          Done
        </button>
      </div>
    </Overlay>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

interface ConfirmDeleteProps {
  name: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

function ConfirmDelete({ name, onConfirm, onClose }: ConfirmDeleteProps) {
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
        <h2 className="mt-3 text-base font-semibold text-foreground">Delete user?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{name}</span> will be permanently removed. This action cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted">Cancel</button>
          <button onClick={handle} disabled={busy} className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
            {busy && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
            Delete
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ─── Overlay wrapper ──────────────────────────────────────────────────────────

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

// ─── Main Users Tab ───────────────────────────────────────────────────────────

export function UsersTab() {
  const { data: usersData, isLoading: usersLoading } = useUsers();
  const { data: deptsData } = useDepartments();
  const { data: rolesData } = useRoles();
  const deleteUser = useDeleteUser();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [rolesUser, setRolesUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deptFilter, setDeptFilter] = useState("");

  const users = usersData?.results ?? [];
  const departments = deptsData?.results ?? [];
  const allRoles = rolesData?.results ?? [];

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchesDept = !deptFilter || getDepartmentId(u.department) === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="relative">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="appearance-none rounded-lg border border-border bg-background py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="ml-auto flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add user
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Department</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Roles</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {usersLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const dept = departments.find((d) => d.id === getDepartmentId(u.department));
                  return (
                    <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {getInitials(u.full_name)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{u.full_name}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {dept?.name ?? <span className="italic text-muted-foreground/60">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {u.roles?.[0] ? (
                          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", roleBadgeClass(u.roles[0]))}>
                            {u.roles[0].replace(/_/g, " ")}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">No role</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", u.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-muted text-muted-foreground")}>
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setRolesUser(u)}
                            title="Assign role"
                            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditUser(u)}
                            title="Edit user"
                            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(u)}
                            title="Delete user"
                            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
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
        {/* Footer count */}
        {!usersLoading && (
          <div className="border-t border-border bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
            {filtered.length} of {users.length} user{users.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Modals */}
      {createOpen && (
        <UserFormModal mode="create" departments={departments} onClose={() => setCreateOpen(false)} />
      )}
      {editUser && (
        <UserFormModal mode="edit" user={editUser} departments={departments} onClose={() => setEditUser(null)} />
      )}
      {rolesUser && (
        <RoleManager user={rolesUser} allRoles={allRoles} onClose={() => setRolesUser(null)} />
      )}
      {deleteTarget && (
        <ConfirmDelete
          name={deleteTarget.full_name}
          onConfirm={async () => { await deleteUser.mutateAsync(deleteTarget.id); }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
