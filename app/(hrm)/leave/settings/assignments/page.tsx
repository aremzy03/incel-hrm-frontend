"use client";

import { useState } from "react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { UserSearchField } from "@/components/hrm/leave/UserSearchField";
import { stitchCardClass, stitchFieldClass, stitchSelectClass } from "@/lib/design/field-styles";
import { useLeavePolicyAssignments, useCreatePolicyAssignment, useDeletePolicyAssignment, useLeavePolicyResolution } from "@/lib/api/leave-assignments";
import { useLeavePolicies } from "@/lib/api/leave-policies";
import { useLeaveTypes } from "@/lib/api/leave-types";
import { useDepartments } from "@/lib/api/departments";
import { useUnits } from "@/lib/api/units";
import { useTeams } from "@/lib/api/teams";
import type { AssignmentScopeType } from "@/lib/types/leave";

const SCOPES: AssignmentScopeType[] = ["ORGANIZATION", "DEPARTMENT", "UNIT", "TEAM", "EMPLOYMENT_TYPE", "EMPLOYEE"];
const CONTRACTS = ["PERMANENT", "FIXED_TERM", "CONTRACT", "INTERN", "OTHER"];

export default function AssignmentsPage() {
  const { data: rows = [], isLoading } = useLeavePolicyAssignments();
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
  const resolution = useLeavePolicyResolution(
    { leave_type: debugType, employee: debugEmployee ?? undefined },
    { enabled: !!debugType }
  );

  const activePolicies = policies.filter((p) => p.status === "ACTIVE" && (!leaveType || p.leave_type === leaveType));

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conflict or validation error. End-date or deactivate the overlapping assignment.");
    }
  }

  return (
    <div className="space-y-6">
        <PageHeader title="Policy assignments" subtitle="Specificity wins: employee → team → unit → department → employment type → organization." />

        <form onSubmit={onCreate} className={`${stitchCardClass} grid gap-4 p-6 md:grid-cols-2`}>
          {error && <p className="md:col-span-2 text-sm text-destructive">{error}</p>}
          <select className={stitchSelectClass} value={leaveType} onChange={(e) => { setLeaveType(e.target.value); setPolicy(""); }} required>
            <option value="">Leave type</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select className={stitchSelectClass} value={policy} onChange={(e) => setPolicy(e.target.value)} required>
            <option value="">ACTIVE policy</option>
            {activePolicies.map((p) => <option key={p.id} value={p.id}>{p.name} v{p.version}</option>)}
          </select>
          <select className={stitchSelectClass} value={scope} onChange={(e) => setScope(e.target.value as AssignmentScopeType)}>
            {SCOPES.map((s) => <option key={s}>{s}</option>)}
          </select>
          {scope === "DEPARTMENT" && (
            <select className={stitchSelectClass} value={scopeId} onChange={(e) => setScopeId(e.target.value)}>
              <option value="">Department</option>
              {(depts?.results ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
          {scope === "UNIT" && (
            <>
              <select className={stitchSelectClass} value={deptForUnit} onChange={(e) => setDeptForUnit(e.target.value)}>
                <option value="">Department</option>
                {(depts?.results ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select className={stitchSelectClass} value={scopeId} onChange={(e) => setScopeId(e.target.value)}>
                <option value="">Unit</option>
                {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </>
          )}
          {scope === "TEAM" && (
            <>
              <select className={stitchSelectClass} value={deptForUnit} onChange={(e) => setDeptForUnit(e.target.value)}>
                <option value="">Department</option>
                {(depts?.results ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select className={stitchSelectClass} value={unitForTeam} onChange={(e) => setUnitForTeam(e.target.value)}>
                <option value="">Unit</option>
                {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <select className={stitchSelectClass} value={scopeId} onChange={(e) => setScopeId(e.target.value)}>
                <option value="">Team</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </>
          )}
          {scope === "EMPLOYMENT_TYPE" && (
            <select className={stitchSelectClass} value={scopeId} onChange={(e) => setScopeId(e.target.value)}>
              {CONTRACTS.map((c) => <option key={c}>{c}</option>)}
            </select>
          )}
          {scope === "EMPLOYEE" && (
            <UserSearchField label="Employee" value={employee} onChange={(id) => setEmployee(id)} />
          )}
          <input type="date" className={stitchFieldClass} value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
          <input type="number" className={stitchFieldClass} value={priority} onChange={(e) => setPriority(Number(e.target.value))} placeholder="Priority" />
          <input className={stitchFieldClass} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" />
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Create assignment</button>
        </form>

        <div className={`${stitchCardClass} overflow-x-auto`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left">Policy</th>
                <th className="px-4 py-3 text-left">Scope</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Dates</th>
                <th className="px-4 py-3 text-left">Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td className="p-6">Loading…</td></tr> : rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3">{r.policy_detail?.name ?? r.policy} v{r.policy_detail?.version ?? ""}</td>
                  <td className="px-4 py-3">{r.scope_type} {r.scope_id ?? r.employee ?? ""}</td>
                  <td className="px-4 py-3">{r.priority}</td>
                  <td className="px-4 py-3">{r.effective_from ?? "—"} → {r.effective_to ?? "open"}</td>
                  <td className="px-4 py-3">{r.is_active ? "Yes" : "No"}</td>
                  <td className="px-4 py-3"><button className="text-destructive text-xs" onClick={() => del.mutate(r.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={`${stitchCardClass} space-y-3 p-6`}>
          <h3 className="font-semibold">Resolution debugger</h3>
          <select className={stitchSelectClass} value={debugType} onChange={(e) => setDebugType(e.target.value)}>
            <option value="">Leave type</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <UserSearchField label="Employee (HR)" value={debugEmployee} onChange={(id) => setDebugEmployee(id)} optional />
          {resolution.data && (
            <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(resolution.data, null, 2)}</pre>
          )}
        </div>
    </div>
  );
}
