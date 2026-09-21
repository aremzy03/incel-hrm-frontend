"use client";

import { useState } from "react";
import { stitchFieldClass, stitchSelectClass } from "@/lib/design/field-styles";
import type { LeavePolicyWritePayload, LeaveType, RelieverScope } from "@/lib/types/leave";

const SCOPES: RelieverScope[] = ["AUTO", "TEAM", "UNIT", "DEPARTMENT", "ORGANIZATION"];

export const emptyPolicyForm = (leaveTypeId = ""): LeavePolicyWritePayload => ({
  name: "",
  leave_type: leaveTypeId,
  annual_entitlement: 20,
  weekend_excluded: true,
  public_holiday_excluded: true,
  carry_forward: false,
  half_day_allowed: false,
  forfeited_on_resignation: true,
  allow_backdated: true,
  maximum_backdate_days: null,
  effective_from: null,
  effective_to: null,
  reliever_required: true,
  reliever_scope: "AUTO",
  overlap_control_enabled: false,
  overlap_scope: "AUTO",
  maximum_people_absent: 1,
  overlap_enforcement: "BLOCK",
  accrual_method: "UPFRONT",
  accrual_rate: null,
  prorate_new_joiners: false,
  carry_forward_max_days: null,
  carry_forward_expiry_months: null,
  forfeit_unused: true,
  reason: "",
});

export function policyToForm(p: {
  name: string;
  leave_type: string;
  annual_entitlement: number;
  weekend_excluded: boolean;
  public_holiday_excluded: boolean;
  carry_forward: boolean;
  half_day_allowed: boolean;
  forfeited_on_resignation: boolean;
  allow_backdated: boolean;
  maximum_backdate_days: number | null;
  effective_from: string | null;
  effective_to: string | null;
  reliever_required?: boolean;
  reliever_scope?: RelieverScope;
  overlap_control_enabled?: boolean;
  overlap_scope?: RelieverScope;
  maximum_people_absent?: number;
  overlap_enforcement?: "BLOCK" | "WARN";
  accrual_method?: LeavePolicyWritePayload["accrual_method"];
  accrual_rate?: string | number | null;
  prorate_new_joiners?: boolean;
  carry_forward_max_days?: string | number | null;
  carry_forward_expiry_months?: number | null;
  forfeit_unused?: boolean;
}): LeavePolicyWritePayload {
  return {
    name: p.name,
    leave_type: p.leave_type,
    annual_entitlement: p.annual_entitlement,
    weekend_excluded: p.weekend_excluded,
    public_holiday_excluded: p.public_holiday_excluded,
    carry_forward: p.carry_forward,
    half_day_allowed: p.half_day_allowed,
    forfeited_on_resignation: p.forfeited_on_resignation,
    allow_backdated: p.allow_backdated,
    maximum_backdate_days: p.maximum_backdate_days,
    effective_from: p.effective_from,
    effective_to: p.effective_to,
    reliever_required: p.reliever_required ?? true,
    reliever_scope: p.reliever_scope ?? "AUTO",
    overlap_control_enabled: p.overlap_control_enabled ?? false,
    overlap_scope: p.overlap_scope ?? "AUTO",
    maximum_people_absent: p.maximum_people_absent ?? 1,
    overlap_enforcement: p.overlap_enforcement ?? "BLOCK",
    accrual_method: p.accrual_method ?? "UPFRONT",
    accrual_rate: p.accrual_rate ?? null,
    prorate_new_joiners: p.prorate_new_joiners ?? false,
    carry_forward_max_days: p.carry_forward_max_days ?? null,
    carry_forward_expiry_months: p.carry_forward_expiry_months ?? null,
    forfeit_unused: p.forfeit_unused ?? true,
    reason: "",
  };
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-label-md text-on-surface-variant">{children}</label>
  );
}

