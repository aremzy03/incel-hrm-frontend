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
  useLeaveWorkflows,
  useCreateLeaveWorkflow,
  useUpdateLeaveWorkflow,
  useDeleteLeaveWorkflow,
  useSimulateWorkflow,
} from "@/lib/api/leave-settings";
import { useLeaveTypes } from "@/lib/api/leave-types";
import {
  approverSourceLabel,
  mutationErrorMessage,
  workflowStatusLabel,
} from "@/lib/leave/settings-labels";
import type {
  LeaveWorkflowStage,
  LeaveWorkflowTemplate,
  WorkflowApproverSource,
} from "@/lib/types/leave";
import { cn } from "@/lib/utils";

const SOURCES: WorkflowApproverSource[] = [
  "TEAM_LEAD",
  "SUPERVISOR",
  "LINE_MANAGER",
  "HR",
  "EXECUTIVE_DIRECTOR",
  "NAMED_USER",
  "ROLE",
];
const STATUS_CODES = [
  "PENDING_TEAM_LEAD",
  "PENDING_SUPERVISOR",
  "PENDING_MANAGER",
  "PENDING_HR",
  "PENDING_ED",
];

const TABLE_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "default", label: "Org default" },
  { key: "state", label: "State" },
  { key: "actions", label: "Actions" },
];

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
  const formId = useId();
  const { data: templates = [], isLoading, isError, refetch } = useLeaveWorkflows();
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
  const [formError, setFormError] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<LeaveWorkflowTemplate | null>(null);

  const isSaving = create.isPending || update.isPending;

  function resetEditor() {
    setEditing(null);
    setName("Custom chain");
    setStages(defaultStages());
    setFormError(null);
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= stages.length) return;
    const next = [...stages];
    [next[i], next[j]] = [next[j], next[i]];
    setStages(next.map((s, idx) => ({ ...s, order: idx + 1 })));
  }

  function patchStage(i: number, partial: Partial<LeaveWorkflowStage>) {
    const next = [...stages];
    next[i] = { ...next[i], ...partial };
    setStages(next);
  }

  async function onSave() {
    setFormError(null);
    if (!name.trim()) {
      setFormError("Enter a template name.");
      return;
    }
    const payload = {
      name: name.trim(),
      stages,
      mode: "SEQUENTIAL" as const,
      is_active: true,
      reason: "workflow editor",
    };
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, payload });
        setLiveMessage(`Saved ${name.trim()}.`);
      } else {
        await create.mutateAsync(payload);
        setLiveMessage(`Created ${name.trim()}.`);
      }
      resetEditor();
    } catch (err) {
      setFormError(mutationErrorMessage(err, "Could not save this template. Try again."));
    }
  }

  async function onDelete(row: LeaveWorkflowTemplate) {
    try {
      await del.mutateAsync(row.id);
      setLiveMessage(`Deleted ${row.name}.`);
      setDeleteTarget(null);
      if (editing?.id === row.id) resetEditor();
    } catch (err) {
      setFormError(mutationErrorMessage(err, "Could not delete this template. Try again."));
      setDeleteTarget(null);
    }
  }

  async function onSimulate() {
    if (!editing || !simEmp) return;
    try {
      await simulate.mutateAsync({
        id: editing.id,
        payload: { employee: simEmp, leave_type: simType || undefined },
      });
      setLiveMessage("Simulation ready.");
    } catch (err) {
      setFormError(mutationErrorMessage(err, "Could not simulate this template."));
    }
  }

  const emptyMessage = "No approval templates yet. Create the sequential chain staff requests use.";

  const table = (
    <DataTable
      columns={TABLE_COLUMNS}
      emptyMessage={emptyMessage}
      className={templates.length > 0 ? "rounded-none border-0 [box-shadow:none]" : undefined}
      getRowLabel={(i) => templates[i]?.name}
      rows={templates.map((t) => ({
        name: <span className="font-medium text-on-surface">{t.name}</span>,
        default: t.is_org_default ? "Yes" : "No",
        state: <StatusBadge status={t.is_active ? "Active" : "Inactive"} />,
        actions: (
          <div className="relative z-[2] flex flex-col items-start">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-11 px-3"
              onClick={() => {
                setEditing(t);
                setName(t.name);
                setStages(t.stages?.length ? t.stages : defaultStages());
                setFormError(null);
              }}
              aria-label={`Edit ${t.name}`}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="min-h-11 px-3"
              onClick={() => setDeleteTarget(t)}
              aria-label={`Delete ${t.name}`}
            >
              Delete
            </Button>
          </div>
        ),
      }))}
    />
  );

  const simRows = simulate.data?.resolved_approvers ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        className="mb-0"
        title="Approval workflows"
        subtitle="Sequential only. Editing a live template does not change requests already submitted."
      />

      <section className="space-y-3" aria-labelledby="workflow-list-heading">
        <h2 id="workflow-list-heading" className="text-title-sm font-semibold text-on-surface">
          Templates
        </h2>
        <SettingsQueryPanel
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
          errorTitle="Could not load approval workflows."
          errorHint="Check your connection and try again."
        >
          {templates.length > 0 ? (
            <div className={cn(stitchCardClass, "overflow-hidden")}>
              <div className="hidden md:block">{table}</div>
              <ul className="divide-y divide-outline-variant md:hidden">
                {templates.map((t) => (
                  <li key={t.id} className="flex flex-col gap-3 px-4 py-4">
                    <p className="font-medium text-on-surface">{t.name}</p>
                    <p className="text-body-md text-on-surface-variant">
                      {t.is_org_default ? "Organisation default · " : ""}
                      {t.is_active ? "Active" : "Inactive"}
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="min-h-11 rounded-xl"
                        onClick={() => {
                          setEditing(t);
                          setName(t.name);
                          setStages(t.stages?.length ? t.stages : defaultStages());
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="lg"
                        className="min-h-11 rounded-xl"
                        onClick={() => setDeleteTarget(t)}
                      >
                        Delete
                      </Button>
                    </div>
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

      <section className={`${stitchCardClass} space-y-4 p-6`} aria-labelledby="workflow-editor-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h2 id="workflow-editor-heading" className="text-title-sm font-semibold text-on-surface">
            {editing ? `Edit ${editing.name}` : "New template"}
          </h2>
          {editing ? (
            <Button type="button" variant="outline" className="min-h-11 rounded-xl" onClick={resetEditor}>
              Cancel edit
            </Button>
          ) : null}
        </div>
        {formError ? (
          <p
            className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-body-md text-destructive"
            role="alert"
          >
            {formError}
          </p>
        ) : null}
        <div>
          <FieldLabel htmlFor={`${formId}-name`}>Template name</FieldLabel>
          <input
            id={`${formId}-name`}
            className={stitchFieldClass}
            value={name}
            autoComplete="off"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <ol className="space-y-4">
          {stages.map((s, i) => (
            <li key={`${s.order}-${i}`} className="rounded-xl bg-surface-container-low p-4">
              <p className="text-label-md text-on-surface-variant">Stage {s.order}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <FieldLabel htmlFor={`${formId}-src-${i}`}>Approver</FieldLabel>
                  <select
                    id={`${formId}-src-${i}`}
                    className={stitchSelectClass}
                    value={s.approver_source}
                    onChange={(e) =>
                      patchStage(i, { approver_source: e.target.value as WorkflowApproverSource })
                    }
                  >
                    {SOURCES.map((x) => (
                      <option key={x} value={x}>
                        {approverSourceLabel(x)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel htmlFor={`${formId}-status-${i}`}>Request status</FieldLabel>
                  <select
                    id={`${formId}-status-${i}`}
                    className={stitchSelectClass}
                    value={s.status_code}
                    onChange={(e) => patchStage(i, { status_code: e.target.value })}
                  >
                    {STATUS_CODES.map((x) => (
                      <option key={x} value={x}>
                        {workflowStatusLabel(x)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel htmlFor={`${formId}-sla-${i}`} optional>
                    SLA hours
                  </FieldLabel>
                  <input
                    id={`${formId}-sla-${i}`}
                    className={stitchFieldClass}
                    type="number"
                    min={0}
                    value={s.sla_hours ?? ""}
                    onChange={(e) =>
                      patchStage(i, {
                        sla_hours: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>
                {s.approver_source === "NAMED_USER" ? (
                  <UserSearchField
                    label="Named person"
                    value={s.named_user ?? null}
                    onChange={(id) => patchStage(i, { named_user: id })}
                  />
                ) : null}
                {s.approver_source === "ROLE" ? (
                  <div>
                    <FieldLabel htmlFor={`${formId}-role-${i}`}>Role name</FieldLabel>
                    <input
                      id={`${formId}-role-${i}`}
                      className={stitchFieldClass}
                      value={s.role_name ?? ""}
                      onChange={(e) => patchStage(i, { role_name: e.target.value })}
                    />
                  </div>
                ) : null}
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <label
                  htmlFor={`${formId}-skip-${i}`}
                  className="flex min-h-11 items-center gap-2 text-body-md"
                >
                  <input
                    id={`${formId}-skip-${i}`}
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={!!s.skip_if_unresolved}
                    onChange={(e) => patchStage(i, { skip_if_unresolved: e.target.checked })}
                  />
                  Skip if no approver is found
                </label>
                <label
                  htmlFor={`${formId}-optional-${i}`}
                  className="flex min-h-11 items-center gap-2 text-body-md"
                >
                  <input
                    id={`${formId}-optional-${i}`}
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={!!s.is_optional}
                    onChange={(e) => patchStage(i, { is_optional: e.target.checked })}
                  />
                  Optional stage
                </label>
              </div>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 rounded-xl"
                  onClick={() => move(i, -1)}
                  aria-label={`Move stage ${s.order} up`}
                >
                  Move up
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 rounded-xl"
                  onClick={() => move(i, 1)}
                  aria-label={`Move stage ${s.order} down`}
                >
                  Move down
                </Button>
              </div>
            </li>
          ))}
        </ol>
        <Button
          type="button"
          size="lg"
          className="min-h-11 rounded-xl px-6"
          disabled={isSaving}
          onClick={() => void onSave()}
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {editing ? "Save template" : "Create template"}
        </Button>
      </section>

      <div className={`${stitchCardClass} space-y-3 p-6`}>
        <h3 className="text-title-sm font-semibold text-on-surface">Simulate</h3>
        <p className="text-body-md text-on-surface-variant">
          Preview who would approve for an employee. Select a template above first.
        </p>
        <UserSearchField label="Employee" value={simEmp} onChange={(id) => setSimEmp(id)} />
        <div>
          <FieldLabel htmlFor={`${formId}-sim-type`} optional>
            Leave type
          </FieldLabel>
          <select
            id={`${formId}-sim-type`}
            className={stitchSelectClass}
            value={simType}
            onChange={(e) => setSimType(e.target.value)}
          >
            <option value="">Any type</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-11 rounded-xl"
          disabled={!editing || !simEmp || simulate.isPending}
          onClick={() => void onSimulate()}
        >
          {simulate.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Simulate selected template
        </Button>
        {simRows.length > 0 ? (
          <ol className="space-y-2 text-body-md">
            {simRows.map((row, i) => (
              <li key={`${row.status_code}-${i}`} className="rounded-xl bg-surface-container-low px-4 py-3">
                <p className="font-medium">
                  Stage {row.stage ?? i + 1}
                  {row.status_code ? ` · ${workflowStatusLabel(row.status_code)}` : ""}
                </p>
                <p className="text-on-surface-variant">
                  {row.user ? `${row.user.first_name} ${row.user.last_name}`.trim() : row.email || "Unresolved"}
                </p>
              </li>
            ))}
          </ol>
        ) : simulate.data ? (
          <p className="text-body-md text-on-surface-variant">No approvers resolved for this employee.</p>
        ) : null}
      </div>

      <SettingsLiveRegion
        message={
          isError ? "Could not load approval workflows." : `${liveMessage} ${templates.length} templates.`
        }
      />

      {deleteTarget ? (
        <SettingsConfirmDialog
          title={`Delete ${deleteTarget.name}?`}
          body="Requests already in flight keep their current chain. New requests will use another active template or the organisation default."
          confirmLabel="Delete template"
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
