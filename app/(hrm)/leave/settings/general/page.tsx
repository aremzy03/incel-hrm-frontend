"use client";

import { useEffect, useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { DataTable } from "@/components/hrm/ui/DataTable";
import { FieldLabel } from "@/components/hrm/forms/FieldLabel";
import { Button } from "@/components/ui/button";
import {
  SettingsLiveRegion,
  SettingsQueryPanel,
} from "@/components/hrm/leave/SettingsDialog";
import { stitchCardClass, stitchFieldClass, stitchSelectClass } from "@/lib/design/field-styles";
import { useLeaveSettings, usePatchLeaveSettings } from "@/lib/api/leave-settings";
import { useAccrualPreview } from "@/lib/api/leave-policies";
import { useLeaveBalances, useAdjustLeaveBalance, useBalanceTransactions } from "@/lib/api/leave";
import { formatLeaveDays } from "@/lib/leave/format";
import {
  crossYearLabel,
  leaveYearLabel,
  MONTH_NAMES,
  mutationErrorMessage,
} from "@/lib/leave/settings-labels";
import type { CrossYearRule, LeaveSettings, LeaveYearType } from "@/lib/types/leave";

const YEAR_TYPES: LeaveYearType[] = ["CALENDAR", "FISCAL", "ANNIVERSARY"];

const NOTIFY_FLAGS = [
  ["notify_applicant_on_submit", "Email the applicant when they submit"],
  ["notify_applicant_on_decision", "Email the applicant when a decision is made"],
  ["notify_approver", "Email the next approver"],
  ["notify_reliever", "Email the reliever"],
  ["notify_department_reminder", "Department reminder"],
] as const;

const APPROVAL_FLAGS = [
  ["allow_hr_override", "Allow HR to override policy checks"],
  ["prevent_self_approval", "Prevent people approving their own request"],
] as const;

function transactionLabel(type: string): string {
  switch (type) {
    case "DEDUCT":
      return "Deducted";
    case "REFUND":
      return "Refunded";
    case "ADJUST":
      return "Adjusted";
    case "RESERVE":
      return "Reserved";
    case "RELEASE":
      return "Released";
    case "ACCRUAL":
      return "Accrued";
    case "CARRY_FORWARD":
      return "Carried forward";
    default:
      return type;
  }
}

export default function LeaveSettingsPage() {
  const formId = useId();
  const { data, isLoading, isError, refetch } = useLeaveSettings();
  const patch = usePatchLeaveSettings();
  const preview = useAccrualPreview();
  const [form, setForm] = useState<Partial<LeaveSettings> & { reason?: string }>({});
  const [balanceId, setBalanceId] = useState("");
  const [delta, setDelta] = useState("");
  const [adjReason, setAdjReason] = useState("");
  const [adjDate, setAdjDate] = useState("");
  const adjust = useAdjustLeaveBalance();
  const { data: txs = [] } = useBalanceTransactions(balanceId, !!balanceId);
  const { data: balances = [] } = useLeaveBalances();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);
  const [adjError, setAdjError] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("");

  useEffect(() => {
    if (data) setForm({ ...data, reason: "" });
  }, [data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaveOk(null);
    try {
      await patch.mutateAsync(form);
      const msg =
        "Settings saved. This does not change existing balances or approved leave day counts.";
      setSaveOk(msg);
      setLiveMessage(msg);
    } catch (err) {
      setSaveError(mutationErrorMessage(err, "Could not save settings. Try again."));
    }
  }

  async function onAdjust() {
    setAdjError(null);
    if (!balanceId) {
      setAdjError("Choose a balance to adjust.");
      return;
    }
    if (!delta.trim()) {
      setAdjError("Enter how many days to add or subtract.");
      return;
    }
    if (!adjReason.trim()) {
      setAdjError("A reason is required for the audit log.");
      return;
    }
    try {
      await adjust.mutateAsync({
        id: balanceId,
        payload: { delta, reason: adjReason, effective_date: adjDate || undefined },
      });
      setLiveMessage("Balance adjusted.");
      setDelta("");
      setAdjReason("");
    } catch (err) {
      setAdjError(mutationErrorMessage(err, "Could not adjust this balance. Try again."));
    }
  }

  async function onPreview() {
    try {
      await preview.mutateAsync({
        year: new Date().getFullYear() + 1,
        include_rollover: true,
        include_monthly: true,
        include_carry_expiry: true,
      });
      setLiveMessage("Accrual preview ready.");
    } catch (err) {
      setSaveError(mutationErrorMessage(err, "Could not preview next year’s accrual."));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        className="mb-0"
        title="General leave settings"
        subtitle="Organisation-wide year, notifications, SLA fallback, and encashment."
      />

      <SettingsQueryPanel
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        errorTitle="Could not load general leave settings."
        errorHint="Check your connection and try again."
      >
        <form onSubmit={save} className={`${stitchCardClass} space-y-8 p-6`}>
          {saveError ? (
            <p
              className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-body-md text-destructive"
              role="alert"
            >
              {saveError}
            </p>
          ) : null}
          {saveOk ? (
            <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-body-md text-green-800">
              {saveOk}
            </p>
          ) : null}

          <fieldset className="space-y-3">
            <legend className="text-title-sm font-semibold text-on-surface">Leave year</legend>
            {YEAR_TYPES.map((t) => (
              <label key={t} className="flex min-h-11 items-center gap-2 text-body-md">
                <input
                  type="radio"
                  name={`${formId}-year`}
                  className="h-4 w-4 accent-primary"
                  checked={form.leave_year_type === t}
                  onChange={() => setForm((f) => ({ ...f, leave_year_type: t }))}
                />
                {leaveYearLabel(t)}
              </label>
            ))}
            {form.leave_year_type === "FISCAL" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor={`${formId}-month`}>Fiscal year starts in</FieldLabel>
                  <select
                    id={`${formId}-month`}
                    className={stitchSelectClass}
                    value={form.leave_year_start_month ?? 1}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, leave_year_start_month: Number(e.target.value) }))
                    }
                  >
                    {MONTH_NAMES.map((label, i) => (
                      <option key={label} value={i + 1}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel htmlFor={`${formId}-day`}>Start day</FieldLabel>
                  <input
                    id={`${formId}-day`}
                    type="number"
                    min={1}
                    max={31}
                    className={stitchFieldClass}
                    value={form.leave_year_start_day ?? 1}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, leave_year_start_day: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>
            ) : null}
            {form.leave_year_type === "ANNIVERSARY" ? (
              <p className="text-body-md text-on-surface-variant">
                Organisation rollover stays 1 January. Per-hire accrual is still set on the policy.
              </p>
            ) : null}
            <div>
              <FieldLabel htmlFor={`${formId}-tz`}>Timezone</FieldLabel>
              <input
                id={`${formId}-tz`}
                className={stitchFieldClass}
                value={form.default_timezone ?? ""}
                autoComplete="off"
                onChange={(e) => setForm((f) => ({ ...f, default_timezone: e.target.value }))}
              />
            </div>
            <div>
              <FieldLabel htmlFor={`${formId}-cross`}>Leave that crosses a year end</FieldLabel>
              <select
                id={`${formId}-cross`}
                className={stitchSelectClass}
                value={form.cross_year_deduction_rule ?? "SPLIT"}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    cross_year_deduction_rule: e.target.value as CrossYearRule,
                  }))
                }
              >
                <option value="SPLIT">{crossYearLabel("SPLIT")}</option>
                <option value="START_YEAR">{crossYearLabel("START_YEAR")}</option>
              </select>
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-title-sm font-semibold text-on-surface">Notifications</legend>
            {NOTIFY_FLAGS.map(([key, label]) => (
              <label key={key} className="flex min-h-11 items-center gap-2 text-body-md">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={!!form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                />
                {label}
              </label>
            ))}
            <div>
              <FieldLabel htmlFor={`${formId}-lead`}>Reminder lead hours</FieldLabel>
              <input
                id={`${formId}-lead`}
                type="number"
                min={0}
                className={stitchFieldClass}
                value={form.reminder_lead_hours ?? 24}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reminder_lead_hours: Number(e.target.value) }))
                }
              />
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-title-sm font-semibold text-on-surface">Approvals</legend>
            {APPROVAL_FLAGS.map(([key, label]) => (
              <label key={key} className="flex min-h-11 items-center gap-2 text-body-md">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={!!form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                />
                {label}
              </label>
            ))}
            <p className="text-body-md text-on-surface-variant">
              Do not block self-approval without checking whether HR or managers ever approve their
              own requests.
            </p>
            <div>
              <FieldLabel htmlFor={`${formId}-sla`} optional>
                Approval SLA hours
              </FieldLabel>
              <input
                id={`${formId}-sla`}
                type="number"
                min={0}
                className={stitchFieldClass}
                value={form.approval_sla_hours ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    approval_sla_hours: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
              />
              <p className="mt-1.5 text-body-md text-on-surface-variant">
                Organisation fallback for reminders only — the system does not auto-approve.
              </p>
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-title-sm font-semibold text-on-surface">Encashment</legend>
            <label className="flex min-h-11 items-center gap-2 text-body-md">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={!!form.encashment_allowed}
                onChange={(e) =>
                  setForm((f) => ({ ...f, encashment_allowed: e.target.checked }))
                }
              />
              Encashment allowed on exit
            </label>
            <div>
              <FieldLabel htmlFor={`${formId}-encash`} optional>
                Encashment max days
              </FieldLabel>
              <input
                id={`${formId}-encash`}
                type="number"
                min={0}
                className={stitchFieldClass}
                value={form.encashment_max_days ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    encashment_max_days: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
              />
            </div>
            <p className="text-body-md text-on-surface-variant">
              If a policy forfeits days on resignation, exit still forfeits even when encashment is
              allowed. There is no payroll posting from this screen.
            </p>
          </fieldset>

          <div>
            <FieldLabel htmlFor={`${formId}-reason`} optional>
              Note for the audit log
            </FieldLabel>
            <input
              id={`${formId}-reason`}
              className={stitchFieldClass}
              value={form.reason ?? ""}
              autoComplete="off"
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" size="lg" className="min-h-11 rounded-xl px-6" disabled={patch.isPending}>
              {patch.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Save settings
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="min-h-11 rounded-xl px-6"
              disabled={patch.isPending || !data}
              onClick={() => {
                if (!data) return;
                setForm({ ...data, reason: "" });
                setSaveError(null);
                setSaveOk(null);
                setLiveMessage("Form reset to last saved settings.");
              }}
            >
              Reset
            </Button>
          </div>
        </form>

        <div className={`${stitchCardClass} space-y-3 p-6`}>
          <h2 className="text-title-sm font-semibold text-on-surface">Accrual preview</h2>
          <p className="text-body-md text-on-surface-variant">
            Preview only. A scheduled job writes balances when it runs.
          </p>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-h-11 rounded-xl"
            disabled={preview.isPending}
            onClick={() => void onPreview()}
          >
            {preview.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Preview next year
          </Button>
          {preview.data ? (
            <div className="space-y-3">
              <p className="text-body-md">
                {preview.data.action_count}{" "}
                {preview.data.action_count === 1 ? "action" : "actions"}
              </p>
              <DataTable
                columns={[
                  { key: "email", label: "Email" },
                  { key: "type", label: "Type" },
                  { key: "days", label: "Days" },
                  { key: "action", label: "Action" },
                ]}
                emptyMessage="No accrual actions in this preview."
                rows={preview.data.actions.slice(0, 30).map((a) => ({
                  email: String(a.email ?? a.employee ?? "—"),
                  type: String(a.leave_type ?? "—"),
                  days: formatLeaveDays(a.days as number),
                  action: String(a.action ?? "—"),
                }))}
              />
            </div>
          ) : null}
        </div>

        <div className={`${stitchCardClass} space-y-3 p-6`}>
          <h2 className="text-title-sm font-semibold text-on-surface">Balance adjustment</h2>
          <p className="text-body-md text-on-surface-variant">
            HR-only. This list is your own balances. Adjusting someone else still happens from
            their personnel record. Never edit allocated or used totals directly.
          </p>
          {adjError ? (
            <p
              className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-body-md text-destructive"
              role="alert"
            >
              {adjError}
            </p>
          ) : null}
          <div>
            <FieldLabel htmlFor={`${formId}-balance`}>Balance</FieldLabel>
            <select
              id={`${formId}-balance`}
              className={stitchSelectClass}
              value={balanceId}
              onChange={(e) => setBalanceId(e.target.value)}
            >
              <option value="">Choose a balance</option>
              {balances.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.leave_type.name} · {b.year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor={`${formId}-delta`}>Days to add or subtract</FieldLabel>
            <input
              id={`${formId}-delta`}
              className={stitchFieldClass}
              value={delta}
              placeholder="e.g. 3 or -1.5"
              onChange={(e) => setDelta(e.target.value)}
            />
          </div>
          <div>
            <FieldLabel htmlFor={`${formId}-adj-reason`}>Reason</FieldLabel>
            <input
              id={`${formId}-adj-reason`}
              className={stitchFieldClass}
              value={adjReason}
              autoComplete="off"
              onChange={(e) => setAdjReason(e.target.value)}
            />
          </div>
          <div>
            <FieldLabel htmlFor={`${formId}-adj-date`} optional>
              Effective date
            </FieldLabel>
            <input
              id={`${formId}-adj-date`}
              type="date"
              lang="en-GB"
              className={stitchFieldClass}
              value={adjDate}
              onChange={(e) => setAdjDate(e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-h-11 rounded-xl"
            disabled={adjust.isPending}
            onClick={() => void onAdjust()}
          >
            {adjust.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Adjust balance
          </Button>
          {txs.length > 0 ? (
            <DataTable
              columns={[
                { key: "type", label: "Type" },
                { key: "alloc", label: "Allocated" },
                { key: "used", label: "Used" },
                { key: "reason", label: "Reason" },
                { key: "when", label: "When" },
              ]}
              rows={txs.map((t) => ({
                type: transactionLabel(t.transaction_type),
                alloc: formatLeaveDays(t.delta_allocated_days),
                used: formatLeaveDays(t.delta_used_days),
                reason: t.reason || "—",
                when: new Date(t.created_at).toLocaleString("en-GB"),
              }))}
            />
          ) : null}
        </div>
      </SettingsQueryPanel>

      <SettingsLiveRegion message={liveMessage} />
    </div>
  );
}
