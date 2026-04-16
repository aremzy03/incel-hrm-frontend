"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useDepartmentDetail,
  useDepartments,
  useUpdateDepartment,
  useAssignLineManager,
  useRemoveLineManager,
  useBulkAddDepartmentMembers,
  useBulkRemoveDepartmentMembers,
} from "@/lib/api/departments";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { ArrowLeft, Users, Building2, Loader2, Plus, Trash2, Pencil, UserPlus, Shield, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUsers, useChangeUserDepartment } from "@/lib/api/users";
import { apiPatch } from "@/lib/api-client";
import { useBulkAddMembersToUnit, useBulkAddUnitMembers, useCreateUnit, useDeleteUnit } from "@/lib/api/units";
import type {
  BulkMembershipFailureCode,
  BulkMembershipResponse,
  Unit,
  UnitUpdatePayload,
  User as UserType,
  UserUpdatePayload,
} from "@/lib/types/auth";
import { BulkUserPicker } from "@/components/hrm/users/BulkUserPicker";
import { Pagination } from "@/components/hrm/ui/Pagination";
import { BulkResultPanel } from "@/components/hrm/users/BulkResultPanel";

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
  const [tab, setTab] = useState<"manage" | "members" | "units">("members");

  const { data: usersData, isLoading: usersLoading } = useUsers();
  const allUsers = usersData?.results ?? [];

  const changeDept = useChangeUserDepartment();
  const bulkAddDeptMembers = useBulkAddDepartmentMembers(id);
  const bulkRemoveDeptMembers = useBulkRemoveDepartmentMembers(id);
  const bulkAddMembersToUnit = useBulkAddMembersToUnit();
  const createUnit = useCreateUnit();
  const deleteUnit = useDeleteUnit();
  const updateDept = useUpdateDepartment(id);
  const assignLineManager = useAssignLineManager(id);
  const removeLineManager = useRemoveLineManager(id);
  const qc = useQueryClient();

  const membersSorted = useMemo(() => {
    const members = data?.members ?? [];
    return members.slice().sort((a, b) => {
      const an = `${a.first_name} ${a.last_name}`.trim();
      const bn = `${b.first_name} ${b.last_name}`.trim();
      return an.localeCompare(bn);
    });
  }, [data?.members]);

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
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [addMemberSearch, setAddMemberSearch] = useState("");
  const [addMemberSelectedUserIds, setAddMemberSelectedUserIds] = useState<string[]>([]);
  const [addMemberClearConflicts, setAddMemberClearConflicts] = useState(false);
  const [addMemberResult, setAddMemberResult] = useState<BulkMembershipResponse | null>(null);

  const [createUnitOpen, setCreateUnitOpen] = useState(false);
  const [unitName, setUnitName] = useState("");
  const [unitError, setUnitError] = useState<string | null>(null);

  const [editUnitTarget, setEditUnitTarget] = useState<Unit | null>(null);
  const [deleteUnitTarget, setDeleteUnitTarget] = useState<Unit | null>(null);

  const [assignOpen, setAssignOpen] = useState<{
    unit: (Unit & { members?: { id: string; first_name: string; last_name: string; email: string }[] });
  } | null>(null);
  const bulkAddUnitMembers = useBulkAddUnitMembers(assignOpen?.unit?.id ?? "");

  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSearch, setAssignSearch] = useState("");
  const [assignSelectedUserIds, setAssignSelectedUserIds] = useState<string[]>([]);
  const [assignClearConflicts, setAssignClearConflicts] = useState(false);
  const [assignResult, setAssignResult] = useState<BulkMembershipResponse | null>(null);

  const [supervisorOpen, setSupervisorOpen] = useState<{
    unit: Unit;
  } | null>(null);
  const [supervisorUserId, setSupervisorUserId] = useState("");
  const [supervisorError, setSupervisorError] = useState<string | null>(null);

  const [deptEditName, setDeptEditName] = useState("");
  const [deptEditDescription, setDeptEditDescription] = useState("");
  const [deptEditError, setDeptEditError] = useState<string | null>(null);

  const [lineManagerUserId, setLineManagerUserId] = useState("");
  const [lineManagerError, setLineManagerError] = useState<string | null>(null);

  const departments = deptsData?.results ?? [];
  void departments;

  const pageSize = 20;
  const [deptMembersPage, setDeptMembersPage] = useState(1);
  const [deptSelectedUserIds, setDeptSelectedUserIds] = useState<string[]>([]);
  const [applyUnitModalOpen, setApplyUnitModalOpen] = useState(false);
  const [applyUnitSelectedUnitId, setApplyUnitSelectedUnitId] = useState("");
  const [applyUnitClearConflicts, setApplyUnitClearConflicts] = useState(false);
  const [applyUnitModalError, setApplyUnitModalError] = useState<string | null>(null);
  const [membersBulkResult, setMembersBulkResult] = useState<BulkMembershipResponse | null>(null);
  const [membersSearch, setMembersSearch] = useState("");
  const [membersUnitFilter, setMembersUnitFilter] = useState<"" | "none" | string>("");

  const deptMemberIds = useMemo(() => {
    const members = data?.members ?? [];
    return new Set(members.map((m) => m.id));
  }, [data?.members]);

  const userUnitById = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of data?.units ?? []) {
      for (const m of u.members ?? []) {
        map.set(m.id, u.id);
      }
    }
    return map;
  }, [data?.units]);

  const filteredDepartmentMembers = useMemo(() => {
    const q = membersSearch.trim().toLowerCase();
    return membersSorted.filter((m) => {
      const matchesSearch =
        !q ||
        `${getMemberName(m)} ${m.email}`.toLowerCase().includes(q);
      const unitId = userUnitById.get(m.id) ?? "";
      const matchesUnit =
        !membersUnitFilter ||
        (membersUnitFilter === "none" ? !unitId : unitId === membersUnitFilter);
      return matchesSearch && matchesUnit;
    });
  }, [membersSearch, membersSorted, membersUnitFilter, userUnitById]);

  const eligibleUsersToAdd = useMemo(() => {
    return allUsers
      .filter((u) => !deptMemberIds.has(u.id))
      .sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? ""));
  }, [allUsers, deptMemberIds]);

  const pendingAny =
    changeDept.isPending ||
    bulkAddDeptMembers.isPending ||
    bulkRemoveDeptMembers.isPending ||
    bulkAddMembersToUnit.isPending ||
    bulkAddUnitMembers.isPending ||
    createUnit.isPending ||
    deleteUnit.isPending ||
    updateUnit.isPending ||
    updateUserFields.isPending ||
    updateDept.isPending ||
    assignLineManager.isPending ||
    removeLineManager.isPending;

  async function handleAddMember() {
    setAddMemberError(null);
    setAddMemberResult(null);
    if (addMemberSelectedUserIds.length === 0) return;
    try {
      const res = await bulkAddDeptMembers.mutateAsync({
        user_ids: addMemberSelectedUserIds,
        dry_run: false,
        clear_conflicts: addMemberClearConflicts,
      });
      setAddMemberResult(res);
      setAddMemberSelectedUserIds([]);
      setAddMemberSearch("");
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

  function toggleDeptSelected(userId: string, next: boolean) {
    setDeptSelectedUserIds((prev) => {
      const set = new Set(prev);
      if (next) set.add(userId);
      else set.delete(userId);
      return Array.from(set);
    });
  }

  function openApplyUnitModal() {
    setApplyUnitModalError(null);
    setApplyUnitSelectedUnitId("");
    setApplyUnitClearConflicts(false);
    setApplyUnitModalOpen(true);
  }

  async function handleConfirmApplyUnitFromModal() {
    setMembersBulkResult(null);
    setApplyUnitModalError(null);
    if (deptSelectedUserIds.length === 0) {
      setApplyUnitModalError("No members selected.");
      return;
    }
    if (!applyUnitSelectedUnitId) {
      setApplyUnitModalError("Select a unit to assign.");
      return;
    }
    try {
      const res = await bulkAddMembersToUnit.mutateAsync({
        unitId: applyUnitSelectedUnitId,
        payload: {
          user_ids: deptSelectedUserIds,
          dry_run: false,
          clear_conflicts: applyUnitClearConflicts,
        },
      });
      setMembersBulkResult(res);
      setApplyUnitModalOpen(false);
      if (res.failed.length === 0) {
        setDeptSelectedUserIds([]);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to add members to unit.";
      setMembersBulkResult({
        target: { department_id: id },
        succeeded_user_ids: [],
        failed: deptSelectedUserIds.map((uid) => ({
          user_id: uid,
          code: "not_found" as BulkMembershipFailureCode,
          error: msg,
        })),
      });
      setApplyUnitModalOpen(false);
    }
  }

  async function handleBulkRemoveFromDepartment() {
    setMembersBulkResult(null);
    if (deptSelectedUserIds.length === 0) return;
    try {
      const res = await bulkRemoveDeptMembers.mutateAsync({
        user_ids: deptSelectedUserIds,
        dry_run: false,
      });
      setMembersBulkResult(res);
      setDeptSelectedUserIds([]);
      setDeptMembersPage(1);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to remove members.";
      setMembersBulkResult({
        target: { department_id: id },
        succeeded_user_ids: [],
        failed: deptSelectedUserIds.map((uid) => ({
          user_id: uid,
          code: "not_in_department" as BulkMembershipFailureCode,
          error: msg,
        })),
      });
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
    setAssignResult(null);
    if (!assignOpen?.unit?.id || assignSelectedUserIds.length === 0) return;
    try {
      const res = await bulkAddUnitMembers.mutateAsync({
        user_ids: assignSelectedUserIds,
        dry_run: false,
        clear_conflicts: assignClearConflicts,
      });
      setAssignResult(res);
      setAssignSelectedUserIds([]);
      setAssignSearch("");
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
  const currentLineManagerId =
    typeof lineManager === "string" ? lineManager : lineManager?.id ?? "";

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
              onClick={() => setTab("manage")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition ${
                tab === "manage"
                  ? "border-b-2 border-primary bg-primary/5 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Shield className="h-4 w-4" />
              Manage
            </button>
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
            {tab === "manage" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Department settings
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Update department details and line manager.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDeptEditError(null);
                        setLineManagerError(null);
                        setDeptEditName(department.name ?? "");
                        setDeptEditDescription(department.description ?? "");
                        setLineManagerUserId(currentLineManagerId);
                      }}
                      disabled={pendingAny}
                      className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold transition hover:bg-muted disabled:opacity-60"
                    >
                      <Pencil className="h-4 w-4" />
                      Load current
                    </button>
                  </div>

                  {deptEditError && (
                    <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {deptEditError}
                    </p>
                  )}
                  {lineManagerError && (
                    <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {lineManagerError}
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Name
                      </label>
                      <input
                        value={deptEditName}
                        onChange={(e) => setDeptEditName(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                        placeholder={department.name}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Line manager
                      </label>
                      <select
                        value={lineManagerUserId}
                        onChange={(e) => setLineManagerUserId(e.target.value)}
                        className={cn(
                          "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                        )}
                      >
                        <option value="">None</option>
                        {membersSorted.map((m) => (
                          <option key={m.id} value={m.id}>
                            {getMemberName(m)} — {m.email}
                          </option>
                        ))}
                      </select>
                      {membersSorted.length === 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Add members first to assign a line manager.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={deptEditDescription}
                      onChange={(e) => setDeptEditDescription(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                      placeholder="Optional description…"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      disabled={pendingAny}
                      onClick={async () => {
                        setDeptEditError(null);
                        try {
                          await updateDept.mutateAsync({
                            name: (deptEditName || department.name || "").trim(),
                            description: deptEditDescription?.trim() || "",
                          });
                          qc.invalidateQueries({ queryKey: ["department-detail", id] });
                        } catch (e: unknown) {
                          setDeptEditError(
                            e instanceof Error ? e.message : "Failed to update department."
                          );
                        }
                      }}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                    >
                      Save details
                    </button>

                    {lineManagerUserId ? (
                      <button
                        type="button"
                        disabled={pendingAny}
                        onClick={async () => {
                          setLineManagerError(null);
                          try {
                            await assignLineManager.mutateAsync({ user_id: lineManagerUserId });
                            qc.invalidateQueries({ queryKey: ["department-detail", id] });
                          } catch (e: unknown) {
                            setLineManagerError(
                              e instanceof Error ? e.message : "Failed to assign line manager."
                            );
                          }
                        }}
                        className="rounded-lg border border-border px-4 py-2 text-sm font-semibold transition hover:bg-muted disabled:opacity-60"
                      >
                        Save line manager
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={pendingAny || !currentLineManagerId}
                        onClick={async () => {
                          setLineManagerError(null);
                          try {
                            await removeLineManager.mutateAsync();
                            qc.invalidateQueries({ queryKey: ["department-detail", id] });
                          } catch (e: unknown) {
                            setLineManagerError(
                              e instanceof Error ? e.message : "Failed to remove line manager."
                            );
                          }
                        }}
                        className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/15 disabled:opacity-60"
                      >
                        Remove line manager
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            {tab === "members" && (
              <div className="space-y-3">
                {membersSorted.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No members in this department.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-1 flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={openApplyUnitModal}
                          disabled={
                            pendingAny ||
                            deptSelectedUserIds.length === 0 ||
                            units.length === 0
                          }
                          title={
                            units.length === 0
                              ? "Create a unit in this department first"
                              : undefined
                          }
                          className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                        >
                          Add To Unit
                        </button>
                        <button
                          type="button"
                          onClick={handleBulkRemoveFromDepartment}
                          disabled={pendingAny || deptSelectedUserIds.length === 0}
                          title="Remove selected members from this department"
                          aria-label="Remove selected members from this department"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/15 disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                          Remove
                        </button>

                        <div className="relative w-full sm:w-64">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <input
                            value={membersSearch}
                            onChange={(e) => {
                              setMembersSearch(e.target.value);
                              setDeptMembersPage(1);
                            }}
                            placeholder="Search members…"
                            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring transition"
                          />
                        </div>

                        <select
                          value={membersUnitFilter}
                          onChange={(e) => {
                            setMembersUnitFilter(
                              e.target.value as "" | "none" | string
                            );
                            setDeptMembersPage(1);
                          }}
                          className="w-full sm:w-56 rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring transition"
                          aria-label="Filter by unit"
                        >
                          <option value="">All units</option>
                          <option value="none">No unit</option>
                          {units.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Pagination
                        page={deptMembersPage}
                        pageSize={pageSize}
                        total={filteredDepartmentMembers.length}
                        onPageChange={setDeptMembersPage}
                      />
                    </div>

                    <BulkResultPanel title="Bulk action result" result={membersBulkResult} />

                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                              Select
                            </th>
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
                          {filteredDepartmentMembers
                            .slice((deptMembersPage - 1) * pageSize, deptMembersPage * pageSize)
                            .map((m) => {
                              const checked = deptSelectedUserIds.includes(m.id);
                              return (
                                <tr
                                  key={m.id}
                                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                                >
                                  <td className="px-4 py-3">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => toggleDeptSelected(m.id, e.target.checked)}
                                      disabled={pendingAny}
                                      className="h-4 w-4 rounded border-border accent-primary"
                                      aria-label={`Select ${getMemberName(m)}`}
                                    />
                                  </td>
                                  <td className="px-4 py-3 font-medium text-foreground">
                                    {getMemberName(m)}
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveMember(m.id)}
                                        disabled={pendingAny}
                                        className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Remove
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>

                    <Pagination
                      page={deptMembersPage}
                      pageSize={pageSize}
                      total={filteredDepartmentMembers.length}
                      onPageChange={setDeptMembersPage}
                      className="pt-2"
                    />
                  </>
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
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Add member
            </h2>
            {addMemberError && (
              <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {addMemberError}
              </p>
            )}
            {addMemberResult && (
              <div className="mb-4 space-y-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Added:</span>{" "}
                  {addMemberResult.succeeded_user_ids.length}
                  {addMemberResult.failed.length > 0 ? (
                    <>
                      {" "}
                      <span className="text-muted-foreground">•</span>{" "}
                      <span className="font-semibold">Failed:</span>{" "}
                      {addMemberResult.failed.length}
                    </>
                  ) : null}
                </p>
                {addMemberResult.failed.length > 0 && (
                  <ul className="max-h-32 overflow-auto text-xs text-muted-foreground">
                    {addMemberResult.failed.map((f) => (
                      <li key={f.user_id} className="py-1">
                        <span className="font-semibold text-foreground">{f.code}</span>{" "}
                        <span className="text-muted-foreground">({f.user_id}):</span>{" "}
                        {f.error}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="space-y-3">
              <BulkUserPicker
                users={eligibleUsersToAdd}
                selectedUserIds={addMemberSelectedUserIds}
                onChangeSelectedUserIds={setAddMemberSelectedUserIds}
                search={addMemberSearch}
                onChangeSearch={setAddMemberSearch}
                disabled={usersLoading || pendingAny}
                label="Users"
                emptyText={usersLoading ? "Loading users…" : "No eligible users."}
              />

              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={addMemberClearConflicts}
                  onChange={(e) => setAddMemberClearConflicts(e.target.checked)}
                  disabled={pendingAny}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm">
                  Clear conflicts automatically (move/clear unit/team if needed)
                </span>
              </label>
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
                  disabled={addMemberSelectedUserIds.length === 0 || pendingAny}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  Add members
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {applyUnitModalOpen && (
        <Overlay
          onClose={() => {
            setApplyUnitModalOpen(false);
            setApplyUnitModalError(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-semibold text-foreground">
              Add to Unit
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Choose which unit to add{" "}
              <span className="font-medium text-foreground">
                {deptSelectedUserIds.length}
              </span>{" "}
              selected member{deptSelectedUserIds.length !== 1 ? "s" : ""} to.
            </p>
            {units.length === 0 ? (
              <p className="mb-4 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                This department has no units yet. Create one under the Units tab,
                then try again.
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="apply-unit-select"
                    className="mb-1.5 block text-xs font-medium text-muted-foreground"
                  >
                    Unit
                  </label>
                  <select
                    id="apply-unit-select"
                    value={applyUnitSelectedUnitId}
                    onChange={(e) => {
                      setApplyUnitSelectedUnitId(e.target.value);
                      setApplyUnitModalError(null);
                    }}
                    disabled={pendingAny}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                  >
                    <option value="">Select a unit…</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={applyUnitClearConflicts}
                    onChange={(e) => setApplyUnitClearConflicts(e.target.checked)}
                    disabled={pendingAny}
                    className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="text-muted-foreground">
                    Clear conflicting memberships (e.g. other unit/team) when the
                    API allows it.
                  </span>
                </label>
              </div>
            )}
            {applyUnitModalError && (
              <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {applyUnitModalError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setApplyUnitModalOpen(false);
                  setApplyUnitModalError(null);
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApplyUnitFromModal}
                disabled={
                  pendingAny ||
                  units.length === 0 ||
                  !applyUnitSelectedUnitId ||
                  deptSelectedUserIds.length === 0
                }
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                Add To Unit
              </button>
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
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Add member to {assignOpen.unit.name}
            </h2>
            {assignError && (
              <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {assignError}
              </p>
            )}
            {assignResult && (
              <div className="mb-4 space-y-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Added:</span>{" "}
                  {assignResult.succeeded_user_ids.length}
                  {assignResult.failed.length > 0 ? (
                    <>
                      {" "}
                      <span className="text-muted-foreground">•</span>{" "}
                      <span className="font-semibold">Failed:</span>{" "}
                      {assignResult.failed.length}
                    </>
                  ) : null}
                </p>
                {assignResult.failed.length > 0 && (
                  <ul className="max-h-32 overflow-auto text-xs text-muted-foreground">
                    {assignResult.failed.map((f) => (
                      <li key={f.user_id} className="py-1">
                        <span className="font-semibold text-foreground">{f.code}</span>{" "}
                        <span className="text-muted-foreground">({f.user_id}):</span>{" "}
                        {f.error}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="space-y-3">
              <BulkUserPicker
                users={members.filter((m) => {
                  const unitMemberIds = new Set((assignOpen.unit.members ?? []).map((x) => x.id));
                  return !unitMemberIds.has(m.id);
                })}
                selectedUserIds={assignSelectedUserIds}
                onChangeSelectedUserIds={setAssignSelectedUserIds}
                search={assignSearch}
                onChangeSearch={setAssignSearch}
                disabled={pendingAny}
                label="Members"
                emptyText={members.length ? "No eligible members." : "No members."}
              />

              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={assignClearConflicts}
                  onChange={(e) => setAssignClearConflicts(e.target.checked)}
                  disabled={pendingAny}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm">
                  Clear conflicts automatically (move/clear department/team if needed)
                </span>
              </label>
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
                  disabled={assignSelectedUserIds.length === 0 || pendingAny}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  Add members
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
