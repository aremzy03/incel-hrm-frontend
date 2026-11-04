"use client";

import { cn } from "@/lib/utils";
import {
  APPRAISAL_STATUS_CONFIG,
  PERFORMANCE_TIER_CONFIG,
} from "@/lib/appraisals/utils";
import type {
  AppraisalStatusCode,
  PerformanceCategoryCode,
} from "@/lib/types/appraisal";

interface AppraisalStatusBadgeProps {
  status: AppraisalStatusCode;
  className?: string;
}

export function AppraisalStatusBadge({
  status,
  className,
}: AppraisalStatusBadgeProps) {
  const config = APPRAISAL_STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

interface PerformanceTierBadgeProps {
  category: PerformanceCategoryCode | null | undefined;
  score?: string | number | null;
  className?: string;
}

export function PerformanceTierBadge({
  category,
  score,
  className,
}: PerformanceTierBadgeProps) {
  if (!category) return null;
  const config = PERFORMANCE_TIER_CONFIG[category];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        config.className,
        className
      )}
    >
      {config.label}
      {score !== null && score !== undefined && (
        <span className="opacity-70">({Number(score).toFixed(1)}%)</span>
      )}
    </span>
  );
}
