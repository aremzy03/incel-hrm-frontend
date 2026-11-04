import type { AppraisalStatusCode, PerformanceCategoryCode } from "@/lib/types/appraisal";

// ---------------------------------------------------------------------------
// Status badge config
// ---------------------------------------------------------------------------

export interface StatusConfig {
  label: string;
  className: string;
}

export const APPRAISAL_STATUS_CONFIG: Record<AppraisalStatusCode, StatusConfig> = {
  NOT_STARTED: {
    label: "Not Started",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  DRAFT: {
    label: "Self Assessment Draft",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  SELF_SUBMITTED: {
    label: "Pending Manager Review",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  },
  PENDING_APPRAISEE_ACCEPTANCE: {
    label: "Pending Sign-Off",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  },
  PENDING_HR_CALIBRATION: {
    label: "Pending HR Calibration",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  },
  PENDING_MANAGEMENT_DECISION: {
    label: "Pending Committee Decision",
    className: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
  },
  FINALIZED: {
    label: "Finalized",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  REOPENED_FOR_EMPLOYEE: {
    label: "Reopened for Employee",
    className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  },
  REOPENED_FOR_SUPERVISOR: {
    label: "Reopened for Manager",
    className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  },
};

// ---------------------------------------------------------------------------
// Performance tier config
// ---------------------------------------------------------------------------

export interface TierConfig {
  label: string;
  range: string;
  className: string;
}

export const PERFORMANCE_TIER_CONFIG: Record<PerformanceCategoryCode, TierConfig> = {
  EXCEPTIONAL: {
    label: "Exceptional Performer",
    range: "90–100%",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  HIGH: {
    label: "High Performer",
    range: "80–89%",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  },
  GOOD: {
    label: "Good Performer",
    range: "65–79%",
    className: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  },
  DEVELOPING: {
    label: "Developing Performer",
    range: "50–64%",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  },
  UNDER: {
    label: "Under Performer",
    range: "Below 50%",
    className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  },
};

// ---------------------------------------------------------------------------
// Live score calculation
// ---------------------------------------------------------------------------

/**
 * Compute the weighted section score for an evaluator.
 * Formula: (sum of ratings / (questions_count × scale_max)) × section_weight
 */
export function calcSectionScore(
  ratings: (number | null)[],
  scaleMax: number,
  weight: number
): number {
  const validRatings = ratings.filter((r): r is number => r !== null);
  if (validRatings.length === 0) return 0;
  const rawSum = validRatings.reduce((a, b) => a + b, 0);
  const maxRaw = ratings.length * scaleMax;
  return (rawSum / maxRaw) * weight;
}

/**
 * Compute the grand total score from all section scores.
 */
export function calcGrandTotal(sectionScores: number[]): number {
  return sectionScores.reduce((a, b) => a + b, 0);
}

/**
 * Derive performance category from a score percentage.
 */
export function getPerformanceCategory(
  score: number
): PerformanceCategoryCode | null {
  if (score >= 90) return "EXCEPTIONAL";
  if (score >= 80) return "HIGH";
  if (score >= 65) return "GOOD";
  if (score >= 50) return "DEVELOPING";
  if (score > 0) return "UNDER";
  return null;
}

// ---------------------------------------------------------------------------
// Recommendation labels
// ---------------------------------------------------------------------------

import type { RecommendationCode } from "@/lib/types/appraisal";

export const RECOMMENDATION_LABELS: Record<RecommendationCode, string> = {
  COMMENDATION_LETTER: "Commendation Letter",
  SPECIALIZED_TRAINING: "Specialized Training",
  BONUS_GIFTS: "Bonus / Gifts",
  SPECIAL_RECOGNITION: "Special Recognition",
  CONSIDERED_FUTURE_PROMOTION: "Considered for Future Promotion",
  PROMOTION_NEXT_GRADE: "Promotion to Next Grade",
  PROMOTION_SUPERVISORY: "Promotion to Supervisory Level",
  PERFORMANCE_MEMO: "Performance Memo",
  TAILORED_TRAINING: "Tailored Training",
  WARNING_LETTER: "Warning Letter",
  PIP_PROBATION: "Performance Improvement Plan / Probation",
  ROLE_TRANSFER: "Role Transfer",
  DEMOTION: "Demotion",
  TERMINATION: "Termination",
  OTHERS: "Others",
};

export const ALL_RECOMMENDATIONS: RecommendationCode[] = [
  "COMMENDATION_LETTER",
  "SPECIALIZED_TRAINING",
  "BONUS_GIFTS",
  "SPECIAL_RECOGNITION",
  "CONSIDERED_FUTURE_PROMOTION",
  "PROMOTION_NEXT_GRADE",
  "PROMOTION_SUPERVISORY",
  "PERFORMANCE_MEMO",
  "TAILORED_TRAINING",
  "WARNING_LETTER",
  "PIP_PROBATION",
  "ROLE_TRANSFER",
  "DEMOTION",
  "TERMINATION",
  "OTHERS",
];

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

export function formatAppraisalDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
