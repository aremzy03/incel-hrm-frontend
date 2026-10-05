"use client";

import { useId } from "react";
import { FieldLabel } from "@/components/hrm/forms/FieldLabel";
import { stitchFieldClass, stitchSelectClass } from "@/lib/design/field-styles";
import {
  accrualMethodLabel,
  overlapEnforcementLabel,
  relieverScopeLabel,
} from "@/lib/leave/settings-labels";
import type { LeavePolicyWritePayload, LeaveType, RelieverScope } from "@/lib/types/leave";

const SCOPES: RelieverScope[] = ["AUTO", "TEAM", "UNIT", "DEPARTMENT", "ORGANIZATION"];
const ACCRUAL_METHODS = ["UPFRONT", "MONTHLY", "WEEKLY", "ANNIVERSARY"] as const;

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

function Check({
  id,
  label,
  checked,
  onChange,
  disabled,
  hint,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex min-h-11 items-center gap-2 text-body-md text-on-surface">
        <input
          id={id}
          type="checkbox"
          className="h-4 w-4 accent-primary"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        {label}
      </label>
      {hint ? <p className="ml-6 text-body-md text-on-surface-variant">{hint}</p> : null}
    </div>
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
  const formId = useId();
  const patch = (partial: Partial<LeavePolicyWritePayload>) => setForm({ ...form, ...partial });

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-title-sm font-semibold text-on-surface">Identity</h3>
        <div>
          <FieldLabel htmlFor={`${formId}-name`}>Name</FieldLabel>
          <input
            id={`${formId}-name`}
            className={stitchFieldClass}
            disabled={readOnly}
            value={form.name ?? ""}
            autoComplete="off"
            onChange={(e) => patch({ name: e.target.value })}
          />
        </div>
        <div>
          <FieldLabel htmlFor={`${formId}-type`}>Leave type</FieldLabel>
          <select
            id={`${formId}-type`}
            className={stitchSelectClass}
            disabled={readOnly || lockLeaveType}
            value={form.leave_type ?? ""}
            onChange={(e) => patch({ leave_type: e.target.value })}
          >
            <option value="">Select type</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor={`${formId}-entitlement`}>Annual entitlement (days)</FieldLabel>
            <input
              id={`${formId}-entitlement`}
              type="number"
              min={0}
              className={stitchFieldClass}
              disabled={readOnly}
              value={form.annual_entitlement ?? 0}
              onChange={(e) => patch({ annual_entitlement: Number(e.target.value) })}
            />
          </div>
          <div>
            <FieldLabel htmlFor={`${formId}-from`} optional>
              Effective from
            </FieldLabel>
            <input
              id={`${formId}-from`}
              type="date"
              lang="en-GB"
              className={stitchFieldClass}
              disabled={readOnly}
              value={form.effective_from ?? ""}
              onChange={(e) => patch({ effective_from: e.target.value || null })}
            />
          </div>
          <div>
            <FieldLabel htmlFor={`${formId}-to`} optional>
              Effective to
            </FieldLabel>
            <input
              id={`${formId}-to`}
              type="date"
              lang="en-GB"
              className={stitchFieldClass}
              disabled={readOnly}
              value={form.effective_to ?? ""}
              onChange={(e) => patch({ effective_to: e.target.value || null })}
            />
          </div>
          <div>
            <FieldLabel htmlFor={`${formId}-backdate`} optional>
              Maximum backdate days
            </FieldLabel>
            <input
              id={`${formId}-backdate`}
              type="number"
              min={0}
              className={stitchFieldClass}
              disabled={readOnly}
              value={form.maximum_backdate_days ?? ""}
              onChange={(e) =>
                patch({
                  maximum_backdate_days: e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
          </div>
        </div>
        <Check
          id={`${formId}-weekend`}
          label="Exclude weekends from working-day counts"
          checked={!!form.weekend_excluded}
          disabled={readOnly}
          onChange={(v) => patch({ weekend_excluded: v })}
        />
        <Check
          id={`${formId}-holiday`}
          label="Exclude public holidays from working-day counts"
          checked={!!form.public_holiday_excluded}
          disabled={readOnly}
          onChange={(v) => patch({ public_holiday_excluded: v })}
        />
        <Check
          id={`${formId}-backdated`}
          label="Allow backdated requests"
          checked={!!form.allow_backdated}
          disabled={readOnly}
          onChange={(v) => patch({ allow_backdated: v })}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-title-sm font-semibold text-on-surface">Half-day and staffing</h3>
        <Check
          id={`${formId}-half`}
          label="Half-day allowed"
          checked={!!form.half_day_allowed}
          disabled={readOnly}
          onChange={(v) => patch({ half_day_allowed: v })}
          hint="Phase 1 policy usually keeps this off."
        />
        <Check
          id={`${formId}-reliever`}
          label="Reliever required"
          checked={!!form.reliever_required}
          disabled={readOnly}
          onChange={(v) => patch({ reliever_required: v })}
        />
        <div>
          <FieldLabel htmlFor={`${formId}-reliever-scope`}>Reliever scope</FieldLabel>
          <select
            id={`${formId}-reliever-scope`}
            className={stitchSelectClass}
            disabled={readOnly}
            value={form.reliever_scope ?? "AUTO"}
            onChange={(e) => patch({ reliever_scope: e.target.value as RelieverScope })}
          >
            {SCOPES.map((s) => (
              <option key={s} value={s}>
                {relieverScopeLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <Check
          id={`${formId}-overlap`}
          label="Limit how many people can be off at once"
          checked={!!form.overlap_control_enabled}
          disabled={readOnly}
          onChange={(v) => patch({ overlap_control_enabled: v })}
          hint="Block matches today’s Annual/Casual rule (one other person already off in the same team, unit, or department). Warn records the conflict but still allows submit."
        />
        <div>
          <FieldLabel htmlFor={`${formId}-overlap-scope`}>Overlap scope</FieldLabel>
          <select
            id={`${formId}-overlap-scope`}
            className={stitchSelectClass}
            disabled={readOnly}
            value={form.overlap_scope ?? "AUTO"}
            onChange={(e) => patch({ overlap_scope: e.target.value as RelieverScope })}
          >
            {SCOPES.map((s) => (
              <option key={s} value={s}>
                {relieverScopeLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor={`${formId}-max-absent`}>Maximum people absent</FieldLabel>
          <input
            id={`${formId}-max-absent`}
            type="number"
            min={1}
            className={stitchFieldClass}
            disabled={readOnly}
            value={form.maximum_people_absent ?? 1}
            onChange={(e) => patch({ maximum_people_absent: Number(e.target.value) })}
          />
        </div>
        <div>
          <FieldLabel htmlFor={`${formId}-enforcement`}>Overlap enforcement</FieldLabel>
          <select
            id={`${formId}-enforcement`}
            className={stitchSelectClass}
            disabled={readOnly}
            value={form.overlap_enforcement ?? "BLOCK"}
            onChange={(e) =>
              patch({ overlap_enforcement: e.target.value as "BLOCK" | "WARN" })
            }
          >
            <option value="BLOCK">{overlapEnforcementLabel("BLOCK")}</option>
            <option value="WARN">{overlapEnforcementLabel("WARN")}</option>
          </select>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-title-sm font-semibold text-on-surface">Accrual</h3>
        <div>
          <FieldLabel htmlFor={`${formId}-accrual`}>Accrual method</FieldLabel>
          <select
            id={`${formId}-accrual`}
            className={stitchSelectClass}
            disabled={readOnly}
            value={form.accrual_method ?? "UPFRONT"}
            onChange={(e) =>
              patch({
                accrual_method: e.target.value as LeavePolicyWritePayload["accrual_method"],
              })
            }
          >
            {ACCRUAL_METHODS.map((m) => (
              <option key={m} value={m}>
                {accrualMethodLabel(m)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor={`${formId}-rate`} optional>
            Accrual rate
          </FieldLabel>
          <input
            id={`${formId}-rate`}
            className={stitchFieldClass}
            disabled={readOnly}
            value={form.accrual_rate ?? ""}
            onChange={(e) => patch({ accrual_rate: e.target.value || null })}
          />
        </div>
        <Check
          id={`${formId}-prorate`}
          label="Prorate new joiners"
          checked={!!form.prorate_new_joiners}
          disabled={readOnly}
          onChange={(v) => patch({ prorate_new_joiners: v })}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-title-sm font-semibold text-on-surface">Year-end</h3>
        <Check
          id={`${formId}-carry`}
          label="Carry forward unused days"
          checked={!!form.carry_forward}
          disabled={readOnly}
          onChange={(v) => patch({ carry_forward: v })}
        />
        {!form.carry_forward ? (
          <p className="text-body-md text-on-surface-variant">
            Unused days expire at year-end.
          </p>
        ) : null}
        <div>
          <FieldLabel htmlFor={`${formId}-carry-max`} optional>
            Carry-forward max days
          </FieldLabel>
          <input
            id={`${formId}-carry-max`}
            className={stitchFieldClass}
            disabled={readOnly}
            value={form.carry_forward_max_days ?? ""}
            onChange={(e) => patch({ carry_forward_max_days: e.target.value || null })}
          />
        </div>
        <div>
          <FieldLabel htmlFor={`${formId}-carry-expiry`} optional>
            Carry-forward expiry months
          </FieldLabel>
          <input
            id={`${formId}-carry-expiry`}
            type="number"
            min={0}
            className={stitchFieldClass}
            disabled={readOnly}
            value={form.carry_forward_expiry_months ?? ""}
            onChange={(e) =>
              patch({
                carry_forward_expiry_months:
                  e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        </div>
        <Check
          id={`${formId}-forfeit-unused`}
          label="Forfeit unused when carry-forward is off"
          checked={!!form.forfeit_unused}
          disabled={readOnly}
          onChange={(v) => patch({ forfeit_unused: v })}
        />
        <Check
          id={`${formId}-forfeit-resign`}
          label="Forfeit remaining days on resignation"
          checked={!!form.forfeited_on_resignation}
          disabled={readOnly}
          onChange={(v) => patch({ forfeited_on_resignation: v })}
        />
      </section>

      {!readOnly ? (
        <div>
          <FieldLabel htmlFor={`${formId}-reason`} optional>
            Note for the audit log
          </FieldLabel>
          <input
            id={`${formId}-reason`}
            className={stitchFieldClass}
            value={form.reason ?? ""}
            autoComplete="off"
            onChange={(e) => patch({ reason: e.target.value })}
          />
        </div>
      ) : null}
    </div>
  );
}