function Check({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function PolicyForm({
  form,
  setForm,
  types,
  lockLeaveType,
  readOnly,
}: {
  form: LeavePolicyWritePayload;
  setForm: (next: LeavePolicyWritePayload) => void;
  types: LeaveType[];
  lockLeaveType?: boolean;
  readOnly?: boolean;
}) {
  const patch = (partial: Partial<LeavePolicyWritePayload>) => setForm({ ...form, ...partial });

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Identity</h3>
        <div>
          <Label>Name</Label>
          <input className={stitchFieldClass} disabled={readOnly} value={form.name ?? ""} onChange={(e) => patch({ name: e.target.value })} />
        </div>
        <div>
          <Label>Leave type</Label>
          <select className={stitchSelectClass} disabled={readOnly || lockLeaveType} value={form.leave_type ?? ""} onChange={(e) => patch({ leave_type: e.target.value })}>
            <option value="">Select type</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Annual entitlement</Label>
            <input type="number" className={stitchFieldClass} disabled={readOnly} value={form.annual_entitlement ?? 0}
              onChange={(e) => patch({ annual_entitlement: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Effective from</Label>
            <input type="date" className={stitchFieldClass} disabled={readOnly} value={form.effective_from ?? ""}
              onChange={(e) => patch({ effective_from: e.target.value || null })} />
          </div>
          <div>
            <Label>Effective to</Label>
            <input type="date" className={stitchFieldClass} disabled={readOnly} value={form.effective_to ?? ""}
              onChange={(e) => patch({ effective_to: e.target.value || null })} />
          </div>
          <div>
            <Label>Maximum backdate days</Label>
            <input type="number" className={stitchFieldClass} disabled={readOnly} value={form.maximum_backdate_days ?? ""}
              onChange={(e) => patch({ maximum_backdate_days: e.target.value === "" ? null : Number(e.target.value) })} />
          </div>
        </div>
        <Check label="Weekend excluded" checked={!!form.weekend_excluded} disabled={readOnly} onChange={(v) => patch({ weekend_excluded: v })} />
        <Check label="Public holiday excluded" checked={!!form.public_holiday_excluded} disabled={readOnly} onChange={(v) => patch({ public_holiday_excluded: v })} />
        <Check label="Allow backdated requests" checked={!!form.allow_backdated} disabled={readOnly} onChange={(v) => patch({ allow_backdated: v })} />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Half-day & staffing</h3>
        <Check label="Half-day allowed" checked={!!form.half_day_allowed} disabled={readOnly} onChange={(v) => patch({ half_day_allowed: v })} />
        <Check label="Reliever required" checked={!!form.reliever_required} disabled={readOnly} onChange={(v) => patch({ reliever_required: v })} />
        <div>
          <Label>Reliever scope</Label>
          <select className={stitchSelectClass} disabled={readOnly} value={form.reliever_scope ?? "AUTO"} onChange={(e) => patch({ reliever_scope: e.target.value as RelieverScope })}>
            {SCOPES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <Check label="Overlap control enabled" checked={!!form.overlap_control_enabled} disabled={readOnly} onChange={(v) => patch({ overlap_control_enabled: v })} />
        <p className="text-xs text-muted-foreground">
          Block matches today’s Annual/Casual rule (one other person already off in the same team/unit/department). Warn records the conflict but still allows submit.
        </p>
        <div>
          <Label>Overlap scope</Label>
          <select className={stitchSelectClass} disabled={readOnly} value={form.overlap_scope ?? "AUTO"} onChange={(e) => patch({ overlap_scope: e.target.value as RelieverScope })}>
            {SCOPES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <Label>Maximum people absent</Label>
          <input type="number" className={stitchFieldClass} disabled={readOnly} value={form.maximum_people_absent ?? 1}
            onChange={(e) => patch({ maximum_people_absent: Number(e.target.value) })} />
        </div>
        <div>
          <Label>Overlap enforcement</Label>
          <select className={stitchSelectClass} disabled={readOnly} value={form.overlap_enforcement ?? "BLOCK"}
            onChange={(e) => patch({ overlap_enforcement: e.target.value as "BLOCK" | "WARN" })}>
            <option value="BLOCK">BLOCK</option>
            <option value="WARN">WARN</option>
          </select>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Accrual</h3>
        <div>
          <Label>Accrual method</Label>
          <select className={stitchSelectClass} disabled={readOnly} value={form.accrual_method ?? "UPFRONT"}
            onChange={(e) => patch({ accrual_method: e.target.value as LeavePolicyWritePayload["accrual_method"] })}>
            <option>UPFRONT</option>
            <option>MONTHLY</option>
            <option>WEEKLY</option>
            <option>ANNIVERSARY</option>
          </select>
        </div>
        <div>
          <Label>Accrual rate (optional)</Label>
          <input className={stitchFieldClass} disabled={readOnly} value={form.accrual_rate ?? ""}
            onChange={(e) => patch({ accrual_rate: e.target.value || null })} />
        </div>
        <Check label="Prorate new joiners" checked={!!form.prorate_new_joiners} disabled={readOnly} onChange={(v) => patch({ prorate_new_joiners: v })} />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Year-end</h3>
        <Check label="Carry forward unused days" checked={!!form.carry_forward} disabled={readOnly} onChange={(v) => patch({ carry_forward: v })} />
        {!form.carry_forward && (
          <p className="text-xs text-muted-foreground">Unused days expire at year-end (ledgered EXPIRY).</p>
        )}
        <div>
          <Label>Carry-forward max days</Label>
          <input className={stitchFieldClass} disabled={readOnly} value={form.carry_forward_max_days ?? ""}
            onChange={(e) => patch({ carry_forward_max_days: e.target.value || null })} />
        </div>
        <div>
          <Label>Carry-forward expiry months</Label>
          <input type="number" className={stitchFieldClass} disabled={readOnly} value={form.carry_forward_expiry_months ?? ""}
            onChange={(e) => patch({ carry_forward_expiry_months: e.target.value === "" ? null : Number(e.target.value) })} />
        </div>
        <Check label="Forfeit unused when carry-forward is off" checked={!!form.forfeit_unused} disabled={readOnly} onChange={(v) => patch({ forfeit_unused: v })} />
        <Check label="Forfeit remaining days on resignation" checked={!!form.forfeited_on_resignation} disabled={readOnly} onChange={(v) => patch({ forfeited_on_resignation: v })} />
      </section>

      {!readOnly && (
        <div>
          <Label>Reason (audit)</Label>
          <input className={stitchFieldClass} value={form.reason ?? ""} onChange={(e) => patch({ reason: e.target.value })} />
        </div>
      )}
    </div>
  );
}

export function usePolicyFormState(initial: LeavePolicyWritePayload) {
  return useState<LeavePolicyWritePayload>(initial);
}
