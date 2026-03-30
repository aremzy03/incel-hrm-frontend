"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUnitDetail, useDeleteUnit, useUpdateUnit } from "@/lib/api/units";
import { useDepartmentMembers } from "@/lib/api/departments";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { ArrowLeft, Users, Loader2, Pencil, Trash2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

function getMemberName(m: { first_name: string; last_name: string }) {
  return [m.first_name, m.last_name].filter(Boolean).join(" ") || "—";
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

  const deptId = data?.department?.id ?? "";
  const { data: deptMembers = [] } = useDepartmentMembers(deptId);

  const [editOpen, setEditOpen] = useState(false);
  const [unitName, setUnitName] = useState("");
  const [unitError, setUnitError] = useState<string | null>(null);

  const [supervisorOpen, setSupervisorOpen] = useState(false);
  const [supervisorId, setSupervisorId] = useState<string>("");
  const [supervisorError, setSupervisorError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);

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
  const pendingAny = updateUnit.isPending || deleteUnit.isPending;

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

          <div className="mt-5 flex flex-wrap gap-2">
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

        {/* Members list */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h3 className="font-medium text-foreground">Members</h3>
          </div>
          <div className="p-4">
            {!members?.length ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No members in this unit.
              </p>
            ) : (
              <div className="overflow-x-auto">
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
              </div>
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
    </div>
  );
}
