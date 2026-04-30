"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Loader2,
  Plus,
  Search,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import {
  useAssignLineManager,
  useBulkAddDepartmentMembers,
  useBulkRemoveDepartmentMembers,
  useDepartmentDetail,
  useRemoveLineManager,
} from "@/lib/api/departments";
import { useBulkAddMembersToUnit, useCreateUnit, useDeleteUnit } from "@/lib/api/units";
import { BulkResultPanel } from "@/components/hrm/users/BulkResultPanel";
import { BulkUserPicker } from "@/components/hrm/users/BulkUserPicker";
import { Pagination } from "@/components/hrm/ui/Pagination";
import { apiGet } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type {
  BulkMembershipFailureCode,
  BulkMembershipResponse,
  PaginatedResponse,
  User,
  UserMinimal,
} from "@/lib/types/auth";

function memberName(m: { first_name: string; last_name: string }) {
  return [m.first_name, m.last_name].filter(Boolean).join(" ") || "—";
}

function lineManagerDisplay(
  lm: string | { first_name: string; last_name: string; email: string } | null
) {
  if (!lm) return "—";
  if (typeof lm === "string") return lm;
  return `${lm.first_name} ${lm.last_name}`.trim() || lm.email;
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

function normalizeUsers(
  data: PaginatedResponse<User> | User[] | null | undefined
): User[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.results ?? [];
}

export default function DepartmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const qc = useQueryClient();
  const { data, isLoading, error } = useDepartmentDetail(id);

  const bulkAddToDepartment = useBulkAddDepartmentMembers(id);
  const bulkRemoveFromDepartment = useBulkRemoveDepartmentMembers(id);
  const bulkAddMembersToUnit = useBulkAddMembersToUnit();
  const createUnit = useCreateUnit();
  const deleteUnit = useDeleteUnit();
  const assignLineManager = useAssignLineManager(id);
  const removeLineManager = useRemoveLineManager(id);

  const [tab, setTab] = useState<"members" | "units" | "manage">("members");

  const pageSize = 20;
  const [membersPage, setMembersPage] = useState(1);
  const [membersSearch, setMembersSearch] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const [bulkResult, setBulkResult] = useState<BulkMembershipResponse | null>(
    null
  );

  // Bulk add to department modal
  const [addDeptOpen, setAddDeptOpen] = useState(false);
  const [addDeptSearch, setAddDeptSearch] = useState("");
  const [addDeptSelectedIds, setAddDeptSelectedIds] = useState<string[]>([]);
  const [addDeptClearConflicts, setAddDeptClearConflicts] = useState(false);
  const [addDeptError, setAddDeptError] = useState<string | null>(null);

  // Bulk add selected members to a unit modal
  const [addToUnitOpen, setAddToUnitOpen] = useState(false);
  const [addToUnitTargetId, setAddToUnitTargetId] = useState("");
  const [addToUnitClearConflicts, setAddToUnitClearConflicts] = useState(false);
  const [addToUnitError, setAddToUnitError] = useState<string | null>(null);

  // Line manager modal
  const [lineManagerOpen, setLineManagerOpen] = useState(false);
  const [lineManagerUserId, setLineManagerUserId] = useState("");
  const [lineManagerError, setLineManagerError] = useState<string | null>(null);

  // Unit create/delete controls (Units tab)
  const [unitCreateOpen, setUnitCreateOpen] = useState(false);
  const [unitCreateName, setUnitCreateName] = useState("");
  const [unitCreateError, setUnitCreateError] = useState<string | null>(null);
  const [unitDeleteTarget, setUnitDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Pull a larger set of users for the add-to-department picker.
  // (Backend typically supports `page_size`; if not, it will just return the default page.)
  const { data: allUsersRaw } = useQuery({
    queryKey: ["users", "all"],
    queryFn: () =>
      apiGet<PaginatedResponse<User> | User[]>("users/?page_size=1000"),
    enabled: addDeptOpen,
  });
  const allUsers = normalizeUsers(allUsersRaw);

  const pendingAny =
    bulkAddToDepartment.isPending ||
    bulkRemoveFromDepartment.isPending ||
    bulkAddMembersToUnit.isPending ||
    createUnit.isPending ||
    deleteUnit.isPending ||
    assignLineManager.isPending ||
    removeLineManager.isPending;

  const department = data?.department;
  const members = data?.members ?? [];
  const units = data?.units ?? [];

  const filteredMembers = useMemo(() => {
    const q = membersSearch.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      `${memberName(m)} ${m.email}`.toLowerCase().includes(q)
    );
  }, [members, membersSearch]);

  const pagedMembers = useMemo(() => {
    const start = (membersPage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, membersPage]);

  const addDeptCandidates = useMemo(() => {
    // Only show users not already in this department (best-effort).
    const currentIds = new Set(members.map((m) => m.id));
    return allUsers.filter((u) => !currentIds.has(u.id));
  }, [allUsers, members]);

  function toggleSelected(userId: string, next: boolean) {
    setSelectedMemberIds((prev) => {
      const s = new Set(prev);
      if (next) s.add(userId);
      else s.delete(userId);
      return Array.from(s);
    });
  }

  async function handleConfirmAddToDepartment() {
    setAddDeptError(null);
    setBulkResult(null);
    if (addDeptSelectedIds.length === 0) {
      setAddDeptError("Select at least one user.");
      return;
    }
    try {
      const res = await bulkAddToDepartment.mutateAsync({
        user_ids: addDeptSelectedIds,
        dry_run: false,
        clear_conflicts: addDeptClearConflicts,
      });
      setBulkResult(res);
      setAddDeptSelectedIds([]);
      setAddDeptSearch("");
      setAddDeptOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to add members.";
      setBulkResult({
        target: { department_id: id },
        succeeded_user_ids: [],
        failed: addDeptSelectedIds.map((uid) => ({
          user_id: uid,
          code: "not_found" as BulkMembershipFailureCode,
          error: msg,
        })),
      });
      setAddDeptOpen(false);
    }
  }

  async function handleBulkRemoveFromDepartment() {
    setBulkResult(null);
    if (selectedMemberIds.length === 0) return;
    try {
      const res = await bulkRemoveFromDepartment.mutateAsync({
        user_ids: selectedMemberIds,
        dry_run: false,
      });
      setBulkResult(res);
      setSelectedMemberIds([]);
      setMembersPage(1);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Failed to remove members from department.";
      setBulkResult({
        target: { department_id: id },
        succeeded_user_ids: [],
        failed: selectedMemberIds.map((uid) => ({
          user_id: uid,
          code: "not_in_department" as BulkMembershipFailureCode,
          error: msg,
        })),
      });
      setSelectedMemberIds([]);
      setMembersPage(1);
    }
  }

  async function handleConfirmAddSelectedToUnit() {
    setAddToUnitError(null);
    setBulkResult(null);
    if (selectedMemberIds.length === 0) {
      setAddToUnitError("No members selected.");
      return;
    }
    if (!addToUnitTargetId) {
      setAddToUnitError("Select a unit.");
      return;
    }
    try {
      const res = await bulkAddMembersToUnit.mutateAsync({
        unitId: addToUnitTargetId,
        payload: {
          user_ids: selectedMemberIds,
          dry_run: false,
          clear_conflicts: addToUnitClearConflicts,
        },
      });
      setBulkResult(res);
      setAddToUnitOpen(false);
      setAddToUnitTargetId("");
      setAddToUnitClearConflicts(false);
      if (res.failed.length === 0) setSelectedMemberIds([]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to add members to unit.";
      setBulkResult({
        target: { unit_id: addToUnitTargetId || "" },
        succeeded_user_ids: [],
        failed: selectedMemberIds.map((uid) => ({
          user_id: uid,
          code: "not_found" as BulkMembershipFailureCode,
          error: msg,
        })),
      });
      setAddToUnitOpen(false);
    }
  }

  async function handleSaveLineManager() {
    setLineManagerError(null);
    try {
      if (!lineManagerUserId) {
        await removeLineManager.mutateAsync();
      } else {
        await assignLineManager.mutateAsync({ user_id: lineManagerUserId });
      }
      setLineManagerOpen(false);
    } catch (e: unknown) {
      setLineManagerError(
        e instanceof Error ? e.message : "Failed to update line manager."
      );
    }
  }

  async function handleCreateUnit() {
    setUnitCreateError(null);
    const name = unitCreateName.trim();
    if (!name) return;
    try {
      await createUnit.mutateAsync({ name, department_id: id });
      await qc.invalidateQueries({ queryKey: ["department-detail", id] });
      setUnitCreateOpen(false);
      setUnitCreateName("");
    } catch (e: unknown) {
      setUnitCreateError(e instanceof Error ? e.message : "Failed to create unit.");
    }
  }

  async function handleConfirmDeleteUnit() {
    if (!unitDeleteTarget) return;
    try {
      await deleteUnit.mutateAsync(unitDeleteTarget.id);
      await qc.invalidateQueries({ queryKey: ["department-detail", id] });
      setUnitDeleteTarget(null);
    } catch {
      // keep minimal; deletion failures can be retried
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data || !department) {
    return (
      <div className="p-6">
        <PageHeader title="Department" />
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
          {error instanceof Error ? error.message : "Department not found."}
        </div>
        <div className="mt-4">
          <Link
            href="/departments"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Departments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-2">
        <Link
          href="/departments"
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Departments
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
              {department.description ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {department.description}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Line manager:
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {lineManagerDisplay(department.line_manager)}
                </span>
              </div>
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
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition",
                tab === "members"
                  ? "border-b-2 border-primary bg-primary/5 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Users className="h-4 w-4" />
              Members ({members.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("units")}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition",
                tab === "units"
                  ? "border-b-2 border-primary bg-primary/5 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Building2 className="h-4 w-4" />
              Units ({units.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("manage")}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition",
                tab === "manage"
                  ? "border-b-2 border-primary bg-primary/5 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Shield className="h-4 w-4" />
              Manage
            </button>
          </div>

          <div className="p-4">
            {tab === "members" && (
              <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAddDeptError(null);
                        setAddDeptSelectedIds([]);
                        setAddDeptSearch("");
                        setAddDeptClearConflicts(false);
                        setAddDeptOpen(true);
                      }}
                      disabled={pendingAny}
                      className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                    >
                      Add members
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddToUnitError(null);
                        setAddToUnitTargetId("");
                        setAddToUnitClearConflicts(false);
                        setAddToUnitOpen(true);
                      }}
                      disabled={pendingAny || selectedMemberIds.length === 0 || units.length === 0}
                      title={units.length === 0 ? "No units in this department" : undefined}
                      className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                    >
                      Add to unit
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkRemoveFromDepartment}
                      disabled={pendingAny || selectedMemberIds.length === 0}
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
                          setMembersPage(1);
                        }}
                        placeholder="Search members…"
                        className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring transition"
                      />
                    </div>
                  </div>
                  <Pagination
                    page={membersPage}
                    pageSize={pageSize}
                    total={filteredMembers.length}
                    onPageChange={setMembersPage}
                  />
                </div>

                <BulkResultPanel title="Bulk action result" result={bulkResult} />

                {!members.length ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No members in this department.
                  </p>
                ) : (
                  <>
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
                          </tr>
                        </thead>
                        <tbody>
                          {pagedMembers.map((m) => {
                            const checked = selectedMemberIds.includes(m.id);
                            return (
                              <tr
                                key={m.id}
                                className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                              >
                                <td className="px-4 py-3">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => toggleSelected(m.id, e.target.checked)}
                                    disabled={pendingAny}
                                    className="h-4 w-4 rounded border-border accent-primary"
                                    aria-label={`Select ${memberName(m)}`}
                                  />
                                </td>
                                <td className="px-4 py-3 font-medium text-foreground">
                                  {memberName(m)}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <Pagination
                      page={membersPage}
                      pageSize={pageSize}
                      total={filteredMembers.length}
                      onPageChange={setMembersPage}
                      className="pt-2"
                    />
                  </>
                )}
              </div>
            )}

            {tab === "units" && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    Create and manage units under this department.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setUnitCreateError(null);
                      setUnitCreateName("");
                      setUnitCreateOpen(true);
                    }}
                    disabled={pendingAny}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" />
                    Create unit
                  </button>
                </div>

                {!units.length ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No units in this department.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {units.map((u) => (
                      <li
                        key={u.id}
                        className="rounded-xl border border-border bg-background p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <Link
                              href={`/units/${u.id}`}
                              className="font-semibold text-foreground hover:underline"
                            >
                              {u.name}
                            </Link>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {u.members?.length ?? 0} member
                              {(u.members?.length ?? 0) !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setUnitDeleteTarget({ id: u.id, name: u.name })}
                              disabled={pendingAny}
                              title="Delete unit"
                              aria-label={`Delete unit ${u.name}`}
                              className="inline-flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/15 disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                              Delete
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {tab === "manage" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    Department settings
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Manage department line manager responsibility.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLineManagerError(null);
                        const lm = department.line_manager;
                        const lmId = typeof lm === "string" ? "" : (lm as UserMinimal | null)?.id ?? "";
                        setLineManagerUserId(lmId);
                        setLineManagerOpen(true);
                      }}
                      disabled={pendingAny}
                      className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold transition hover:bg-muted disabled:opacity-60"
                    >
                      <Shield className="h-4 w-4" />
                      {department.line_manager ? "Change line manager" : "Assign line manager"}
                    </button>

                    {department.line_manager && (
                      <button
                        type="button"
                        onClick={async () => {
                          setLineManagerError(null);
                          try {
                            await removeLineManager.mutateAsync();
                          } catch (e: unknown) {
                            setLineManagerError(
                              e instanceof Error ? e.message : "Failed to remove line manager."
                            );
                            setLineManagerOpen(true);
                          }
                        }}
                        disabled={pendingAny}
                        className="inline-flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/15 disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove line manager
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk add members to department modal */}
      {addDeptOpen && (
        <Overlay
          onClose={() => {
            setAddDeptOpen(false);
            setAddDeptError(null);
          }}
        >
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-semibold text-foreground">
              Add members to {department.name}
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Select one or more users to add to this department.
            </p>

            {addDeptError && (
              <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {addDeptError}
              </p>
            )}

            <div className="space-y-4">
              <BulkUserPicker
                users={addDeptCandidates}
                selectedUserIds={addDeptSelectedIds}
                onChangeSelectedUserIds={setAddDeptSelectedIds}
                search={addDeptSearch}
                onChangeSearch={setAddDeptSearch}
                disabled={pendingAny}
                label="All users"
                emptyText={allUsers.length ? "No matches." : "No users loaded."}
              />

              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={addDeptClearConflicts}
                  onChange={(e) => setAddDeptClearConflicts(e.target.checked)}
                  disabled={pendingAny}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-muted-foreground">
                  Clear conflicting memberships when the API allows it.
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddDeptOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={pendingAny || addDeptSelectedIds.length === 0}
                  onClick={handleConfirmAddToDepartment}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  Add members
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* Add selected members to unit modal */}
      {addToUnitOpen && (
        <Overlay
          onClose={() => {
            setAddToUnitOpen(false);
            setAddToUnitError(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-semibold text-foreground">
              Add to unit
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Move{" "}
              <span className="font-medium text-foreground">
                {selectedMemberIds.length}
              </span>{" "}
              selected member{selectedMemberIds.length !== 1 ? "s" : ""} into the
              unit you choose below.
            </p>

            {units.length === 0 ? (
              <p className="mb-4 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                This department has no units yet.
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="dept-add-to-unit-select"
                    className="mb-1.5 block text-xs font-medium text-muted-foreground"
                  >
                    Destination unit
                  </label>
                  <select
                    id="dept-add-to-unit-select"
                    value={addToUnitTargetId}
                    onChange={(e) => {
                      setAddToUnitTargetId(e.target.value);
                      setAddToUnitError(null);
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
                    checked={addToUnitClearConflicts}
                    onChange={(e) => setAddToUnitClearConflicts(e.target.checked)}
                    disabled={pendingAny}
                    className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="text-muted-foreground">
                    Clear conflicting memberships when the API allows it.
                  </span>
                </label>
              </div>
            )}

            {addToUnitError && (
              <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {addToUnitError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddToUnitOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAddSelectedToUnit}
                disabled={
                  pendingAny ||
                  selectedMemberIds.length === 0 ||
                  units.length === 0 ||
                  !addToUnitTargetId
                }
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                Add to unit
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Line manager modal */}
      {lineManagerOpen && (
        <Overlay onClose={() => setLineManagerOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Line manager
            </h2>
            {lineManagerError && (
              <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {lineManagerError}
              </p>
            )}

            <div className="space-y-3">
              <label className="block text-xs font-medium text-muted-foreground">
                Assign line manager
              </label>
              <select
                value={lineManagerUserId}
                onChange={(e) => setLineManagerUserId(e.target.value)}
                disabled={pendingAny}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                aria-label="Select line manager"
              >
                <option value="">None</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {memberName(m)} — {m.email}
                  </option>
                ))}
              </select>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLineManagerOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveLineManager}
                  disabled={pendingAny}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* Create unit modal */}
      {unitCreateOpen && (
        <Overlay onClose={() => setUnitCreateOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-semibold text-foreground">Create unit</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Add a new unit under <span className="font-medium text-foreground">{department.name}</span>.
            </p>

            {unitCreateError && (
              <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {unitCreateError}
              </p>
            )}

            <div className="space-y-3">
              <label className="block text-xs font-medium text-muted-foreground">
                Unit name
              </label>
              <input
                value={unitCreateName}
                onChange={(e) => setUnitCreateName(e.target.value)}
                disabled={pendingAny}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                placeholder="e.g. Engineering"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUnitCreateOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateUnit}
                  disabled={pendingAny || !unitCreateName.trim()}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* Delete unit confirm */}
      {unitDeleteTarget && (
        <Overlay onClose={() => setUnitDeleteTarget(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <h2 className="mt-3 text-base font-semibold text-foreground">
              Delete unit?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{unitDeleteTarget.name}</span>{" "}
              will be permanently removed.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setUnitDeleteTarget(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUnit}
                disabled={pendingAny}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}

