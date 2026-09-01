"use client";

import { useState } from "react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { UserSearchField } from "@/components/hrm/leave/UserSearchField";
import { stitchCardClass, stitchFieldClass, stitchSelectClass } from "@/lib/design/field-styles";
import {
  useLeaveWorkflows, useCreateLeaveWorkflow, useUpdateLeaveWorkflow, useDeleteLeaveWorkflow, useSimulateWorkflow,
} from "@/lib/api/leave-settings";
import { useLeaveTypes } from "@/lib/api/leave-types";
import type { LeaveWorkflowStage, LeaveWorkflowTemplate, WorkflowApproverSource } from "@/lib/types/leave";

const SOURCES: WorkflowApproverSource[] = [
  "TEAM_LEAD", "SUPERVISOR", "LINE_MANAGER", "HR", "EXECUTIVE_DIRECTOR", "NAMED_USER", "ROLE",
];
const STATUS_CODES = ["PENDING_TEAM_LEAD", "PENDING_SUPERVISOR", "PENDING_MANAGER", "PENDING_HR", "PENDING_ED"];

const defaultStages = (): LeaveWorkflowStage[] =>
  STATUS_CODES.map((status_code, i) => ({
    order: i + 1,
    approver_source: SOURCES[i] as WorkflowApproverSource,
    status_code,
    skip_if_unresolved: i < 2,
    is_optional: false,
    skip_if_requester_roles: [],
  }));

export default function WorkflowsPage() {
  const { data: templates = [] } = useLeaveWorkflows();
  const { data: types = [] } = useLeaveTypes();
  const create = useCreateLeaveWorkflow();
  const update = useUpdateLeaveWorkflow();
  const del = useDeleteLeaveWorkflow();
  const simulate = useSimulateWorkflow();
  const [editing, setEditing] = useState<LeaveWorkflowTemplate | null>(null);
  const [name, setName] = useState("Custom chain");
  const [stages, setStages] = useState<LeaveWorkflowStage[]>(defaultStages());
  const [simEmp, setSimEmp] = useState<string | null>(null);
  const [simType, setSimType] = useState("");

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= stages.length) return;
    const next = [...stages];
    [next[i], next[j]] = [next[j], next[i]];
    setStages(next.map((s, idx) => ({ ...s, order: idx + 1 })));
  }

  return (
    <div className="space-y-6">
        <PageHeader title="Approval workflows" subtitle="Sequential only. Editing a live template does not change requests already submitted. Do not invent new PENDING_* codes." />

        <div className={`${stitchCardClass} overflow-x-auto`}>
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/40"><th className="px-4 py-3 text-left">Name</th><th>Default</th><th>Active</th><th /></tr></thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="px-4 py-3">{t.name}</td>
                  <td className="px-4 py-3">{t.is_org_default ? "Yes" : ""}</td>
                  <td className="px-4 py-3">{t.is_active ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">
                    <button className="mr-2 text-xs" onClick={() => { setEditing(t); setName(t.name); setStages(t.stages?.length ? t.stages : defaultStages()); }}>Edit</button>
                    <button className="text-xs text-destructive" onClick={() => del.mutate(t.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={`${stitchCardClass} space-y-4 p-6`}>
          <h3 className="font-semibold">{editing ? "Edit template" : "New template"}</h3>
          <input className={stitchFieldClass} value={name} onChange={(e) => setName(e.target.value)} />
          <table className="w-full border-separate border-spacing-x-3 border-spacing-y-3 text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="px-1 py-2 font-medium">Order</th>
                <th className="px-1 py-2 font-medium">Source</th>
                <th className="px-1 py-2 font-medium">Status</th>
                <th className="px-1 py-2 font-medium">SLA</th>
                <th className="px-1 py-2 font-medium">Skip unresolved</th>
                <th className="px-1 py-2 font-medium">Optional</th>
                <th className="px-1 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {stages.map((s, i) => (
                <tr key={i}>
                  <td className="px-1 align-middle">{s.order}</td>
                  <td className="px-1 align-middle">
                    <select className={stitchSelectClass} value={s.approver_source} onChange={(e) => {
                      const next = [...stages];
                      next[i] = { ...s, approver_source: e.target.value as WorkflowApproverSource };
                      setStages(next);
                    }}>{SOURCES.map((x) => <option key={x}>{x}</option>)}</select>
                  </td>
                  <td className="px-1 align-middle">
                    <select className={stitchSelectClass} value={s.status_code} onChange={(e) => {
                      const next = [...stages];
                      next[i] = { ...s, status_code: e.target.value };
                      setStages(next);
                    }}>{STATUS_CODES.map((x) => <option key={x}>{x}</option>)}</select>
                  </td>
                  <td className="px-1 align-middle">
                    <input className={stitchFieldClass} type="number" value={s.sla_hours ?? ""} onChange={(e) => {
                      const next = [...stages];
                      next[i] = { ...s, sla_hours: e.target.value === "" ? null : Number(e.target.value) };
                      setStages(next);
                    }} />
                  </td>
                  <td className="px-1 text-center align-middle"><input type="checkbox" checked={!!s.skip_if_unresolved} onChange={(e) => {
                    const next = [...stages];
                    next[i] = { ...s, skip_if_unresolved: e.target.checked };
                    setStages(next);
                  }} /></td>
                  <td className="px-1 text-center align-middle"><input type="checkbox" checked={!!s.is_optional} onChange={(e) => {
                    const next = [...stages];
                    next[i] = { ...s, is_optional: e.target.checked };
                    setStages(next);
                  }} /></td>
                  <td className="px-1 align-middle whitespace-nowrap">
                    <button type="button" className="mr-2 rounded px-1.5 py-1 hover:bg-muted" onClick={() => move(i, -1)}>↑</button>
                    <button type="button" className="rounded px-1.5 py-1 hover:bg-muted" onClick={() => move(i, 1)}>↓</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={() => {
            const payload = { name, stages, mode: "SEQUENTIAL" as const, is_active: true, reason: "workflow editor" };
            if (editing) update.mutate({ id: editing.id, payload });
            else create.mutate(payload);
          }}>{editing ? "Save" : "Create"}</button>
        </div>

        <div className={`${stitchCardClass} space-y-3 p-6`}>
          <h3 className="font-semibold">Simulate</h3>
          <UserSearchField label="Employee" value={simEmp} onChange={(id) => setSimEmp(id)} />
          <select className={stitchSelectClass} value={simType} onChange={(e) => setSimType(e.target.value)}>
            <option value="">Leave type (optional)</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button className="rounded-lg border px-3 py-2 text-sm" disabled={!editing || !simEmp} onClick={() => editing && simEmp && simulate.mutate({ id: editing.id, payload: { employee: simEmp, leave_type: simType || undefined } })}>
            Simulate selected template
          </button>
          {simulate.data && <pre className="overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(simulate.data, null, 2)}</pre>}
        </div>
    </div>
  );
}
