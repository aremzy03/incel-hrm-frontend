"use client";

import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { DataTable } from "@/components/hrm/ui/DataTable";
import { StatusBadge } from "@/components/hrm/ui/StatusBadge";
import { FieldLabel } from "@/components/hrm/forms/FieldLabel";
import { UserSearchField } from "@/components/hrm/leave/UserSearchField";
import { Button } from "@/components/ui/button";
import {
  SettingsConfirmDialog,
  SettingsLiveRegion,
  SettingsQueryPanel,
} from "@/components/hrm/leave/SettingsDialog";
import { stitchCardClass, stitchFieldClass, stitchSelectClass } from "@/lib/design/field-styles";
import {
  useLeavePolicyAssignments,
  useCreatePolicyAssignment,
  useDeletePolicyAssignment,
  useLeavePolicyResolution,
} from "@/lib/api/leave-assignments";
import { useLeavePolicies } from "@/lib/api/leave-policies";
import { useLeaveTypes } from "@/lib/api/leave-types";
import { useDepartments } from "@/lib/api/departments";
import { useUnits } from "@/lib/api/units";
import { useTeams } from "@/lib/api/teams";
import {
  assignmentScopeLabel,
  contractTypeLabel,
  formatIsoDate,
  formatPersonName,
  mutationErrorMessage,
  policyStatusLabel,
} from "@/lib/leave/settings-labels";
import type { AssignmentScopeType, LeavePolicyAssignment } from "@/lib/types/leave";
import { cn } from "@/lib/utils";

const SCOPES: AssignmentScopeType[] = [
  "ORGANIZATION",
  "DEPARTMENT",
  "UNIT",
  "TEAM",
  "EMPLOYMENT_TYPE",
  "EMPLOYEE",
];
const CONTRACTS = ["PERMANENT", "FIXED_TERM", "CONTRACT", "INTERN", "OTHER"];

const TABLE_COLUMNS = [
  { key: "policy", label: "Policy" },
  { key: "scope", label: "Applies to" },
  { key: "priority", label: "Priority" },
  { key: "dates", label: "Dates" },
  { key: "state", label: "State" },
  { key: "actions", label: "Actions" },
];

