"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUnitDetail, useDeleteUnit, useUpdateUnit } from "@/lib/api/units";
import { useDepartmentMembers } from "@/lib/api/departments";
import {
  useAddTeamMember,
  useClearTeamLead,
  useCreateTeam,
  useDeleteTeam,
  useRemoveTeamMember,
  useSetTeamLead,
  useTeams,
  useUpdateTeam,
} from "@/lib/api/teams";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { ArrowLeft, Users, Loader2, Pencil, Trash2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { hasRole } from "@/lib/rbac";
import type { Team } from "@/lib/types/auth";

function getMemberName(m: { first_name: string; last_name: string }) {
  return [m.first_name, m.last_name].filter(Boolean).join(" ") || "—";
}

function getTeamLeadLabel(team: Team): string {
  const lead = team.team_lead;
  if (!lead) return "None";
  const name =
    (lead as any).full_name ??
    (lead as any).name ??
    [lead.first_name, lead.last_name].filter(Boolean).join(" ");
  return `${name || "—"}${lead.email ? ` — ${lead.email}` : ""}`;
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
  const { user } = useAuth();

  const deptId = data?.department?.id ?? "";
  const { data: deptMembers = [] } = useDepartmentMembers(deptId);

  const [editOpen, setEditOpen] = useState(false);
  const [unitName, setUnitName] = useState("");
  const [unitError, setUnitError] = useState<string | null>(null);

  const [supervisorOpen, setSupervisorOpen] = useState(false);
  const [supervisorId, setSupervisorId] = useState<string>("");
  const [supervisorError, setSupervisorError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [tab, setTab] = useState<"manage" | "members" | "teams">("manage");

  const canManageTeams = hasRole(user, "HR", "LINE_MANAGER");
  const { data: teams = [], isLoading: teamsLoading } = useTeams(id);
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam(id);
  const deleteTeam = useDeleteTeam(id);
  const addMember = useAddTeamMember(id);
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
  const [teamMemberToAdd, setTeamMemberToAdd] = useState<string>("");

  const selectedTeam = useMemo(
    () => teams.find((t) => t.id === teamMembersId || t.id === teamEditId) ?? null,
    [teams, teamMembersId, teamEditId]
  );

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
    createTeam.isPending ||
    updateTeam.isPending ||
    deleteTeam.isPending ||
    addMember.isPending ||
    removeMember.isPending ||
    setLead.isPending ||
    clearLead.isPending;

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
      await updateUnit.mutateAsync({
        supervisor_id: supervisorId ? supervisorId : null,
      });
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
              <div className="overflow-x-auto">
                {!members?.length ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No members in this unit.
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                                    setTeamEditError(null);
                                    setTeamEditId(t.id);
                                    setTeamEditName(t.name);
                                    setTeamEditLeadId(t.team_lead?.id ?? "");
                                    setTeamEditOpen(true);
                                  }}
                                  disabled={!canManageTeams || pendingAny}
                                  className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold transition hover:bg-muted disabled:opacity-60"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTeamMembersError(null);
                                    setTeamMembersId(t.id);
                                    setTeamMemberToAdd("");
                                    setTeamMembersOpen(true);
                                  }}
                                  disabled={!canManageTeams || pendingAny}
                                  className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold transition hover:bg-muted disabled:opacity-60"
                                >
                                  Members
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
                                  className="rounded-md bg-destructive px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                                >
                                  Delete
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
                    setSupervisorId("");
                    await handleSaveSupervisor();
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
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Team members
            </h2>
            {teamMembersError && (
              <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {teamMembersError}
              </p>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Add member
                </label>
                <div className="mt-2 flex gap-2">
                  <select
                    value={teamMemberToAdd}
                    onChange={(e) => setTeamMemberToAdd(e.target.value)}
                    className={cn(
                      "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                    )}
                  >
                    <option value="">Select a unit member</option>
                    {(members ?? []).map((m) => (
                      <option key={m.id} value={m.id}>
                        {getMemberName(m)} — {m.email}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!teamMemberToAdd || pendingAny || !teamMembersId}
                    onClick={async () => {
                      setTeamMembersError(null);
                      try {
                        await addMember.mutateAsync({
                          teamId: teamMembersId,
                          payload: { user_id: teamMemberToAdd },
                        });
                        setTeamMemberToAdd("");
                      } catch (e: unknown) {
                        setTeamMembersError(
                          e instanceof Error ? e.message : "Failed to add member."
                        );
                      }
                    }}
                    className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                  >
                    Add
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
                                  {getMemberName(m as any)}
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
    </div>
  );
}
