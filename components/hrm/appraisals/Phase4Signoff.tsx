"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import {
  ALL_RECOMMENDATIONS,
  RECOMMENDATION_LABELS,
} from "@/lib/appraisals/utils";
import { PerformanceTierBadge } from "@/components/hrm/appraisals/AppraisalStatusBadge";
import { getPerformanceCategory } from "@/lib/appraisals/utils";
import type {
  AppraisalPhase4Signoff,
  PerformanceCategoryCode,
  RecommendationCode,
} from "@/lib/types/appraisal";

// ---------------------------------------------------------------------------
// Sub-section types
// ---------------------------------------------------------------------------

export interface Phase4SupervisorData {
  goals_next_year: string;
  recommendations: RecommendationCode[];
  recommendation_others: string;
  supervisor_comments: string;
}

export interface Phase4SignoffData {
  appraisee_agrees: boolean | null;
  appraisee_disagree_reason: string;
  appraisee_additional_comments: string;
}

export interface Phase4HrData {
  hr_observations: string;
  hr_recommended_action: string;
}

export interface Phase4ManagementData {
  management_comments: string;
  committee_decision: string;
}

// ---------------------------------------------------------------------------
// Re-usable textarea
// ---------------------------------------------------------------------------

function Textarea({
  id,
  label,
  hint,
  value,
  onChange,
  placeholder,
  readOnly,
  required,
  rows = 3,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-foreground">
        {label}
        {required && (
          <span className="ml-1 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {readOnly ? (
        <div className="min-h-[64px] rounded-lg border border-outline-variant bg-surface-container px-3 py-2.5 text-sm text-foreground">
          {value || <span className="italic text-muted-foreground">Not provided</span>}
        </div>
      ) : (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          required={required}
          className="w-full resize-y rounded-lg border border-outline-variant bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Supervisor section of Phase 4
// ---------------------------------------------------------------------------

interface SupervisorSectionProps {
  data: Phase4SupervisorData;
  onChange?: (data: Phase4SupervisorData) => void;
  readOnly?: boolean;
  supervisorScore?: string;
  performanceCategory?: PerformanceCategoryCode | null;
}

function SupervisorSection({
  data,
  onChange,
  readOnly = false,
  supervisorScore,
  performanceCategory,
}: SupervisorSectionProps) {
  const id = useId();
  const computedCategory =
    performanceCategory ??
    getPerformanceCategory(parseFloat(supervisorScore ?? "0"));

  return (
    <div className="space-y-5 rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-foreground">
          1-on-1 Goals & Recommendations
          <span className="ml-2 text-xs font-normal text-muted-foreground">(Supervisor)</span>
        </h3>
        {computedCategory && (
          <PerformanceTierBadge
            category={computedCategory}
            score={supervisorScore}
          />
        )}
      </div>

      <Textarea
        id={`${id}-goals`}
        label="Goals for Next Year"
        hint="Agreed focus areas and measurable targets for the next review period."
        value={data.goals_next_year}
        onChange={(v) => onChange?.({ ...data, goals_next_year: v })}
        readOnly={readOnly}
        required
        rows={4}
        placeholder="List the key targets and development objectives for the next year…"
      />

      {/* Recommendations multi-select */}
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-foreground">
          Outcome Recommendations
          <span className="ml-1 text-destructive" aria-hidden="true">*</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Select all applicable outcome recommendations for this appraisal.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ALL_RECOMMENDATIONS.map((code) => {
            const checked = data.recommendations.includes(code);
            return (
              <label
                key={code}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                  checked
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-outline-variant bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  readOnly && "cursor-default"
                )}
              >
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={checked}
                  disabled={readOnly}
                  onChange={() => {
                    if (readOnly) return;
                    const updated = checked
                      ? data.recommendations.filter((r) => r !== code)
                      : [...data.recommendations, code];
                    onChange?.({ ...data, recommendations: updated });
                  }}
                />
                {RECOMMENDATION_LABELS[code]}
              </label>
            );
          })}
        </div>
      </div>

      {/* Others text — shown only when OTHERS is selected */}
      {data.recommendations.includes("OTHERS") && (
        <Textarea
          id={`${id}-rec-others`}
          label='Specify "Others"'
          value={data.recommendation_others}
          onChange={(v) => onChange?.({ ...data, recommendation_others: v })}
          readOnly={readOnly}
          placeholder="Describe the other recommendation…"
          rows={2}
        />
      )}

      <Textarea
        id={`${id}-sup-comments`}
        label="Supervisor's General Comments"
        value={data.supervisor_comments}
        onChange={(v) => onChange?.({ ...data, supervisor_comments: v })}
        readOnly={readOnly}
        placeholder="Overall comments on the employee's performance and conduct…"
        rows={3}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Appraisee sign-off section
// ---------------------------------------------------------------------------

interface AppraiseeSignoffSectionProps {
  data: Phase4SignoffData;
  onChange?: (data: Phase4SignoffData) => void;
  readOnly?: boolean;
}

function AppraiseeSignoffSection({
  data,
  onChange,
  readOnly = false,
}: AppraiseeSignoffSectionProps) {
  const id = useId();
  return (
    <div className="space-y-5 rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
      <h3 className="text-sm font-bold text-foreground">
        Appraisee Acceptance Sign-Off
        <span className="ml-2 text-xs font-normal text-muted-foreground">(Employee)</span>
      </h3>

      {/* Agree / Disagree */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">
          Do you agree with your manager&apos;s appraisal?
          <span className="ml-1 text-destructive" aria-hidden="true">*</span>
        </p>
        <div className="flex gap-3">
          {[
            { label: "I Agree", value: true },
            { label: "I Disagree", value: false },
          ].map(({ label, value }) => (
            <label
              key={String(value)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                data.appraisee_agrees === value
                  ? value
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                    : "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                  : "border-outline-variant bg-background text-muted-foreground hover:border-primary/40",
                readOnly && "cursor-default"
              )}
            >
              <input
                type="radio"
                name={`${id}-agrees`}
                checked={data.appraisee_agrees === value}
                disabled={readOnly}
                onChange={() => onChange?.({ ...data, appraisee_agrees: value })}
                className="accent-primary"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Mandatory disagree reason */}
      {data.appraisee_agrees === false && (
        <Textarea
          id={`${id}-disagree-reason`}
          label="Reason for Disagreement"
          hint="Required when selecting 'I Disagree'. Be specific about which aspects you disagree with."
          value={data.appraisee_disagree_reason}
          onChange={(v) => onChange?.({ ...data, appraisee_disagree_reason: v })}
          readOnly={readOnly}
          required
          placeholder="Explain the specific areas of disagreement and your perspective…"
          rows={4}
        />
      )}

      <Textarea
        id={`${id}-add-comments`}
        label="Additional Comments (Optional)"
        value={data.appraisee_additional_comments}
        onChange={(v) => onChange?.({ ...data, appraisee_additional_comments: v })}
        readOnly={readOnly}
        placeholder="Any additional feedback or comments you wish to add…"
        rows={3}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// HR Calibration section
// ---------------------------------------------------------------------------

interface HrSectionProps {
  data: Phase4HrData;
  onChange?: (data: Phase4HrData) => void;
  readOnly?: boolean;
}

function HrSection({ data, onChange, readOnly = false }: HrSectionProps) {
  const id = useId();
  return (
    <div className="space-y-5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 p-5">
      <h3 className="text-sm font-bold text-foreground">
        HR Calibration
        <span className="ml-2 text-xs font-normal text-muted-foreground">(HR Administrator)</span>
      </h3>
      <Textarea
        id={`${id}-obs`}
        label="HR Observations"
        hint="Note any disciplinary records, notable patterns, or contextual factors relevant to this appraisal."
        value={data.hr_observations}
        onChange={(v) => onChange?.({ ...data, hr_observations: v })}
        readOnly={readOnly}
        placeholder="Summarize HR observations for calibration…"
        rows={4}
      />
      <Textarea
        id={`${id}-action`}
        label="HR Recommended Action"
        hint="HR's recommended actions or interventions based on this appraisal."
        value={data.hr_recommended_action}
        onChange={(v) => onChange?.({ ...data, hr_recommended_action: v })}
        readOnly={readOnly}
        placeholder="Describe recommended HR actions…"
        rows={3}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Management / Committee section
// ---------------------------------------------------------------------------

interface ManagementSectionProps {
  data: Phase4ManagementData;
  onChange?: (data: Phase4ManagementData) => void;
  readOnly?: boolean;
}

function ManagementSection({
  data,
  onChange,
  readOnly = false,
}: ManagementSectionProps) {
  const id = useId();
  return (
    <div className="space-y-5 rounded-xl border border-cyan-200 dark:border-cyan-900 bg-cyan-50/50 dark:bg-cyan-950/20 p-5">
      <h3 className="text-sm font-bold text-foreground">
        Management &amp; Committee Decision
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          (Executive / Committee)
        </span>
      </h3>
      <Textarea
        id={`${id}-mgmt`}
        label="Management Comments"
        value={data.management_comments}
        onChange={(v) => onChange?.({ ...data, management_comments: v })}
        readOnly={readOnly}
        placeholder="Management Board remarks on this appraisal…"
        rows={3}
      />
      <Textarea
        id={`${id}-decision`}
        label="Committee Decision"
        hint="The official final decision on outcome (e.g., bonus approval, promotion, etc.)."
        value={data.committee_decision}
        onChange={(v) => onChange?.({ ...data, committee_decision: v })}
        readOnly={readOnly}
        placeholder="Official committee decision…"
        rows={3}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Assembled Phase 4 Component
// ---------------------------------------------------------------------------

interface Phase4SignoffProps {
  supervisorData: Phase4SupervisorData;
  onSupervisorChange?: (data: Phase4SupervisorData) => void;
  signoffData: Phase4SignoffData;
  onSignoffChange?: (data: Phase4SignoffData) => void;
  hrData: Phase4HrData;
  onHrChange?: (data: Phase4HrData) => void;
  managementData: Phase4ManagementData;
  onManagementChange?: (data: Phase4ManagementData) => void;
  /** Which sections are editable */
  canEditSupervisor?: boolean;
  canEditSignoff?: boolean;
  canEditHr?: boolean;
  canEditManagement?: boolean;
  supervisorScore?: string;
  performanceCategory?: PerformanceCategoryCode | null;
  savedSignoff?: AppraisalPhase4Signoff | null;
}

export function Phase4Signoff({
  supervisorData,
  onSupervisorChange,
  signoffData,
  onSignoffChange,
  hrData,
  onHrChange,
  managementData,
  onManagementChange,
  canEditSupervisor = false,
  canEditSignoff = false,
  canEditHr = false,
  canEditManagement = false,
  supervisorScore,
  performanceCategory,
}: Phase4SignoffProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-outline-variant/60 bg-primary/5 p-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            Phase 4 — 1-on-1 Review, Goals, Outcome &amp; Sign-Offs.
          </span>{" "}
          This phase captures the outcome of the 1-on-1 discussion, including next year&apos;s goals,
          recommendations, employee sign-off, HR calibration, and the final management decision.
        </p>
      </div>

      <SupervisorSection
        data={supervisorData}
        onChange={onSupervisorChange}
        readOnly={!canEditSupervisor}
        supervisorScore={supervisorScore}
        performanceCategory={performanceCategory}
      />

      <AppraiseeSignoffSection
        data={signoffData}
        onChange={onSignoffChange}
        readOnly={!canEditSignoff}
      />

      <HrSection
        data={hrData}
        onChange={onHrChange}
        readOnly={!canEditHr}
      />

      <ManagementSection
        data={managementData}
        onChange={onManagementChange}
        readOnly={!canEditManagement}
      />
    </div>
  );
}