export default function AssignmentsPage() {
  const formId = useId();
  const { data: rows = [], isLoading, isError, refetch } = useLeavePolicyAssignments();
  const { data: types = [] } = useLeaveTypes();
  const { data: policies = [] } = useLeavePolicies();
  const { data: depts } = useDepartments();
  const create = useCreatePolicyAssignment();
  const del = useDeletePolicyAssignment();
  const [leaveType, setLeaveType] = useState("");
  const [policy, setPolicy] = useState("");
  const [scope, setScope] = useState<AssignmentScopeType>("ORGANIZATION");
  const [scopeId, setScopeId] = useState("");
  const [employee, setEmployee] = useState<string | null>(null);
  const [deptForUnit, setDeptForUnit] = useState("");
  const [unitForTeam, setUnitForTeam] = useState("");
  const { data: units = [] } = useUnits(deptForUnit);
  const { data: teams = [] } = useTeams(unitForTeam);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [priority, setPriority] = useState(0);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [debugType, setDebugType] = useState("");
  const [debugEmployee, setDebugEmployee] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<LeavePolicyAssignment | null>(null);
  const resolution = useLeavePolicyResolution(
    { leave_type: debugType, employee: debugEmployee ?? undefined },
    { enabled: !!debugType }
  );

  const departments = depts?.results ?? [];
  const activePolicies = policies.filter(
    (p) => p.status === "ACTIVE" && (!leaveType || p.leave_type === leaveType)
  );

  function scopeDisplay(r: LeavePolicyAssignment): string {
    if (r.scope_type === "ORGANIZATION") return assignmentScopeLabel("ORGANIZATION");
    if (r.scope_type === "EMPLOYEE") {
      return formatPersonName(r.employee_detail) || "One employee";
    }
    if (r.scope_type === "DEPARTMENT") {
      const name = departments.find((d) => d.id === r.scope_id)?.name;
      return name ? `Department · ${name}` : assignmentScopeLabel("DEPARTMENT");
    }
    if (r.scope_type === "EMPLOYMENT_TYPE") {
      return r.scope_id
        ? `Employment type · ${contractTypeLabel(r.scope_id)}`
        : assignmentScopeLabel("EMPLOYMENT_TYPE");
    }
    return assignmentScopeLabel(r.scope_type);
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!policy) {
      setError("Choose an active policy.");
      return;
    }
    if (scope === "EMPLOYEE" && !employee) {
      setError("Choose the employee this assignment covers.");
      return;
    }
    if (
      (scope === "DEPARTMENT" || scope === "UNIT" || scope === "TEAM" || scope === "EMPLOYMENT_TYPE") &&
      !scopeId
    ) {
      setError("Choose who this assignment applies to.");
      return;
    }
    try {
      await create.mutateAsync({
        policy,
        scope_type: scope,
        scope_id: scope === "ORGANIZATION" || scope === "EMPLOYEE" ? null : scopeId,
        employee: scope === "EMPLOYEE" ? employee : null,
        priority,
        effective_from: effectiveFrom || null,
        is_active: true,
        reason: reason || undefined,
      });
      setLiveMessage("Assignment created.");
      setLeaveType("");
      setPolicy("");
      setScope("ORGANIZATION");
      setScopeId("");
      setEmployee(null);
      setDeptForUnit("");
      setUnitForTeam("");
      setEffectiveFrom("");
      setPriority(0);
      setReason("");
    } catch (err) {
      setError(
        mutationErrorMessage(
          err,
          "Could not create this assignment. End-date or deactivate the overlapping one first."
        )
      );
    }
  }

  async function onDelete(row: LeavePolicyAssignment) {
    try {
      await del.mutateAsync(row.id);
      setLiveMessage(`Removed assignment for ${scopeDisplay(row)}.`);
      setDeleteTarget(null);
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not remove this assignment. Try again."));
      setDeleteTarget(null);
    }
  }

  const emptyMessage = "No policy assignments yet. Map an active policy to a department or person.";

  function rowActions(r: LeavePolicyAssignment) {
    return (
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="relative z-[2] min-h-11 min-w-11 px-3"
        onClick={() => setDeleteTarget(r)}
        aria-label={`Remove assignment for ${scopeDisplay(r)}`}
      >
        Remove
      </Button>
    );
  }

  const table = (
    <DataTable
      columns={TABLE_COLUMNS}
      emptyMessage={emptyMessage}
      className={rows.length > 0 ? "rounded-none border-0 [box-shadow:none]" : undefined}
      getRowLabel={(i) => {
        const r = rows[i];
        return r ? `${r.policy_detail?.name ?? "Policy"} for ${scopeDisplay(r)}` : undefined;
      }}
      rows={rows.map((r) => ({
        policy: (
          <span className="font-medium text-on-surface">
            {r.policy_detail?.name ?? "Policy"}{" "}
            {r.policy_detail?.version != null ? `v${r.policy_detail.version}` : ""}
          </span>
        ),
        scope: scopeDisplay(r),
        priority: r.priority,
        dates: `${formatIsoDate(r.effective_from)} → ${r.effective_to ? formatIsoDate(r.effective_to) : "open"}`,
        state: <StatusBadge status={r.is_active ? "Active" : "Inactive"} />,
        actions: rowActions(r),
      }))}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        className="mb-0"
        title="Policy assignments"
        subtitle="The most specific match wins: employee, then team, unit, department, employment type, then the whole organisation."
      />

      <form onSubmit={onCreate} className={`${stitchCardClass} grid gap-4 p-6 md:grid-cols-2`}>
        {error ? (
          <p
            className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-body-md text-destructive md:col-span-2"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <div>
          <FieldLabel htmlFor={`${formId}-type`}>Leave type</FieldLabel>
          <select
            id={`${formId}-type`}
            className={stitchSelectClass}
            value={leaveType}
            onChange={(e) => {
              setLeaveType(e.target.value);
              setPolicy("");
            }}
            required
          >
            <option value="">Choose type</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor={`${formId}-policy`}>Active policy</FieldLabel>
          <select
            id={`${formId}-policy`}
            className={stitchSelectClass}
            value={policy}
            onChange={(e) => setPolicy(e.target.value)}
            required
          >
            <option value="">Choose policy</option>
            {activePolicies.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} v{p.version}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor={`${formId}-scope`}>Applies to</FieldLabel>
          <select
            id={`${formId}-scope`}
            className={stitchSelectClass}
            value={scope}
            onChange={(e) => {
              setScope(e.target.value as AssignmentScopeType);
              setScopeId("");
            }}
          >
            {SCOPES.map((s) => (
              <option key={s} value={s}>
                {assignmentScopeLabel(s)}
              </option>
            ))}
          </select>
        </div>
        {scope === "DEPARTMENT" ? (
          <div>
            <FieldLabel htmlFor={`${formId}-dept`}>Department</FieldLabel>
            <select
              id={`${formId}-dept`}
              className={stitchSelectClass}
              value={scopeId}
              onChange={(e) => setScopeId(e.target.value)}
            >
              <option value="">Choose department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {scope === "UNIT" ? (
          <>
            <div>
              <FieldLabel htmlFor={`${formId}-dept-unit`}>Department</FieldLabel>
              <select
                id={`${formId}-dept-unit`}
                className={stitchSelectClass}
                value={deptForUnit}
                onChange={(e) => setDeptForUnit(e.target.value)}
              >
                <option value="">Choose department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel htmlFor={`${formId}-unit`}>Unit</FieldLabel>
              <select
                id={`${formId}-unit`}
                className={stitchSelectClass}
                value={scopeId}
                onChange={(e) => setScopeId(e.target.value)}
              >
                <option value="">Choose unit</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}
        {scope === "TEAM" ? (
          <>
            <div>
              <FieldLabel htmlFor={`${formId}-dept-team`}>Department</FieldLabel>
              <select
                id={`${formId}-dept-team`}
                className={stitchSelectClass}
                value={deptForUnit}
                onChange={(e) => setDeptForUnit(e.target.value)}
              >
                <option value="">Choose department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel htmlFor={`${formId}-unit-team`}>Unit</FieldLabel>
              <select
                id={`${formId}-unit-team`}
                className={stitchSelectClass}
                value={unitForTeam}
                onChange={(e) => setUnitForTeam(e.target.value)}
              >
                <option value="">Choose unit</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel htmlFor={`${formId}-team`}>Team</FieldLabel>
              <select
                id={`${formId}-team`}
                className={stitchSelectClass}
                value={scopeId}
                onChange={(e) => setScopeId(e.target.value)}
              >
                <option value="">Choose team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}
        {scope === "EMPLOYMENT_TYPE" ? (
          <div>
            <FieldLabel htmlFor={`${formId}-contract`}>Employment type</FieldLabel>
            <select
              id={`${formId}-contract`}
              className={stitchSelectClass}
              value={scopeId}
              onChange={(e) => setScopeId(e.target.value)}
            >
              <option value="">Choose type</option>
              {CONTRACTS.map((c) => (
                <option key={c} value={c}>
                  {contractTypeLabel(c)}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {scope === "EMPLOYEE" ? (
          <UserSearchField label="Employee" value={employee} onChange={(id) => setEmployee(id)} />
        ) : null}
        <div>
          <FieldLabel htmlFor={`${formId}-from`} optional>
            Effective from
          </FieldLabel>
          <input
            id={`${formId}-from`}
            type="date"
            lang="en-GB"
            className={stitchFieldClass}
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel htmlFor={`${formId}-priority`}>Priority</FieldLabel>
          <input
            id={`${formId}-priority`}
            type="number"
            className={stitchFieldClass}
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
          />
        </div>
        <div className="md:col-span-2">
          <FieldLabel htmlFor={`${formId}-reason`} optional>
            Note for the audit log
          </FieldLabel>
          <input
            id={`${formId}-reason`}
            className={stitchFieldClass}
            value={reason}
            autoComplete="off"
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <Button type="submit" size="lg" className="min-h-11 rounded-xl px-6" disabled={create.isPending}>
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Create assignment
          </Button>
        </div>
      </form>

      <section className="space-y-3" aria-labelledby="assignments-list-heading">
        <h2 id="assignments-list-heading" className="text-title-sm font-semibold text-on-surface">
          Current assignments
        </h2>
        <SettingsQueryPanel
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
          errorTitle="Could not load assignments."
          errorHint="Check your connection and try again."
        >
          {rows.length > 0 ? (
            <div className={cn(stitchCardClass, "overflow-hidden")}>
              <div className="hidden md:block">{table}</div>
              <ul className="divide-y divide-outline-variant md:hidden">
                {rows.map((r) => (
                  <li key={r.id} className="flex flex-col gap-3 px-4 py-4">
                    <p className="font-medium text-on-surface">
                      {r.policy_detail?.name ?? "Policy"}
                    </p>
                    <p className="text-body-md text-on-surface-variant">{scopeDisplay(r)}</p>
                    {rowActions(r)}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <>
              <div className="hidden md:block">{table}</div>
              <div
                className={cn(
                  stitchCardClass,
                  "px-6 py-10 text-center text-body-md text-on-surface-variant md:hidden"
                )}
              >
                {emptyMessage}
              </div>
            </>
          )}
        </SettingsQueryPanel>
      </section>

      <div className={`${stitchCardClass} space-y-3 p-6`}>
        <h3 className="text-title-sm font-semibold text-on-surface">Check who gets which policy</h3>
        <p className="text-body-md text-on-surface-variant">
          See the policy an employee would receive for a leave type, without changing anything.
        </p>
        <div>
          <FieldLabel htmlFor={`${formId}-debug-type`}>Leave type</FieldLabel>
          <select
            id={`${formId}-debug-type`}
            className={stitchSelectClass}
            value={debugType}
            onChange={(e) => setDebugType(e.target.value)}
          >
            <option value="">Choose type</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <UserSearchField
          label="Employee"
          value={debugEmployee}
          onChange={(id) => setDebugEmployee(id)}
          optional
        />
        {resolution.data ? (
          <div className="rounded-xl bg-surface-container-low px-4 py-3 text-body-md">
            <p>
              <span className="text-on-surface-variant">Source · </span>
              {resolution.data.source === "assignment" ? "Assignment" : "Fallback type days"}
            </p>
            <p className="mt-1">
              <span className="text-on-surface-variant">Policy · </span>
              {resolution.data.resolved_policy?.name ?? "None"}
              {resolution.data.resolved_policy
                ? ` (${policyStatusLabel(resolution.data.resolved_policy.status)})`
                : ""}
            </p>
            {resolution.data.assignment_scope ? (
              <p className="mt-1">
                <span className="text-on-surface-variant">Match · </span>
                {assignmentScopeLabel(resolution.data.assignment_scope)}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <SettingsLiveRegion
        message={
          isError
            ? "Could not load assignments."
            : `${liveMessage} ${rows.length} assignments.`
        }
      />

      {deleteTarget ? (
        <SettingsConfirmDialog
          title="Remove this assignment?"
          body={`${deleteTarget.policy_detail?.name ?? "This policy"} will no longer apply to ${scopeDisplay(deleteTarget)}. More specific or organisation defaults may take over.`}
          confirmLabel="Remove assignment"
          destructive
          isPending={del.isPending}
          onClose={() => {
            if (!del.isPending) setDeleteTarget(null);
          }}
          onConfirm={() => void onDelete(deleteTarget)}
        />
      ) : null}
    </div>
  );
}
