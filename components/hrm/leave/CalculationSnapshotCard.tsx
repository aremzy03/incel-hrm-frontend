"use client";

import { useState } from "react";
import {
  Calculator,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Code2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeavePolicy } from "@/lib/api/leave-policies";
import { formatWeekdays, WEEKDAY_LABELS } from "@/lib/leave/settings-labels";
import { formatLeaveDays } from "@/lib/leave/format";
import type { HalfDayPeriod, LeaveCalculationSnapshot } from "@/lib/types/leave";
import { toast } from "@/lib/toast";

interface CalculationSnapshotCardProps {
  policyId?: string | null;
  policyVersion?: number | null;
  snapshot?: LeaveCalculationSnapshot | Record<string, unknown> | null;
  totalWorkingDays?: number | string | null;
  isHalfDay?: boolean;
  halfDayPeriod?: HalfDayPeriod;
  className?: string;
}

export function CalculationSnapshotCard({
  policyId,
  policyVersion,
  snapshot,
  totalWorkingDays,
  isHalfDay,
  halfDayPeriod,
  className,
}: CalculationSnapshotCardProps) {
  const [showTechnical, setShowTechnical] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { data: policyData } = useLeavePolicy(policyId ?? "");

  // If there's neither policy info nor calculation snapshot, do not render
  if (!policyId && !policyVersion && !snapshot) {
    return null;
  }

  const snap = (snapshot || {}) as LeaveCalculationSnapshot;

  const resolvedWorkingDays =
    totalWorkingDays ?? snap.total_working_days ?? null;

  const weekendExcluded = snap.weekend_excluded ?? true;
  const holidayExcluded = snap.public_holiday_excluded ?? true;

  const rawWeekdays = Array.isArray(snap.working_weekdays)
    ? snap.working_weekdays.map(Number)
    : [0, 1, 2, 3, 4]; // Default Mon-Fri if unspecified

  const workingWeekdays = [...rawWeekdays].sort((a, b) => a - b);
  const workingScheduleText = formatWeekdays(workingWeekdays);

  const isHalfDayResolved = Boolean(isHalfDay ?? snap.is_half_day);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(label);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === label ? null : prev));
      }, 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div
      className={cn(
        "mt-5 overflow-hidden rounded-xl border border-outline-variant/70 bg-surface-container-low/50 shadow-sm transition-all",
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/50 bg-surface-container-lowest/80 px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Calculator className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-on-surface">
                Calculation Breakdown
              </h3>
              {policyVersion != null && (
                <span className="inline-flex items-center rounded-full bg-secondary-container/60 px-2 py-0.5 text-[11px] font-medium text-on-secondary-container">
                  v{policyVersion}
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant">
              {policyData?.name ? (
                <span>
                  Policy:{" "}
                  <strong className="font-medium text-foreground">
                    {policyData.name}
                  </strong>
                </span>
              ) : policyId ? (
                <span title={policyId}>
                  Policy ID:{" "}
                  <span className="font-mono text-[11px]">
                    {policyId.slice(0, 8)}…
                  </span>
                </span>
              ) : (
                "Standard organization leave calculation rules"
              )}
            </p>
          </div>
        </div>

        {resolvedWorkingDays != null && (
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>
              {formatLeaveDays(resolvedWorkingDays)} working day
              {Number(resolvedWorkingDays) !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Structured Details Grid */}
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-5">
        {/* Working Weekdays */}
        <div className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest/90 p-3.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-medium text-on-surface-variant">
              Working Schedule
            </span>
            <span className="text-[11px] font-semibold text-primary">
              {workingWeekdays.length} days/week
            </span>
          </div>
          <p className="mt-1 text-xs font-semibold text-foreground">
            {workingScheduleText}
          </p>

          {/* 7-day pill strip */}
          <div className="mt-2.5 flex items-center gap-1">
            {WEEKDAY_LABELS.map((label, index) => {
              const isWorking = workingWeekdays.includes(index);
              return (
                <span
                  key={label}
                  className={cn(
                    "flex-1 rounded py-0.5 text-center text-[10px] font-medium transition-colors",
                    isWorking
                      ? "bg-primary/15 font-semibold text-primary"
                      : "bg-surface-container-high/60 text-muted-foreground/60"
                  )}
                  title={`${label}: ${isWorking ? "Working day" : "Non-working day"}`}
                >
                  {label.slice(0, 1)}
                </span>
              );
            })}
          </div>
        </div>

        {/* Weekend Rule */}
        <div className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest/90 p-3.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-medium text-on-surface-variant">
              Weekend Rule
            </span>
            {weekendExcluded ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Excluded
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-3.5 w-3.5" />
                Included
              </span>
            )}
          </div>
          <p className="mt-1 text-xs font-semibold text-foreground">
            {weekendExcluded
              ? "Weekends not deducted"
              : "Weekends counted as leave"}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {weekendExcluded
              ? "Non-working Saturdays & Sundays are skipped."
              : "Weekend days will deduct from leave balance."}
          </p>
        </div>

        {/* Public Holidays Rule */}
        <div className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest/90 p-3.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-medium text-on-surface-variant">
              Public Holidays
            </span>
            {holidayExcluded ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Excluded
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-3.5 w-3.5" />
                Included
              </span>
            )}
          </div>
          <p className="mt-1 text-xs font-semibold text-foreground">
            {holidayExcluded
              ? "Official holidays skipped"
              : "Holidays counted as leave"}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {holidayExcluded
              ? "Calendar holidays occurring in range are excluded."
              : "Calendar holidays will count against leave."}
          </p>
        </div>

        {/* Leave Day Unit / Half Day */}
        <div className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest/90 p-3.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-medium text-on-surface-variant">
              Leave Unit
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              {isHalfDayResolved ? "0.5 day" : "Full day"}
            </span>
          </div>
          <p className="mt-1 text-xs font-semibold text-foreground">
            {isHalfDayResolved
              ? `Half-day (${halfDayPeriod || "Single session"})`
              : "Standard full-day calculation"}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {isHalfDayResolved
              ? "Calculated as half a working day unit."
              : "Calculated as full 8-hour working day intervals."}
          </p>
        </div>

        {/* Snapshot Integrity Badge */}
        <div className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest/90 p-3.5 sm:col-span-2">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">
                Immutable Calculation Snapshot
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                Working days were verified and locked at time of submission.
                Subsequent changes to organization calendars or leave policies
                will not retroactively modify this duration.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Audit & Technical Details Collapsible Footer */}
      <div className="border-t border-outline-variant/50 bg-surface-container-lowest/60 px-4 py-2.5 sm:px-5">
        <button
          type="button"
          onClick={() => setShowTechnical(!showTechnical)}
          className="flex w-full items-center justify-between text-xs font-medium text-on-surface-variant transition hover:text-foreground focus:outline-none"
          aria-expanded={showTechnical}
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Audit & Technical Snapshot Details</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span>{showTechnical ? "Hide" : "Show"} details</span>
            {showTechnical ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </span>
        </button>

        {showTechnical && (
          <div className="mt-3 space-y-3 pt-2 text-xs">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {policyId && (
                <div className="flex items-center justify-between rounded-lg bg-surface-container-low/70 px-3 py-2 text-xs">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      Policy ID
                    </span>
                    <span className="font-mono text-[11px] text-foreground">
                      {policyId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(policyId, "Policy ID")}
                    className="ml-2 rounded p-1 text-muted-foreground hover:bg-surface-container-high hover:text-foreground transition"
                    title="Copy Policy ID"
                  >
                    {copiedKey === "Policy ID" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              )}

              {snap.working_calendar_id ? (
                <div className="flex items-center justify-between rounded-lg bg-surface-container-low/70 px-3 py-2 text-xs">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      Working Calendar ID
                    </span>
                    <span className="font-mono text-[11px] text-foreground">
                      {snap.working_calendar_id}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        snap.working_calendar_id!,
                        "Working Calendar ID"
                      )
                    }
                    className="ml-2 rounded p-1 text-muted-foreground hover:bg-surface-container-high hover:text-foreground transition"
                    title="Copy Working Calendar ID"
                  >
                    {copiedKey === "Working Calendar ID" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ) : (
                <div className="rounded-lg bg-surface-container-low/70 px-3 py-2 text-xs">
                  <span className="text-[11px] text-muted-foreground block">
                    Working Calendar
                  </span>
                  <span className="text-[11px] font-medium text-foreground">
                    Organization Default (Standard Mon–Fri)
                  </span>
                </div>
              )}

              {snap.holiday_calendar_id ? (
                <div className="flex items-center justify-between rounded-lg bg-surface-container-low/70 px-3 py-2 text-xs">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      Holiday Calendar ID
                    </span>
                    <span className="font-mono text-[11px] text-foreground">
                      {snap.holiday_calendar_id}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        snap.holiday_calendar_id!,
                        "Holiday Calendar ID"
                      )
                    }
                    className="ml-2 rounded p-1 text-muted-foreground hover:bg-surface-container-high hover:text-foreground transition"
                    title="Copy Holiday Calendar ID"
                  >
                    {copiedKey === "Holiday Calendar ID" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ) : (
                <div className="rounded-lg bg-surface-container-low/70 px-3 py-2 text-xs">
                  <span className="text-[11px] text-muted-foreground block">
                    Holiday Calendar
                  </span>
                  <span className="text-[11px] font-medium text-foreground">
                    Organization Default (Public Holidays)
                  </span>
                </div>
              )}

              {(snap.start_date || snap.end_date) && (
                <div className="rounded-lg bg-surface-container-low/70 px-3 py-2 text-xs">
                  <span className="text-[11px] text-muted-foreground block">
                    Snapshot Target Range
                  </span>
                  <span className="text-[11px] font-medium text-foreground">
                    {snap.start_date ?? "—"} to {snap.end_date ?? "—"}
                  </span>
                </div>
              )}
            </div>

            {/* Toggle Raw JSON */}
            {snapshot && (
              <div className="pt-1">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowRawJson(!showRawJson)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary hover:underline"
                  >
                    <Code2 className="h-3.5 w-3.5" />
                    <span>
                      {showRawJson ? "Hide" : "View"} raw calculation payload
                    </span>
                  </button>

                  {showRawJson && (
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(snapshot, null, 2),
                          "Raw JSON payload"
                        )
                      }
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Copy JSON</span>
                    </button>
                  )}
                </div>

                {showRawJson && (
                  <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-neutral-900 p-3 font-mono text-[11px] text-neutral-100 shadow-inner dark:bg-black/80">
                    {JSON.stringify(snapshot, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
