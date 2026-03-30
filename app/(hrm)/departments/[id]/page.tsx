"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useDepartmentDetail,
  useDepartments,
} from "@/lib/api/departments";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { ArrowLeft, Users, Building2, Loader2, Plus, Trash2, Pencil, UserPlus, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUsers, useChangeUserDepartment } from "@/lib/api/users";
import { apiPatch } from "@/lib/api-client";
import { useCreateUnit, useDeleteUnit } from "@/lib/api/units";
import type { Unit, UnitUpdatePayload, User as UserType, UserUpdatePayload } from "@/lib/types/auth";

function getMemberName(m: { first_name: string; last_name: string }) {
  return [m.first_name, m.last_name].filter(Boolean).join(" ") || "—";
}

function getLineManagerDisplay(
  lm: string | { first_name: string; last_name: string; email: string } | null
): string {
  if (!lm) return "—";
  if (typeof lm === "string") return lm;
  return getMemberName(lm);
}

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

export default function DepartmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading, error } = useDepartmentDetail(id);
  const { data: deptsData } = useDepartments();
  const [tab, setTab] = useState<"members" | "units">("members");

  const { data: usersData, isLoading: usersLoading } = useUsers();
  const allUsers = usersData?.results ?? [];

  const changeDept = useChangeUserDepartment();
  const createUnit = useCreateUnit();
  const deleteUnit = useDeleteUnit();
  const qc = useQueryClient();

  const updateUnit = useMutation({
    mutationFn: ({
      unitId,
      payload,
    }: {
      unitId: string;
      payload: UnitUpdatePayload;
    }) =>
      apiPatch<Unit>(`units/${unitId}/`, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["department-detail", id] });
      qc.invalidateQueries({ queryKey: ["unit-detail", vars.unitId] });
    },
  });

  const updateUserFields = useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UserUpdatePayload }) =>
      apiPatch<UserType>(`users/${userId}/`, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["department-detail", id] });
      qc.invalidateQueries({ queryKey: ["department-members", id] });
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["unit-detail"] });
      qc.invalidateQueries({ queryKey: ["unit-detail", vars.userId] });
    },
  });

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [addMemberError, setAddMemberError] = useState<string | null>(null);

  const [createUnitOpen, setCreateUnitOpen] = useState(false);
  const [unitName, setUnitName] = useState("");
  const [unitError, setUnitError] = useState<string | null>(null);

  const [editUnitTarget, setEditUnitTarget] = useState<Unit | null>(null);
  const [deleteUnitTarget, setDeleteUnitTarget] = useState<Unit | null>(null);

  const [assignOpen, setAssignOpen] = useState<{
    unit: (Unit & { members?: { id: string; first_name: string; last_name: string; email: string }[] });
  } | null>(null);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);

  const [supervisorOpen, setSupervisorOpen] = useState<{
    unit: Unit;
  } | null>(null);
  const [supervisorUserId, setSupervisorUserId] = useState("");
  const [supervisorError, setSupervisorError] = useState<string | null>(null);

  const departments = deptsData?.results ?? [];
  void departments;

  const deptMemberIds = useMemo(() => {
    const members = data?.members ?? [];
    return new Set(members.map((m) => m.id));
  }, [data?.members]);

  const eligibleUsersToAdd = useMemo(() => {
    return allUsers
      .filter((u) => !deptMemberIds.has(u.id))
      .sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? ""));
  }, [allUsers, deptMemberIds]);

  const pendingAny =
    changeDept.isPending ||
    createUnit.isPending ||
    deleteUnit.isPending ||
    updateUnit.isPending ||
    updateUserFields.isPending;

  async function handleAddMember() {
    setAddMemberError(null);
    if (!selectedUserId) return;
    try {
      await changeDept.mutateAsync({
        userId: selectedUserId,
        payload: { department: id },
      });
      setSelectedUserId("");
      setAddMemberOpen(false);
    } catch (e: unknown) {
      setAddMemberError(e instanceof Error ? e.message : "Failed to add member.");
    }
  }

  async function handleRemoveMember(userId: string) {
    try {
      await changeDept.mutateAsync({
        userId,
        payload: { department: null },
      });
    } catch {
      // errors are surfaced via toast in api-client (if any); keep UI simple
    }
  }

  async function handleCreateUnit() {
    setUnitError(null);
    const name = unitName.trim();
    if (!name) return;
    try {
      await createUnit.mutateAsync({
        name,
        department_id: id,
      });
      setUnitName("");
      setCreateUnitOpen(false);
    } catch (e: unknown) {
      setUnitError(e instanceof Error ? e.message : "Failed to create unit.");
    }
  }

  async function handleEditUnitSave() {
    if (!editUnitTarget) return;
    setUnitError(null);
    const name = unitName.trim();
    if (!name) return;
    try {
      await updateUnit.mutateAsync({ unitId: editUnitTarget.id, payload: { name } });
      setEditUnitTarget(null);
      setUnitName("");
    } catch (e: unknown) {
      setUnitError(e instanceof Error ? e.message : "Failed to update unit.");
    }
  }

  async function handleDeleteUnitConfirm() {
    if (!deleteUnitTarget) return;
    try {
      await deleteUnit.mutateAsync(deleteUnitTarget.id);
      setDeleteUnitTarget(null);
    } catch {
      // keep minimal
    }
  }

  async function handleAssignToUnit() {
    setAssignError(null);
    if (!assignOpen?.unit?.id || !assignUserId) return;
    const unitId = assignOpen.unit.id;
    try {
      await updateUserFields.mutateAsync({ userId: assignUserId, payload: { unit: unitId } });
      setAssignUserId("");
      setAssignOpen(null);
    } catch (e: unknown) {
      setAssignError(e instanceof Error ? e.message : "Failed to assign user to unit.");
    }
  }

  async function handleRemoveFromUnit(userId: string) {
    try {
      await updateUserFields.mutateAsync({ userId, payload: { unit: null } });
    } catch {
      // keep minimal
    }
  }

  async function handleAssignSupervisor() {
    setSupervisorError(null);
    if (!supervisorOpen?.unit?.id) return;
    try {
      await updateUnit.mutateAsync({
        unitId: supervisorOpen.unit.id,
        payload: { supervisor_id: supervisorUserId || null },
      });
      setSupervisorUserId("");
      setSupervisorOpen(null);
    } catch (e: unknown) {
      setSupervisorError(
        e instanceof Error ? e.message : "Failed to update supervisor."
      );
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <PageHeader title="Department" />
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
          {error instanceof Error ? error.message : "Department not found."}
        </div>
      </div>
    );
  }

  const { department, members, units } = data;
  const lineManager = department.line_manager;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-2">
        <Link
          href="/users"
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
      </div>

      <PageHeader title={department.name} />

      <div className="mx-auto max-w-4xl space-y-6">
        {/* Department summary */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {department.name}
              </h2>
              {department.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {department.description}
                </p>
              )}
              {lineManager && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Line manager:
                  </span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {getLineManagerDisplay(lineManager)}
                  </span>
                  {typeof lineManager === "object" && (
                    <span className="text-xs text-muted-foreground">
                      {lineManager.email}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-lg bg-muted/50 px-4 py-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {members.length} member{members.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => setTab("members")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition ${
                tab === "members"
                  ? "border-b-2 border-primary bg-primary/5 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4" />
              Members ({members.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("units")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition ${
                tab === "units"
                  ? "border-b-2 border-primary bg-primary/5 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Building2 className="h-4 w-4" />
              Units ({units.length})
            </button>
            <div className="ml-auto flex items-center gap-2 px-3">
              {tab === "members" && (
                <button
                  type="button"
                  onClick={() => {
                    setAddMemberError(null);
                    setAddMemberOpen(true);
                  }}
                  disabled={pendingAny}
                  className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  <UserPlus className="h-4 w-4" />
                  Add member
                </button>
              )}
              {tab === "units" && (
                <button
                  type="button"
                  onClick={() => {
                    setUnitError(null);
                    setUnitName("");
                    setCreateUnitOpen(true);
                  }}
                  disabled={pendingAny}
                  className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  Create unit
                </button>
              )}
            </div>
          </div>

          <div className="p-4">
            {tab === "members" && (
              <div className="overflow-x-auto">
                {members.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No members in this department.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                          Email
                        </th>
                        <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m) => (
                        <tr
                          key={m.id}
                          className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-foreground">
                            {getMemberName(m)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {m.email}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(m.id)}
                                disabled={pendingAny}
                                className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
                                aria-label={`Remove ${getMemberName(m)} from department`}
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {tab === "units" && (
              <div className="space-y-4">
                {units.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No units in this department.
                  </p>
                ) : (
                  units.map((u) => (
                    <div
                      key={u.id}
                      className="rounded-lg border border-border p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <Link
                            href={`/units/${u.id}`}
                            className="block w-fit cursor-pointer font-medium text-foreground hover:text-primary hover:underline"
                          >
                            {u.name}
                          </Link>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Supervisor:{" "}
                            {u.supervisor ? (
                              <span className="font-medium text-foreground">
                                {getMemberName(u.supervisor)}
                              </span>
                            ) : (
                              <span className="italic opacity-60">None</span>
                            )}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {u.members?.length ?? 0} member
                            {(u.members?.length ?? 0) !== 1 ? "s" : ""}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setSupervisorError(null);
                              setSupervisorUserId(u.supervisor?.id ?? "");
                              setSupervisorOpen({ unit: u });
                            }}
                            disabled={pendingAny}
                            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold transition hover:bg-muted disabled:opacity-60"
                            aria-label={`Assign supervisor for unit ${u.name}`}
                          >
                            <Shield className="h-4 w-4" />
                            {u.supervisor ? "Change supervisor" : "Assign supervisor"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAssignError(null);
                              setAssignUserId("");
                              setAssignOpen({ unit: u });
                            }}
                            disabled={pendingAny}
                            className="rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold transition hover:bg-muted disabled:opacity-60"
                          >
                            Add member to unit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setUnitError(null);
                              setEditUnitTarget(u);
                              setUnitName(u.name);
                            }}
                            disabled={pendingAny}
                            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold transition hover:bg-muted disabled:opacity-60"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteUnitTarget(u)}
                            disabled={pendingAny}
                            className="inline-flex items-center gap-2 rounded-md bg-destructive px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>

                      {!!u.members?.length && (
                        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border bg-muted/30">
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                                  Member
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                                  Email
                                </th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {u.members.map((m) => (
                                <tr
                                  key={m.id}
                                  className="border-b border-border last:border-0"
                                >
                                  <td className="px-3 py-2 font-medium text-foreground">
                                    {getMemberName(m)}
                                  </td>
                                  <td className="px-3 py-2 text-muted-foreground">
                                    {m.email}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveFromUnit(m.id)}
                                      disabled={pendingAny}
                                      className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
                                      aria-label={`Remove ${getMemberName(m)} from unit ${u.name}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add member modal */}
      {addMemberOpen && (
        <Overlay onClose={() => setAddMemberOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Add member
            </h2>
            {addMemberError && (
              <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {addMemberError}
              </p>
            )}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-muted-foreground">
                User
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className={cn(
                  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                )}
                aria-label="Select user to add"
              >
                <option value="">
                  {usersLoading ? "Loading users…" : "Select a user"}
                </option>
                {eligibleUsersToAdd.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || getMemberName(u)} — {u.email}
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddMemberOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddMember}
                  disabled={!selectedUserId || pendingAny}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* Create/Edit unit modal */}
      {(createUnitOpen || editUnitTarget) && (
        <Overlay
          onClose={() => {
            setCreateUnitOpen(false);
            setEditUnitTarget(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              {editUnitTarget ? "Edit unit" : "Create unit"}
            </h2>
            {unitError && (
              <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {unitError}
              </p>
            )}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-muted-foreground">
                Name
              </label>
              <input
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                placeholder="Unit A"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreateUnitOpen(false);
                    setEditUnitTarget(null);
                    setUnitName("");
                  }}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={editUnitTarget ? handleEditUnitSave : handleCreateUnit}
                  disabled={!unitName.trim() || pendingAny}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  {editUnitTarget ? "Save" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* Delete unit confirm */}
      {deleteUnitTarget && (
        <Overlay onClose={() => setDeleteUnitTarget(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <h2 className="mt-3 text-base font-semibold text-foreground">
              Delete unit?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {deleteUnitTarget.name}
              </span>{" "}
              will be permanently removed.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleteUnitTarget(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUnitConfirm}
                disabled={pendingAny}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Assign member to unit */}
      {assignOpen && (
        <Overlay onClose={() => setAssignOpen(null)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Add member to {assignOpen.unit.name}
            </h2>
            {assignError && (
              <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {assignError}
              </p>
            )}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-muted-foreground">
                Member
              </label>
              <select
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                aria-label="Select member to add to unit"
              >
                <option value="">
                  {members.length ? "Select a member" : "No members"}
                </option>
                {members
                  .filter((m) => {
                    const unitMemberIds = new Set(
                      (assignOpen.unit.members ?? []).map((x) => x.id)
                    );
                    return !unitMemberIds.has(m.id);
                  })
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {getMemberName(m)} — {m.email}
                    </option>
                  ))}
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignOpen(null)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAssignToUnit}
                  disabled={!assignUserId || pendingAny}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* Assign/remove supervisor */}
      {supervisorOpen && (
        <Overlay onClose={() => setSupervisorOpen(null)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Supervisor for {supervisorOpen.unit.name}
            </h2>
            {supervisorError && (
              <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {supervisorError}
              </p>
            )}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-muted-foreground">
                Supervisor
              </label>
              <select
                value={supervisorUserId}
                onChange={(e) => setSupervisorUserId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                aria-label="Select supervisor"
              >
                <option value="">None</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {getMemberName(m)} — {m.email}
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSupervisorOpen(null)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAssignSupervisor}
                  disabled={pendingAny}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  Save
                </button>
              </div>
              {supervisorOpen.unit.supervisor && (
                <button
                  type="button"
                  onClick={() => {
                    setSupervisorUserId("");
                    void handleAssignSupervisor();
                  }}
                  disabled={pendingAny}
                  className="w-full rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/15 disabled:opacity-60"
                >
                  Remove supervisor
                </button>
              )}
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}
