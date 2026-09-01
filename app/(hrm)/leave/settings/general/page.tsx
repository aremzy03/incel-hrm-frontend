"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { stitchCardClass, stitchFieldClass, stitchSelectClass } from "@/lib/design/field-styles";
import { useLeaveSettings, usePatchLeaveSettings } from "@/lib/api/leave-settings";
import { useAccrualPreview } from "@/lib/api/leave-policies";
import { useLeaveBalances, useAdjustLeaveBalance, useBalanceTransactions } from "@/lib/api/leave";
import { formatLeaveDays } from "@/lib/leave/format";
import type { LeaveSettings, LeaveYearType, CrossYearRule } from "@/lib/types/leave";

export default function LeaveSettingsPage() {
  const { data, isLoading } = useLeaveSettings();
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
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (data) setForm({ ...data, reason: "" });
  }, [data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      await patch.mutateAsync(form);
      setMsg("Settings saved. This does not change existing balances or approved leave day counts.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    }
  }

  if (isLoading) return <p className="p-8 text-sm">Loading…</p>;

  return (
    <div className="space-y-6">
        <PageHeader title="General leave settings" subtitle="Org-wide year, notifications, SLA fallback, and encashment." />
        <form onSubmit={save} className={`${stitchCardClass} space-y-4 p-6`}>
          {msg && <p className="text-sm">{msg}</p>}
          <label className="text-sm font-medium">Leave year</label>
          {(["CALENDAR", "FISCAL", "ANNIVERSARY"] as LeaveYearType[]).map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm">
              <input type="radio" checked={form.leave_year_type === t} onChange={() => setForm((f) => ({ ...f, leave_year_type: t }))} />
              {t}
            </label>
          ))}
          {form.leave_year_type === "FISCAL" && (
            <div className="grid grid-cols-2 gap-3">
              <input type="number" className={stitchFieldClass} value={form.leave_year_start_month ?? 1} onChange={(e) => setForm((f) => ({ ...f, leave_year_start_month: Number(e.target.value) }))} />
              <input type="number" className={stitchFieldClass} value={form.leave_year_start_day ?? 1} onChange={(e) => setForm((f) => ({ ...f, leave_year_start_day: Number(e.target.value) }))} />
            </div>
          )}
          {form.leave_year_type === "ANNIVERSARY" && (
            <p className="text-xs text-muted-foreground">Org rollover stays 1 Jan. Per-hire accrual is still the policy method.</p>
          )}
          <input className={stitchFieldClass} value={form.default_timezone ?? ""} onChange={(e) => setForm((f) => ({ ...f, default_timezone: e.target.value }))} placeholder="Timezone" />
          <select className={stitchSelectClass} value={form.cross_year_deduction_rule ?? "SPLIT"} onChange={(e) => setForm((f) => ({ ...f, cross_year_deduction_rule: e.target.value as CrossYearRule }))}>
            <option value="SPLIT">SPLIT (recommended)</option>
            <option value="START_YEAR">START_YEAR</option>
          </select>
          {([
            ["notify_applicant_on_submit", "Notify applicant on submit"],
            ["notify_applicant_on_decision", "Notify applicant on decision"],
            ["notify_approver", "Notify approver"],
            ["notify_reliever", "Notify reliever"],
            ["notify_department_reminder", "Department reminder"],
            ["allow_hr_override", "Allow HR override"],
            ["prevent_self_approval", "Prevent self-approval"],
            ["encashment_allowed", "Encashment allowed on exit"],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))} />
              {label}
            </label>
          ))}
          <p className="text-xs text-muted-foreground">Do not enable self-approval block without checking whether HR/managers ever approve their own requests.</p>
          <label className="text-xs">Reminder lead hours</label>
          <input type="number" className={stitchFieldClass} value={form.reminder_lead_hours ?? 24} onChange={(e) => setForm((f) => ({ ...f, reminder_lead_hours: Number(e.target.value) }))} />
          <label className="text-xs">Approval SLA hours (org fallback; reminders only — no auto-approve)</label>
          <input type="number" className={stitchFieldClass} value={form.approval_sla_hours ?? ""} onChange={(e) => setForm((f) => ({ ...f, approval_sla_hours: e.target.value === "" ? null : Number(e.target.value) }))} />
          <label className="text-xs">Encashment max days</label>
          <input type="number" className={stitchFieldClass} value={form.encashment_max_days ?? ""} onChange={(e) => setForm((f) => ({ ...f, encashment_max_days: e.target.value === "" ? null : Number(e.target.value) }))} />
          <p className="text-xs text-muted-foreground">If a policy has forfeited_on_resignation, exit forfeits even when encashment is allowed. There is no payroll posting API.</p>
          <input className={stitchFieldClass} placeholder="Reason" value={form.reason ?? ""} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Save</button>
        </form>

        <div className={`${stitchCardClass} space-y-3 p-6`}>
          <h3 className="font-semibold">Accrual preview</h3>
          <p className="text-xs text-muted-foreground">This is a preview. Beat or leave_accrual_rollover --apply writes balances.</p>
          <button
            className="rounded-lg border px-3 py-2 text-sm"
            onClick={() => preview.mutate({ year: new Date().getFullYear() + 1, include_rollover: true, include_monthly: true, include_carry_expiry: true })}
          >
            Preview next year
          </button>
          {preview.data && (
            <div className="text-sm">
              <p>{preview.data.action_count} actions</p>
              <table className="mt-2 w-full text-xs">
                <thead><tr><th className="text-left">Email</th><th>Type</th><th>Days</th><th>Action</th></tr></thead>
                <tbody>
                  {preview.data.actions.slice(0, 30).map((a, i) => (
                    <tr key={i}>
                      <td>{String(a.email ?? a.employee ?? "")}</td>
                      <td>{String(a.leave_type ?? "")}</td>
                      <td>{formatLeaveDays(a.days as number)}</td>
                      <td>{String(a.action ?? "")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={`${stitchCardClass} space-y-3 p-6`}>
          <h3 className="font-semibold">Balance adjustment</h3>
          <p className="text-xs text-muted-foreground">HR-only. Never edit allocated/used fields directly.</p>
          <select className={stitchSelectClass} value={balanceId} onChange={(e) => setBalanceId(e.target.value)}>
            <option value="">Your balances (use employee profile later for others)</option>
            {balances.map((b) => (
              <option key={b.id} value={b.id}>{b.leave_type.name} {b.year}</option>
            ))}
          </select>
          <input className={stitchFieldClass} placeholder="Delta e.g. 3.00 or -1.5" value={delta} onChange={(e) => setDelta(e.target.value)} />
          <input className={stitchFieldClass} placeholder="Reason (required)" value={adjReason} onChange={(e) => setAdjReason(e.target.value)} />
          <input type="date" className={stitchFieldClass} value={adjDate} onChange={(e) => setAdjDate(e.target.value)} />
          <button
            type="button"
            className="rounded-lg border px-3 py-2 text-sm"
            onClick={() => {
              if (!balanceId || !adjReason) return;
              adjust.mutate({ id: balanceId, payload: { delta, reason: adjReason, effective_date: adjDate || undefined } });
            }}
          >
            Adjust
          </button>
          {txs.length > 0 && (
            <table className="w-full text-xs">
              <thead><tr><th className="text-left">Type</th><th>Δ alloc</th><th>Δ used</th><th>Reason</th><th>When</th></tr></thead>
              <tbody>
                {txs.map((t) => (
                  <tr key={t.id}>
                    <td>{t.transaction_type}</td>
                    <td>{formatLeaveDays(t.delta_allocated_days)}</td>
                    <td>{formatLeaveDays(t.delta_used_days)}</td>
                    <td>{t.reason}</td>
                    <td>{t.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
    </div>
  );
}
