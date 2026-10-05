"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { PolicyForm, policyToForm } from "@/components/hrm/leave/PolicyForm";
import { FieldLabel } from "@/components/hrm/forms/FieldLabel";
import { Button } from "@/components/ui/button";
import {
  SettingsConfirmDialog,
  SettingsLiveRegion,
  SettingsQueryPanel,
} from "@/components/hrm/leave/SettingsDialog";
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
import {
  assignmentScopeLabel,
  formatDiffValue,
  mutationErrorMessage,
  policyFieldLabel,
  policyStatusLabel,
} from "@/lib/leave/settings-labels";
import type { AssignmentScopeType, LeavePolicyWritePayload } from "@/lib/types/leave";

type ConfirmKind = "publish" | "archive" | "delete";

export default function LeavePolicyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const formId = useId();
  const { data: policy, isLoading, isError, refetch } = useLeavePolicy(id);
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
  const [liveMessage, setLiveMessage] = useState("");
  const [confirm, setConfirm] = useState<ConfirmKind | null>(null);

  useEffect(() => {
    if (policy) setForm(policyToForm(policy));
  }, [policy]);

  const activeSibling = useMemo(() => {
    if (!policy) return null;
    return (
      allPolicies.find(
        (p) => p.leave_type === policy.leave_type && p.status === "ACTIVE" && p.id !== policy.id
      ) ?? null
    );
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
      .map((k) => ({
        key: String(k),
        from: String(activeSibling[k]),
        to: String(policy[k]),
      }));
  }, [policy, activeSibling]);

  const isDraft = policy?.status === "DRAFT";
  const readOnly = !isDraft;
  const isMutating =
    update.isPending ||
    publish.isPending ||
    archive.isPending ||
    clone.isPending ||
    del.isPending;

  async function saveDraft(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form) return;
    try {
      await update.mutateAsync(form);
      setLiveMessage("Draft saved.");
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not save this draft. Try again."));
    }
  }

  async function onClone() {
    setError(null);
    try {
      const copy = await clone.mutateAsync({ id, reason: reason || undefined });
      setLiveMessage("Opened a draft copy.");
      router.push(`/leave/settings/policies/${copy.id}`);
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not clone this policy. Try again."));
    }
  }

  async function onPublish() {
    setError(null);
    if (!reason.trim()) {
      setError("Publishing needs a reason for the audit log.");
      setConfirm(null);
      return;
    }
    try {
      await publish.mutateAsync({ id, reason, keep_existing_active: keepExisting });
      setLiveMessage("Policy published.");
      setConfirm(null);
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not publish this policy. Try again."));
      setConfirm(null);
    }
  }

  async function onArchive() {
    setError(null);
    try {
      await archive.mutateAsync({ id, reason: reason || undefined });
      setLiveMessage("Policy archived.");
      setConfirm(null);
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not archive this policy. Try again."));
      setConfirm(null);
    }
  }

  async function onDelete() {
    setError(null);
    try {
      await del.mutateAsync(id);
      setLiveMessage("Draft deleted.");
      router.push("/leave/settings/policies");
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not delete this draft. Try again."));
      setConfirm(null);
    }
  }

  return (
    <div className="space-y-6">
      <SettingsQueryPanel
        isLoading={isLoading || (!!policy && !form)}
        isError={isError || (!isLoading && !policy)}
        onRetry={() => void refetch()}
        errorTitle="Could not load this policy."
        errorHint="It may have been deleted, or the connection failed."
      >
        {policy && form ? (
          <>
            <PageHeader
              className="mb-0"
              title={policy.name}
              subtitle={`${policyStatusLabel(policy.status)} · version ${policy.version} · ${policy.leave_type_detail?.name ?? "Leave type"}`}
            />

            {readOnly ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-body-md text-amber-900">
                This version is published. Clone it to change the rules. Existing approved leave is
                not recalculated.
              </div>
            ) : null}

            {error ? (
              <p
                className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-body-md text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <form onSubmit={saveDraft} className={`${stitchCardClass} space-y-6 p-6`}>
              <PolicyForm
                form={form}
                setForm={setForm}
                types={types}
                lockLeaveType
                readOnly={readOnly}
              />
              {isDraft ? (
                <Button
                  type="submit"
                  size="lg"
                  className="min-h-11 rounded-xl px-6"
                  disabled={update.isPending}
                >
                  {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                  Save draft
                </Button>
              ) : null}
            </form>

            {isDraft && diffs.length > 0 ? (
              <div className={`${stitchCardClass} p-6`}>
                <h3 className="text-title-sm font-semibold text-on-surface">
                  Changes versus the current active policy
                </h3>
                <ul className="mt-2 list-disc pl-5 text-body-md text-on-surface">
                  {diffs.map((d) => (
                    <li key={d.key}>
                      {policyFieldLabel(d.key)}: {formatDiffValue(d.from)} → {formatDiffValue(d.to)}
                    </li>
                  ))}
                </ul>
                {form.annual_entitlement !== activeSibling?.annual_entitlement ? (
                  <p className="mt-2 text-body-md text-amber-800">
                    Existing employee balances for the year are not updated automatically. Only new
                    balance rows pick up the new entitlement.
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className={`${stitchCardClass} space-y-3 p-6`}>
              <h3 className="text-title-sm font-semibold text-on-surface">Actions</h3>
              <div>
                <FieldLabel htmlFor={`${formId}-reason`}>
                  Reason {isDraft ? "(required to publish)" : ""}
                </FieldLabel>
                <input
                  id={`${formId}-reason`}
                  className={stitchFieldClass}
                  value={reason}
                  autoComplete="off"
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              {isDraft ? (
                <label
                  htmlFor={`${formId}-keep`}
                  className="flex min-h-11 items-center gap-2 text-body-md text-on-surface"
                >
                  <input
                    id={`${formId}-keep`}
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={keepExisting}
                    onChange={(e) => setKeepExisting(e.target.checked)}
                  />
                  Keep the current active policy (for a departmental pack beside the org default)
                </label>
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="min-h-11 rounded-xl"
                  disabled={clone.isPending}
                  onClick={() => void onClone()}
                >
                  Clone
                </Button>
                {isDraft ? (
                  <Button
                    type="button"
                    size="lg"
                    className="min-h-11 rounded-xl"
                    onClick={() => setConfirm("publish")}
                  >
                    Publish
                  </Button>
                ) : null}
                {policy.status !== "ARCHIVED" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="min-h-11 rounded-xl"
                    onClick={() => setConfirm("archive")}
                  >
                    Archive
                  </Button>
                ) : null}
                {isDraft ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="lg"
                    className="min-h-11 rounded-xl"
                    onClick={() => setConfirm("delete")}
                  >
                    Delete draft
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="min-h-11 rounded-xl"
                  onClick={() => setShowImpact(true)}
                >
                  Who this covers
                </Button>
              </div>
              {showImpact && impact ? (
                <div className="mt-4 text-body-md">
                  <p>
                    {impact.employee_count}{" "}
                    {impact.employee_count === 1 ? "employee currently resolves" : "employees currently resolve"}{" "}
                    to this policy.
                  </p>
                  <p className="mt-1 text-on-surface-variant">
                    Existing balances are not reallocated. Pending holds stay on the employee’s
                    current year balance for this leave type.
                  </p>
                  <ul className="mt-2 max-h-40 space-y-1 overflow-auto">
                    {impact.employees.slice(0, 20).map((e) => (
                      <li key={e.id}>
                        {e.email}
                        {e.assignment_scope
                          ? ` · ${assignmentScopeLabel(e.assignment_scope as AssignmentScopeType)}`
                          : ""}
                      </li>
                    ))}
                  </ul>
                  {impact.truncated ? <p>List truncated.</p> : null}
                </div>
              ) : null}
            </div>

            <div className={`${stitchCardClass} p-6`}>
              <h3 className="mb-3 text-title-sm font-semibold text-on-surface">Audit</h3>
              <ul className="space-y-2 text-body-md">
                {audit.map((row) => (
                  <li key={row.id} className="border-b border-outline-variant py-2 last:border-b-0">
                    <span className="font-medium">{row.action}</span>{" "}
                    {row.actor
                      ? `${row.actor.first_name} ${row.actor.last_name}`
                      : "system"}{" "}
                    · {new Date(row.created_at).toLocaleString("en-GB")}
                    {row.reason ? (
                      <span className="block text-on-surface-variant">{row.reason}</span>
                    ) : null}
                  </li>
                ))}
                {audit.length === 0 ? (
                  <li className="text-on-surface-variant">No audit rows yet.</li>
                ) : null}
              </ul>
            </div>
          </>
        ) : null}
      </SettingsQueryPanel>

      <SettingsLiveRegion message={liveMessage} />

      {confirm ? (
        <SettingsConfirmDialog
          title={
            confirm === "publish"
              ? "Publish this policy?"
              : confirm === "archive"
                ? "Archive this policy?"
                : "Delete this draft?"
          }
          body={
            confirm === "publish"
              ? keepExisting
                ? "The current active policy stays available as a departmental pack. Existing approved leave is not recalculated."
                : "Publishing archives the current unassigned active policy for this leave type. Existing approved leave is not recalculated."
              : confirm === "archive"
                ? "Staff will stop resolving to this version. Existing approved leave is unchanged."
                : "This draft will be removed. This cannot be undone."
          }
          confirmLabel={
            confirm === "publish" ? "Publish" : confirm === "archive" ? "Archive" : "Delete draft"
          }
          destructive={confirm === "delete"}
          isPending={isMutating}
          onClose={() => {
            if (!isMutating) setConfirm(null);
          }}
          onConfirm={() => {
            if (confirm === "publish") void onPublish();
            else if (confirm === "archive") void onArchive();
            else void onDelete();
          }}
        />
      ) : null}
    </div>
  );
}
