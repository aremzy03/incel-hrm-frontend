"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { PolicyForm, policyToForm } from "@/components/hrm/leave/PolicyForm";
import { stitchCardClass, stitchFieldClass } from "@/lib/design/field-styles";
import {
  useLeavePolicy,
  useUpdateLeavePolicy,
  usePublishLeavePolicy,
  useArchiveLeavePolicy,
  useCloneLeavePolicy,
  useDeleteLeavePolicy,
  usePolicyAuditLog,
  usePolicyImpactPreview,
  useLeavePolicies,
} from "@/lib/api/leave-policies";
import { useLeaveTypes } from "@/lib/api/leave-types";
import type { LeavePolicyWritePayload } from "@/lib/types/leave";

export default function LeavePolicyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: policy, isLoading } = useLeavePolicy(id);
  const { data: types = [] } = useLeaveTypes();
  const { data: allPolicies = [] } = useLeavePolicies();
  const { data: audit = [] } = usePolicyAuditLog(id, true);
  const [showImpact, setShowImpact] = useState(false);
  const { data: impact } = usePolicyImpactPreview(id, undefined, showImpact);
  const update = useUpdateLeavePolicy(id);
  const publish = usePublishLeavePolicy();
  const archive = useArchiveLeavePolicy();
  const clone = useCloneLeavePolicy();
  const del = useDeleteLeavePolicy();
  const [form, setForm] = useState<LeavePolicyWritePayload | null>(null);
  const [reason, setReason] = useState("");
  const [keepExisting, setKeepExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (policy) setForm(policyToForm(policy));
  }, [policy]);

  const activeSibling = useMemo(() => {
    if (!policy) return null;
    return allPolicies.find(
      (p) => p.leave_type === policy.leave_type && p.status === "ACTIVE" && p.id !== policy.id
    ) ?? null;
  }, [allPolicies, policy]);

  const diffs = useMemo(() => {
    if (!policy || !activeSibling || policy.status !== "DRAFT") return [];
    const keys: Array<keyof typeof policy> = [
      "annual_entitlement",
      "weekend_excluded",
      "public_holiday_excluded",
      "half_day_allowed",
      "reliever_required",
      "carry_forward",
    ];
    return keys
      .filter((k) => String(policy[k]) !== String(activeSibling[k]))
      .map((k) => `${String(k)}: ${String(activeSibling[k])} → ${String(policy[k])}`);
  }, [policy, activeSibling]);

  if (isLoading || !policy || !form) {
    return <div className="p-8 text-sm text-muted-foreground">Loading policy…</div>;
  }

  const isDraft = policy.status === "DRAFT";
  const readOnly = !isDraft;

  async function saveDraft(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (!form) return;
    await update.mutateAsync(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <div className="space-y-6">
        <PageHeader
          title={policy.name}
          subtitle={`${policy.status} · v${policy.version} · ${policy.leave_type_detail?.name ?? ""}`}
        />

        {readOnly && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Published — clone to change. Do not PATCH ACTIVE policies.
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <form onSubmit={saveDraft} className={`${stitchCardClass} p-6 space-y-6`}>
          <PolicyForm form={form} setForm={setForm} types={types} lockLeaveType readOnly={readOnly} />
          {isDraft && (
            <button type="submit" disabled={update.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Save draft
            </button>
          )}
        </form>

        {isDraft && diffs.length > 0 && (
          <div className={`${stitchCardClass} p-6`}>
            <h3 className="font-semibold">Change summary vs current ACTIVE</h3>
            <ul className="mt-2 list-disc pl-5 text-sm">{diffs.map((d) => <li key={d}>{d}</li>)}</ul>
            {form.annual_entitlement !== activeSibling?.annual_entitlement && (
              <p className="mt-2 text-sm text-amber-800">Existing employee balances for the year are not auto-updated. Only newly created balance rows pick up the new entitlement.</p>
            )}
          </div>
        )}

        <div className={`${stitchCardClass} p-6 space-y-3`}>
          <h3 className="font-semibold">Actions</h3>
          <label className="block text-xs text-muted-foreground">Reason (required to publish)</label>
          <input className={stitchFieldClass} value={reason} onChange={(e) => setReason(e.target.value)} />
          {isDraft && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={keepExisting} onChange={(e) => setKeepExisting(e.target.checked)} />
              Keep existing active (departmental pack beside org default)
            </label>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-lg border px-3 py-2 text-sm"
              onClick={async () => {
                const copy = await clone.mutateAsync({ id, reason: reason || undefined });
                router.push(`/leave/settings/policies/${copy.id}`);
              }}
            >
              Clone
            </button>
            {isDraft && (
              <button
                className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                onClick={async () => {
                  if (!reason.trim()) {
                    setError("Publishing requires a reason.");
                    return;
                  }
                  if (!confirm("Publishing archives the current unassigned active policy for this leave type (unless keep existing is checked). Existing approved leave is not recalculated.")) {
                    return;
                  }
                  try {
                    await publish.mutateAsync({ id, reason, keep_existing_active: keepExisting });
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Publish failed");
                  }
                }}
              >
                Publish
              </button>
            )}
            {policy.status !== "ARCHIVED" && (
              <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => archive.mutate({ id, reason: reason || undefined })}>
                Archive
              </button>
            )}
            {isDraft && (
              <button className="rounded-lg border border-destructive px-3 py-2 text-sm text-destructive" onClick={() => del.mutate(id, { onSuccess: () => router.push("/leave/settings/policies") })}>
                Delete draft
              </button>
            )}
            <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => setShowImpact(true)}>
              Impact preview
            </button>
          </div>
          {showImpact && impact && (
            <div className="mt-4 text-sm">
              <p>{impact.employee_count} employees currently resolve to this policy.</p>
              <p className="mt-1 text-muted-foreground">Existing balances are not auto-reallocated. Pending holds stay on the employee’s current year balance for this leave type.</p>
              <ul className="mt-2 max-h-40 overflow-auto">
                {impact.employees.slice(0, 20).map((e) => (
                  <li key={e.id}>{e.email} ({e.source} / {e.assignment_scope})</li>
                ))}
              </ul>
              {impact.truncated && <p>List truncated.</p>}
            </div>
          )}
        </div>

        <div className={`${stitchCardClass} p-6`}>
          <h3 className="mb-3 font-semibold">Audit</h3>
          <ul className="space-y-2 text-sm">
            {audit.map((row) => (
              <li key={row.id} className="border-b border-border py-2">
                <span className="font-medium">{row.action}</span>{" "}
                {row.actor ? `${row.actor.first_name} ${row.actor.last_name}` : "system"} · {new Date(row.created_at).toLocaleString()}
                {row.reason ? <span className="block text-muted-foreground">{row.reason}</span> : null}
              </li>
            ))}
            {audit.length === 0 && <li className="text-muted-foreground">No audit rows.</li>}
          </ul>
        </div>
    </div>
  );
}
