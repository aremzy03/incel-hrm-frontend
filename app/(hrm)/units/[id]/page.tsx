"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useBulkAddMembersToUnit,
  useBulkRemoveUnitMembers,
  useUnitDetail,
  useUnits,
  useDeleteUnit,
  useAssignUnitSupervisor,
  useRemoveUnitSupervisor,
  useUpdateUnit,
} from "@/lib/api/units";
import { useDepartmentMembers } from "@/lib/api/departments";
import {
  useBulkAddTeamMembers,
  useClearTeamLead,
  useCreateTeam,
  useDeleteTeam,
  useRemoveTeamMember,
  useSetTeamLead,
  useTeams,
  useUpdateTeam,
} from "@/lib/api/teams";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { ArrowLeft, Users, Loader2, Pencil, Trash2, Shield, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { hasRole } from "@/lib/rbac";
import type {
  BulkMembershipFailureCode,
  BulkMembershipResponse,
  Team,
  UserMinimal,
} from "@/lib/types/auth";
import { BulkUserPicker } from "@/components/hrm/users/BulkUserPicker";
import { Pagination } from "@/components/hrm/ui/Pagination";
import { BulkResultPanel } from "@/components/hrm/users/BulkResultPanel";

function getMemberName(m: { first_name: string; last_name: string }) {
  return [m.first_name, m.last_name].filter(Boolean).join(" ") || "—";
}

function getTeamLeadLabel(team: Team): string {
  const lead = team.team_lead;
  if (!lead) return "None";
  const l = lead as UserMinimal & { full_name?: string; name?: string };
  const name =
    l.full_name ?? l.name ?? [l.first_name, l.last_name].filter(Boolean).join(" ");
  return `${name || "—"}${l.email ? ` — ${l.email}` : ""}`;
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

export default function UnitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data, isLoading, error } = useUnitDetail(id);
  const updateUnit = useUpdateUnit(id);
  const deleteUnit = useDeleteUnit();
  const assignSupervisor = useAssignUnitSupervisor(id);
  const removeSupervisor = useRemoveUnitSupervisor(id);
  const { user } = useAuth();

  const deptId = data?.department?.id ?? "";
  const { data: deptMembers = [] } = useDepartmentMembers(deptId);
  const { data: departmentUnits = [] } = useUnits(deptId);

  const bulkAddMembersToUnit = useBulkAddMembersToUnit();
  const bulkRemoveUnitMembers = useBulkRemoveUnitMembers(id);
  const bulkAddTeamMembers = useBulkAddTeamMembers(id);

  const [editOpen, setEditOpen] = useState(false);
  const [unitName, setUnitName] = useState("");
  const [unitError, setUnitError] = useState<string | null>(null);

  const [supervisorOpen, setSupervisorOpen] = useState(false);
  const [supervisorId, setSupervisorId] = useState<string>("");
  const [supervisorError, setSupervisorError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [tab, setTab] = useState<"manage" | "members" | "teams">("members");

  const canManageTeams = hasRole(user, "HR", "LINE_MANAGER");
  const { data: teams = [], isLoading: teamsLoading } = useTeams(id);
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam(id);
  const deleteTeam = useDeleteTeam(id);
  const removeMember = useRemoveTeamMember(id);
  const setLead = useSetTeamLead(id);
  const clearLead = useClearTeamLead(id);

  const [teamCreateOpen, setTeamCreateOpen] = useState(false);
  const [teamCreateName, setTeamCreateName] = useState("");
  const [teamCreateLeadId, setTeamCreateLeadId] = useState("");
  const [teamCreateError, setTeamCreateError] = useState<string | null>(null);

  const [teamEditOpen, setTeamEditOpen] = useState(false);
  const [teamEditId, setTeamEditId] = useState<string>("");
  const [teamEditName, setTeamEditName] = useState("");
  const [teamEditLeadId, setTeamEditLeadId] = useState("");
  const [teamEditError, setTeamEditError] = useState<string | null>(null);

  const [teamMembersOpen, setTeamMembersOpen] = useState(false);
  const [teamMembersId, setTeamMembersId] = useState<string>("");
  const [teamMembersError, setTeamMembersError] = useState<string | null>(null);
  const [teamMembersSearch, setTeamMembersSearch] = useState("");
  const [teamMembersSelectedUserIds, setTeamMembersSelectedUserIds] = useState<string[]>([]);
  const [teamMembersResult, setTeamMembersResult] = useState<BulkMembershipResponse | null>(null);

  const [teamLeadOpen, setTeamLeadOpen] = useState(false);
  const [teamLeadTeam, setTeamLeadTeam] = useState<Team | null>(null);
  const [teamLeadUserId, setTeamLeadUserId] = useState("");
  const [teamLeadError, setTeamLeadError] = useState<string | null>(null);

  const pageSize = 20;
  const [unitMembersPage, setUnitMembersPage] = useState(1);
  const [unitSelectedUserIds, setUnitSelectedUserIds] = useState<string[]>([]);
  const [applyUnitMoveModalOpen, setApplyUnitMoveModalOpen] = useState(false);
  const [applyUnitMoveTargetId, setApplyUnitMoveTargetId] = useState("");
  const [applyUnitMoveClearConflicts, setApplyUnitMoveClearConflicts] = useState(false);
  const [applyUnitMoveModalError, setApplyUnitMoveModalError] = useState<string | null>(null);
  const [applyTeamAddModalOpen, setApplyTeamAddModalOpen] = useState(false);
  const [applyTeamAddTargetId, setApplyTeamAddTargetId] = useState("");
  const [applyTeamAddClearConflicts, setApplyTeamAddClearConflicts] = useState(false);
  const [applyTeamAddModalError, setApplyTeamAddModalError] = useState<string | null>(null);
  const [membersBulkResult, setMembersBulkResult] = useState<BulkMembershipResponse | null>(null);

  const siblingDepartmentUnits = useMemo(
    () => departmentUnits.filter((u) => u.id !== id),
    [departmentUnits, id]
  );
  const [membersSearch, setMembersSearch] = useState("");
  const [membersTeamFilter, setMembersTeamFilter] = useState<"" | "none" | string>("");

  const selectedTeam = useMemo(
    () => teams.find((t) => t.id === teamMembersId || t.id === teamEditId) ?? null,
    [teams, teamMembersId, teamEditId]
  );

  const userTeamById = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of teams) {
      for (const m of t.members ?? []) {
        map.set(m.id, t.id);
      }
    }
    return map;
  }, [teams]);

  const filteredUnitMembers = useMemo(() => {
    const q = membersSearch.trim().toLowerCase();
    return (data?.members ?? []).filter((m) => {
      const matchesSearch =
        !q || `${getMemberName(m)} ${m.email}`.toLowerCase().includes(q);
      const teamId = userTeamById.get(m.id) ?? "";
      const matchesTeam =
        !membersTeamFilter ||
        (membersTeamFilter === "none" ? !teamId : teamId === membersTeamFilter);
      return matchesSearch && matchesTeam;
    });
  }, [data?.members, membersSearch, membersTeamFilter, userTeamById]);

  const supervisorOptions = useMemo(() => {
    return deptMembers.slice().sort((a, b) => {
      const an = `${a.first_name} ${a.last_name}`.trim();
      const bn = `${b.first_name} ${b.last_name}`.trim();
      return an.localeCompare(bn);
    });
  }, [deptMembers]);

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
        <PageHeader title="Unit" />
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
          {error instanceof Error ? error.message : "Unit not found."}
        </div>
      </div>
    );
  }

  const { name, department, supervisor, members } = data;
  const pendingAny =
    updateUnit.isPending ||
    deleteUnit.isPending ||
    assignSupervisor.isPending ||
    removeSupervisor.isPending ||
    createTeam.isPending ||
    updateTeam.isPending ||
    deleteTeam.isPending ||
    bulkAddTeamMembers.isPending ||
    bulkAddMembersToUnit.isPending ||
    bulkRemoveUnitMembers.isPending ||
    removeMember.isPending ||
    setLead.isPending ||
    clearLead.isPending;

  function toggleUnitSelected(userId: string, next: boolean) {
    setUnitSelectedUserIds((prev) => {
      const set = new Set(prev);
      if (next) set.add(userId);
      else set.delete(userId);
      return Array.from(set);
    });
  }

  function openApplyUnitMoveModal() {
    setApplyUnitMoveModalError(null);
    setApplyUnitMoveTargetId("");
    setApplyUnitMoveClearConflicts(false);
    setApplyUnitMoveModalOpen(true);
  }

  async function handleConfirmApplyUnitMoveFromModal() {
    setMembersBulkResult(null);
    setApplyUnitMoveModalError(null);
    if (unitSelectedUserIds.length === 0) {
      setApplyUnitMoveModalError("No members selected.");
      return;
    }
    if (!applyUnitMoveTargetId) {
      setApplyUnitMoveModalError("Select a destination unit.");
      return;
    }
    if (applyUnitMoveTargetId === id) {
      setApplyUnitMoveModalError("Choose a different unit than the current one.");
      return;
    }
    try {
      const res = await bulkAddMembersToUnit.mutateAsync({
        unitId: applyUnitMoveTargetId,
        payload: {
          user_ids: unitSelectedUserIds,
          dry_run: false,
          clear_conflicts: applyUnitMoveClearConflicts,
        },
      });
      setMembersBulkResult(res);
      setApplyUnitMoveModalOpen(false);
      if (res.failed.length === 0) {
        setUnitSelectedUserIds([]);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to move members to unit.";
      setMembersBulkResult({
        target: { unit_id: id },
        succeeded_user_ids: [],
        failed: unitSelectedUserIds.map((uid) => ({
          user_id: uid,
          code: "not_found" as BulkMembershipFailureCode,
          error: msg,
        })),
      });
      setApplyUnitMoveModalOpen(false);
    }
  }

  function openApplyTeamAddModal() {
    setApplyTeamAddModalError(null);
    setApplyTeamAddTargetId("");
    setApplyTeamAddClearConflicts(false);
    setApplyTeamAddModalOpen(true);
  }

  async function handleConfirmApplyTeamAddFromModal() {
    setMembersBulkResult(null);
    setApplyTeamAddModalError(null);
    if (unitSelectedUserIds.length === 0) {
      setApplyTeamAddModalError("No members selected.");
      return;
    }
    if (!applyTeamAddTargetId) {
      setApplyTeamAddModalError("Select a team.");
      return;
    }
    try {
      const res = await bulkAddTeamMembers.mutateAsync({
        teamId: applyTeamAddTargetId,
        payload: {
          user_ids: unitSelectedUserIds,
          dry_run: false,
          clear_conflicts: applyTeamAddClearConflicts,
        },
      });
      setMembersBulkResult(res);
      setApplyTeamAddModalOpen(false);
      if (res.failed.length === 0) {
        setUnitSelectedUserIds([]);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to add members to team.";
      setMembersBulkResult({
        target: { unit_id: id },
        succeeded_user_ids: [],
        failed: unitSelectedUserIds.map((uid) => ({
          user_id: uid,
          code: "not_found" as BulkMembershipFailureCode,
          error: msg,
        })),
      });
      setApplyTeamAddModalOpen(false);
    }
  }

  async function handleBulkRemoveFromUnit() {
    setMembersBulkResult(null);
    if (unitSelectedUserIds.length === 0) return;
    try {
      const res = await bulkRemoveUnitMembers.mutateAsync({
        user_ids: unitSelectedUserIds,
        dry_run: false,
      });
      setMembersBulkResult(res);
      setUnitSelectedUserIds([]);
      setUnitMembersPage(1);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to remove members from unit.";
      setMembersBulkResult({
        target: { unit_id: id },
        succeeded_user_ids: [],
        failed: unitSelectedUserIds.map((uid) => ({
          user_id: uid,
          code: "not_in_unit" as BulkMembershipFailureCode,
          error: msg,
        })),
      });
    }
  }

  async function handleSaveName() {
    setUnitError(null);
    const next = unitName.trim();
    if (!next) return;
    try {
      await updateUnit.mutateAsync({ name: next });
      setEditOpen(false);
    } catch (e: unknown) {
      setUnitError(e instanceof Error ? e.message : "Failed to update unit.");
    }
  }

  async function handleSaveSupervisor() {
    setSupervisorError(null);
    try {
      if (supervisorId) {
        await assignSupervisor.mutateAsync({ user_id: supervisorId });
      } else {
        await removeSupervisor.mutateAsync();
      }
      setSupervisorOpen(false);
    } catch (e: unknown) {
      setSupervisorError(
        e instanceof Error ? e.message : "Failed to update supervisor."
      );
    }
  }

  async function handleDeleteUnit() {
    try {
      await deleteUnit.mutateAsync(id);
      router.push(department ? `/departments/${department.id}` : "/users");
    } catch {
      // keep minimal
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-2">
        <Link
          href={department ? `/departments/${department.id}` : "/users"}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {department?.name ?? "Users"}
        </Link>
      </div>

      <PageHeader title={name} />

      <div className="mx-auto max-w-4xl space-y-6">
        {/* Unit summary */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{name}</h2>
              {department && (
                <Link
                  href={`/departments/${department.id}`}
                  className="mt-2 inline-block text-sm text-primary hover:underline"
                >
                  {department.name}
                </Link>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Supervisor:
                </span>
                {supervisor ? (
                  <>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {getMemberName(supervisor)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {supervisor.email}
                    </span>
                  </>
                ) : (
                  <span className="text-xs italic text-muted-foreground">
                    None
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-lg bg-muted/50 px-4 py-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {members?.length ?? 0} member
                {(members?.length ?? 0) !== 1 ? "s" : ""}
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
              Members ({members?.length ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setTab("teams")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition ${
                tab === "teams"
                  ? "border-b-2 border-primary bg-primary/5 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4" />
              Teams ({teams.length})
            </button>

            <div className="ml-auto flex items-center gap-2 px-3">
              {tab === "teams" && canManageTeams && (
                <button
                  type="button"
                  onClick={() => {
                    setTeamCreateError(null);
                    setTeamCreateName("");
                    setTeamCreateLeadId("");
                    setTeamCreateOpen(true);
                  }}
                  disabled={pendingAny}
                  className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  Create team
                </button>
              )}
            </div>
          </div>

          <div className="p-4">
            {tab === "manage" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="text-sm font-semibold text-foreground">Unit settings</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Update unit details and supervisor assignment.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUnitError(null);
                        setUnitName(name);
                        setEditOpen(true);
                      }}
                      disabled={pendingAny}
                      className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold transition hover:bg-muted disabled:opacity-60"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit unit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSupervisorError(null);
                        setSupervisorId(supervisor?.id ?? "");
                        setSupervisorOpen(true);
                      }}
                      disabled={pendingAny}
                      className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold transition hover:bg-muted disabled:opacity-60"
                    >
                      <Shield className="h-4 w-4" />
                      {supervisor ? "Change supervisor" : "Assign supervisor"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteOpen(true)}
                      disabled={pendingAny}
                      className="inline-flex items-center gap-2 rounded-md bg-destructive px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete unit
                    </button>
                  </div>
                </div>
              </div>
            )}

            {tab === "members" && (
              <div className="space-y-3">
                {!members?.length ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No members in this unit.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={openApplyUnitMoveModal}
                          disabled={
                            pendingAny ||
                            unitSelectedUserIds.length === 0 ||
                            siblingDepartmentUnits.length === 0
                          }
                          title={
                            siblingDepartmentUnits.length === 0
                              ? "No other units in this department to move members to"
                              : undefined
                          }
                          className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                        >
                          Change Unit
                        </button>
                        <button
                          type="button"
                          onClick={openApplyTeamAddModal}
                          disabled={
                            pendingAny ||
                            unitSelectedUserIds.length === 0 ||
                            teams.length === 0
                          }
                          title={
                            teams.length === 0
                              ? "Create a team on this unit first"
                              : undefined
                          }
                          className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                        >
                          Add To Team
                        </button>
                        <button
                          type="button"
                          onClick={handleBulkRemoveFromUnit}
                          disabled={pendingAny || unitSelectedUserIds.length === 0}
                          title="Remove selected members from this unit"
                          aria-label="Remove selected members from this unit"
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
                              setUnitMembersPage(1);
                            }}
                            placeholder="Search members…"
                            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring transition"
                          />
                        </div>

                        <select
                          value={membersTeamFilter}
                          onChange={(e) => {
                            setMembersTeamFilter(
                              e.target.value as "" | "none" | string
                            );
                            setUnitMembersPage(1);
                          }}
                          className="w-full sm:w-56 rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring transition"
                          aria-label="Filter by team"
                        >
                          <option value="">All teams</option>
                          <option value="none">No team</option>
                          {teams.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Pagination
                        page={unitMembersPage}
                        pageSize={pageSize}
                        total={filteredUnitMembers.length}
                        onPageChange={setUnitMembersPage}
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
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUnitMembers
                            .slice((unitMembersPage - 1) * pageSize, unitMembersPage * pageSize)
                            .map((m) => {
                              const checked = unitSelectedUserIds.includes(m.id);
                              return (
                                <tr
                                  key={m.id}
                                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                                >
                                  <td className="px-4 py-3">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => toggleUnitSelected(m.id, e.target.checked)}
                                      disabled={pendingAny}
                                      className="h-4 w-4 rounded border-border accent-primary"
                                      aria-label={`Select ${getMemberName(m)}`}
                                    />
                                  </td>
                                  <td className="px-4 py-3 font-medium text-foreground">
                                    {getMemberName(m)}
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>

                    <Pagination
                      page={unitMembersPage}
                      pageSize={pageSize}
                      total={filteredUnitMembers.length}
                      onPageChange={setUnitMembersPage}
                      className="pt-2"
                    />
                  </>
                )}
              </div>
            )}

            {tab === "teams" && (
              <>
                {teamsLoading ? (
                  <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading teams...
                  </div>
                ) : teams.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No teams in this unit.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                            Team
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                            Lead
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                            Members
                          </th>
                          <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {teams.map((t) => (
                          <tr
                            key={t.id}
                            className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium text-foreground">
                              {t.name}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {getTeamLeadLabel(t)}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {Array.isArray(t.members) ? t.members.length : "—"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex flex-wrap justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTeamLeadError(null);
                                    setTeamLeadTeam(t);
                                    setTeamLeadUserId(t.team_lead?.id ?? "");
                                    setTeamLeadOpen(true);
                                  }}
                                  disabled={!canManageTeams || pendingAny}
                                  title={t.team_lead ? "Change team lead" : "Assign team lead"}
                                  aria-label={t.team_lead ? "Change team lead" : "Assign team lead"}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:bg-muted disabled:opacity-60"
                                >
                                  <Shield className="h-4 w-4" aria-hidden />
                                </button>
                                {t.team_lead && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!canManageTeams) return;
                                      setTeamLeadError(null);
                                      try {
                                        await clearLead.mutateAsync({ teamId: t.id });
                                      } catch (e: unknown) {
                                        setTeamLeadError(
                                          e instanceof Error ? e.message : "Failed to revoke team lead."
                                        );
                                        setTeamLeadTeam(t);
                                        setTeamLeadUserId(t.team_lead?.id ?? "");
                                        setTeamLeadOpen(true);
                                      }
                                    }}
                                    disabled={!canManageTeams || pendingAny}
                                    title="Revoke team lead"
                                    aria-label="Revoke team lead"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive transition hover:bg-destructive/15 disabled:opacity-60"
                                  >
                                    <Shield className="h-4 w-4" aria-hidden />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTeamEditError(null);
                                    setTeamEditId(t.id);
                                    setTeamEditName(t.name);
                                    setTeamEditLeadId(t.team_lead?.id ?? "");
                                    setTeamEditOpen(true);
                                  }}
                                  disabled={!canManageTeams || pendingAny}
                                  title="Edit team"
                                  aria-label="Edit team"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:bg-muted disabled:opacity-60"
                                >
                                  <Pencil className="h-4 w-4" aria-hidden />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTeamMembersError(null);
                                    setTeamMembersResult(null);
                                    setTeamMembersId(t.id);
                                    setTeamMembersSelectedUserIds([]);
                                    setTeamMembersSearch("");
                                    setTeamMembersOpen(true);
                                  }}
                                  disabled={!canManageTeams || pendingAny}
                                  title="View team members"
                                  aria-label="View team members"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:bg-muted disabled:opacity-60"
                                >
                                  <Users className="h-4 w-4" aria-hidden />
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await deleteTeam.mutateAsync(t.id);
                                    } catch {
                                      // keep minimal
                                    }
                                  }}
                                  disabled={!canManageTeams || pendingAny}
                                  title="Delete team"
                                  aria-label="Delete team"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-destructive text-white transition hover:opacity-90 disabled:opacity-60"
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit unit modal */}
      {editOpen && (
        <Overlay onClose={() => setEditOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Edit unit
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
                  onClick={() => setEditOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveName}
                  disabled={!unitName.trim() || pendingAny}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* Supervisor modal */}
      {supervisorOpen && (
        <Overlay onClose={() => setSupervisorOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Supervisor
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
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
                className={cn(
                  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                )}
                aria-label="Select supervisor"
              >
                <option value="">None</option>
                {supervisorOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {getMemberName(m)} — {m.email}
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSupervisorOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSupervisor}
                  disabled={pendingAny}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  Save
                </button>
              </div>

              {supervisor && (
                <button
                  type="button"
                  onClick={async () => {
                    setSupervisorError(null);
                    try {
                      await removeSupervisor.mutateAsync();
                      setSupervisorId("");
                      setSupervisorOpen(false);
                    } catch (e: unknown) {
                      setSupervisorError(
                        e instanceof Error ? e.message : "Failed to remove supervisor."
                      );
                    }
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

      {applyUnitMoveModalOpen && (
        <Overlay
          onClose={() => {
            setApplyUnitMoveModalOpen(false);
            setApplyUnitMoveModalError(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-semibold text-foreground">
              Change Unit
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Move{" "}
              <span className="font-medium text-foreground">
                {unitSelectedUserIds.length}
              </span>{" "}
              selected member{unitSelectedUserIds.length !== 1 ? "s" : ""} from{" "}
              <span className="font-medium text-foreground">{name}</span> into
              the unit you choose below.
            </p>
            {siblingDepartmentUnits.length === 0 ? (
              <p className="mb-4 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                There are no other units in this department. Create another unit
                under the department, then try again.
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="unit-move-target-select"
                    className="mb-1.5 block text-xs font-medium text-muted-foreground"
                  >
                    Destination unit
                  </label>
                  <select
                    id="unit-move-target-select"
                    value={applyUnitMoveTargetId}
                    onChange={(e) => {
                      setApplyUnitMoveTargetId(e.target.value);
                      setApplyUnitMoveModalError(null);
                    }}
                    disabled={pendingAny}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                  >
                    <option value="">Select a unit…</option>
                    {siblingDepartmentUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={applyUnitMoveClearConflicts}
                    onChange={(e) => setApplyUnitMoveClearConflicts(e.target.checked)}
                    disabled={pendingAny}
                    className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="text-muted-foreground">
                    Clear conflicting memberships when the API allows it.
                  </span>
                </label>
              </div>
            )}
            {applyUnitMoveModalError && (
              <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {applyUnitMoveModalError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setApplyUnitMoveModalOpen(false);
                  setApplyUnitMoveModalError(null);
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApplyUnitMoveFromModal}
                disabled={
                  pendingAny ||
                  siblingDepartmentUnits.length === 0 ||
                  !applyUnitMoveTargetId ||
                  unitSelectedUserIds.length === 0
                }
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                Change Unit
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {applyTeamAddModalOpen && (
        <Overlay
          onClose={() => {
            setApplyTeamAddModalOpen(false);
            setApplyTeamAddModalError(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-semibold text-foreground">
              Add To Team
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Add{" "}
              <span className="font-medium text-foreground">
                {unitSelectedUserIds.length}
              </span>{" "}
              selected member{unitSelectedUserIds.length !== 1 ? "s" : ""} to the
              team you choose below.
            </p>
            {teams.length === 0 ? (
              <p className="mb-4 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                This unit has no teams yet. Create one under the Teams tab, then try
                again.
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="team-add-target-select"
                    className="mb-1.5 block text-xs font-medium text-muted-foreground"
                  >
                    Team
                  </label>
                  <select
                    id="team-add-target-select"
                    value={applyTeamAddTargetId}
                    onChange={(e) => {
                      setApplyTeamAddTargetId(e.target.value);
                      setApplyTeamAddModalError(null);
                    }}
                    disabled={pendingAny}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                  >
                    <option value="">Select a team…</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={applyTeamAddClearConflicts}
                    onChange={(e) => setApplyTeamAddClearConflicts(e.target.checked)}
                    disabled={pendingAny}
                    className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="text-muted-foreground">
                    Clear conflicting memberships when the API allows it.
                  </span>
                </label>
              </div>
            )}
            {applyTeamAddModalError && (
              <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {applyTeamAddModalError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setApplyTeamAddModalOpen(false);
                  setApplyTeamAddModalError(null);
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApplyTeamAddFromModal}
                disabled={
                  pendingAny ||
                  teams.length === 0 ||
                  !applyTeamAddTargetId ||
                  unitSelectedUserIds.length === 0
                }
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                Add To Team
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Delete confirm */}
      {deleteOpen && (
        <Overlay onClose={() => setDeleteOpen(false)}>
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
                onClick={() => setDeleteOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUnit}
                disabled={pendingAny}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Create team modal */}
      {teamCreateOpen && (
        <Overlay onClose={() => setTeamCreateOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Create team</h2>
            {teamCreateError && (
              <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {teamCreateError}
              </p>
            )}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-muted-foreground">
                Name
              </label>
              <input
                value={teamCreateName}
                onChange={(e) => setTeamCreateName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                placeholder="API Team"
              />
              <label className="block text-xs font-medium text-muted-foreground">
                Team lead (optional)
              </label>
              <select
                value={teamCreateLeadId}
                onChange={(e) => setTeamCreateLeadId(e.target.value)}
                className={cn(
                  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                )}
              >
                <option value="">None</option>
                {(members ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {getMemberName(m)} — {m.email}
                  </option>
                ))}
              </select>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTeamCreateOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!teamCreateName.trim() || pendingAny}
                  onClick={async () => {
                    setTeamCreateError(null);
                    try {
                      await createTeam.mutateAsync({
                        name: teamCreateName.trim(),
                        unit_id: id,
                        team_lead_id: teamCreateLeadId || undefined,
                      });
                      setTeamCreateOpen(false);
                    } catch (e: unknown) {
                      setTeamCreateError(
                        e instanceof Error ? e.message : "Failed to create team."
                      );
                    }
                  }}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* Edit team modal */}
      {teamEditOpen && (
        <Overlay onClose={() => setTeamEditOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Edit team</h2>
            {teamEditError && (
              <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {teamEditError}
              </p>
            )}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-muted-foreground">
                Name
              </label>
              <input
                value={teamEditName}
                onChange={(e) => setTeamEditName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                placeholder="API Team"
              />

              <label className="block text-xs font-medium text-muted-foreground">
                Team lead
              </label>
              <select
                value={teamEditLeadId}
                onChange={(e) => setTeamEditLeadId(e.target.value)}
                className={cn(
                  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                )}
              >
                <option value="">None</option>
                {(members ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {getMemberName(m)} — {m.email}
                  </option>
                ))}
              </select>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTeamEditOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!teamEditName.trim() || pendingAny || !teamEditId}
                  onClick={async () => {
                    setTeamEditError(null);
                    try {
                      await updateTeam.mutateAsync({
                        teamId: teamEditId,
                        payload: { name: teamEditName.trim() },
                      });

                      if (!teamEditLeadId) {
                        await clearLead.mutateAsync({ teamId: teamEditId });
                      } else {
                        await setLead.mutateAsync({
                          teamId: teamEditId,
                          payload: { user_id: teamEditLeadId },
                        });
                      }

                      setTeamEditOpen(false);
                    } catch (e: unknown) {
                      setTeamEditError(
                        e instanceof Error ? e.message : "Failed to update team."
                      );
                    }
                  }}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  Save
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                Setting a Team Lead will update that user’s role to TEAM_LEAD on the
                backend.
              </p>
            </div>
          </div>
        </Overlay>
      )}

      {/* Team members modal */}
      {teamMembersOpen && (
        <Overlay onClose={() => setTeamMembersOpen(false)}>
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Team members
            </h2>
            {teamMembersError && (
              <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {teamMembersError}
              </p>
            )}
            {teamMembersResult && (
              <div className="mb-4 space-y-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Added:</span>{" "}
                  {teamMembersResult.succeeded_user_ids.length}
                  {teamMembersResult.failed.length > 0 ? (
                    <>
                      {" "}
                      <span className="text-muted-foreground">•</span>{" "}
                      <span className="font-semibold">Failed:</span>{" "}
                      {teamMembersResult.failed.length}
                    </>
                  ) : null}
                </p>
                {teamMembersResult.failed.length > 0 && (
                  <ul className="max-h-32 overflow-auto text-xs text-muted-foreground">
                    {teamMembersResult.failed.map((f) => (
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

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Add members
                </label>
                <div className="mt-2 space-y-3">
                  <BulkUserPicker
                    users={members ?? []}
                    selectedUserIds={teamMembersSelectedUserIds}
                    onChangeSelectedUserIds={setTeamMembersSelectedUserIds}
                    search={teamMembersSearch}
                    onChangeSearch={setTeamMembersSearch}
                    disabled={pendingAny || !teamMembersId}
                    label="Unit members"
                    emptyText={(members ?? []).length ? "No matches." : "No unit members."}
                  />
                  <button
                    type="button"
                    disabled={teamMembersSelectedUserIds.length === 0 || pendingAny || !teamMembersId}
                    onClick={async () => {
                      setTeamMembersError(null);
                      setTeamMembersResult(null);
                      try {
                        const res = await bulkAddTeamMembers.mutateAsync({
                          teamId: teamMembersId,
                          payload: {
                            user_ids: teamMembersSelectedUserIds,
                            dry_run: false,
                            clear_conflicts: false,
                          },
                        });
                        setTeamMembersResult(res);
                        setTeamMembersSelectedUserIds([]);
                        setTeamMembersSearch("");
                      } catch (e: unknown) {
                        setTeamMembersError(
                          e instanceof Error ? e.message : "Failed to add member."
                        );
                      }
                    }}
                    className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                  >
                    Add members
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-border overflow-hidden">
                <div className="border-b border-border px-4 py-2">
                  <h3 className="text-sm font-semibold text-foreground">Current</h3>
                </div>
                <div className="p-4">
                  {!selectedTeam ? (
                    <p className="text-sm text-muted-foreground">Team not found.</p>
                  ) : Array.isArray(selectedTeam.members) ? (
                    selectedTeam.members.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No members in this team.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                                Name
                              </th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                                Email
                              </th>
                              <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedTeam.members.map((m) => (
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
                                    disabled={pendingAny}
                                    onClick={async () => {
                                      setTeamMembersError(null);
                                      try {
                                        await removeMember.mutateAsync({
                                          teamId: selectedTeam.id,
                                          payload: { user_id: m.id },
                                        });
                                      } catch (e: unknown) {
                                        setTeamMembersError(
                                          e instanceof Error
                                            ? e.message
                                            : "Failed to remove member."
                                        );
                                      }
                                    }}
                                    className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive transition hover:bg-destructive/15 disabled:opacity-60"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      This API response does not include team members. You can still
                      add members above.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTeamMembersOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* Assign / change team lead modal */}
      {teamLeadOpen && teamLeadTeam && (
        <Overlay
          onClose={() => {
            setTeamLeadOpen(false);
            setTeamLeadTeam(null);
            setTeamLeadError(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-semibold text-foreground">Team Lead</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {teamLeadTeam.name}
            </p>
            {teamLeadError && (
              <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {teamLeadError}
              </p>
            )}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-muted-foreground">
                Assign lead
              </label>
              <select
                value={teamLeadUserId}
                onChange={(e) => setTeamLeadUserId(e.target.value)}
                disabled={!canManageTeams || pendingAny}
                className={cn(
                  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                )}
                aria-label="Select team lead"
              >
                <option value="">None</option>
                {(data?.members ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {getMemberName(m)} — {m.email}
                  </option>
                ))}
              </select>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTeamLeadOpen(false);
                    setTeamLeadTeam(null);
                    setTeamLeadError(null);
                  }}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!teamLeadTeam) return;
                    setTeamLeadError(null);
                    try {
                      if (teamLeadUserId) {
                        await setLead.mutateAsync({
                          teamId: teamLeadTeam.id,
                          payload: { user_id: teamLeadUserId },
                        });
                      } else {
                        await clearLead.mutateAsync({ teamId: teamLeadTeam.id });
                      }
                      setTeamLeadOpen(false);
                      setTeamLeadTeam(null);
                    } catch (e: unknown) {
                      setTeamLeadError(
                        e instanceof Error ? e.message : "Failed to update team lead."
                      );
                    }
                  }}
                  disabled={!canManageTeams || pendingAny}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}
