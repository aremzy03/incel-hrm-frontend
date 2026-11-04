"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  calcSectionScore,
  calcGrandTotal,
} from "@/lib/appraisals/utils";
import { PerformanceTierBadge } from "@/components/hrm/appraisals/AppraisalStatusBadge";
import { getPerformanceCategory } from "@/lib/appraisals/utils";
import type {
  AppraisalSection,
  AppraisalQuestionAnswer,
} from "@/lib/types/appraisal";

// ---------------------------------------------------------------------------
// Ratings State Map: questionId → { self_rating, supervisor_rating, comments }
// ---------------------------------------------------------------------------

export interface RatingEntry {
  self_rating: number | null;
  supervisor_rating: number | null;
  comments: string;
}

export type RatingsMap = Record<string, RatingEntry>;

interface Phase2RatingsTableProps {
  sections: AppraisalSection[];
  ratingsMap: RatingsMap;
  onRatingsChange: (updated: RatingsMap) => void;
  /** Can the current user edit the self-rating column? */
  canEditSelf?: boolean;
  /** Can the current user edit the supervisor-rating column? */
  canEditSupervisor?: boolean;
  /** Pre-fill from saved answers */
  savedAnswers?: AppraisalQuestionAnswer[];
}

// ---------------------------------------------------------------------------
// Rating Star Selector
// ---------------------------------------------------------------------------

interface StarRatingProps {
  value: number | null;
  max: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  label: string;
}

function StarRating({ value, max, onChange, readOnly, label }: StarRatingProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="flex gap-0.5" role="group" aria-label={label}>
        {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(star)}
            aria-label={`${star} out of ${max}`}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold transition-all",
              value === star
                ? "bg-primary text-primary-foreground shadow-sm"
                : value !== null && star <= value
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground hover:bg-muted-foreground/20",
              readOnly && "cursor-default opacity-70"
            )}
          >
            {star}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section Card (accordion)
// ---------------------------------------------------------------------------

interface SectionCardProps {
  section: AppraisalSection;
  ratingsMap: RatingsMap;
  onRatingsChange: (updated: RatingsMap) => void;
  canEditSelf: boolean;
  canEditSupervisor: boolean;
}

function SectionCard({
  section,
  ratingsMap,
  onRatingsChange,
  canEditSelf,
  canEditSupervisor,
}: SectionCardProps) {
  const [open, setOpen] = useState(true);

  const weight = parseFloat(section.weight);
  const scaleMax = section.rating_scale_max;

  const selfRatings = section.questions.map(
    (q) => ratingsMap[q.id]?.self_rating ?? null
  );
  const supRatings = section.questions.map(
    (q) => ratingsMap[q.id]?.supervisor_rating ?? null
  );

  const selfScore = calcSectionScore(selfRatings, scaleMax, weight);
  const supScore = calcSectionScore(supRatings, scaleMax, weight);

  function handleRatingChange(
    questionId: string,
    field: "self_rating" | "supervisor_rating" | "comments",
    value: number | string | null
  ) {
    onRatingsChange({
      ...ratingsMap,
      [questionId]: {
        self_rating: ratingsMap[questionId]?.self_rating ?? null,
        supervisor_rating: ratingsMap[questionId]?.supervisor_rating ?? null,
        comments: ratingsMap[questionId]?.comments ?? "",
        [field]: value,
      },
    });
  }

  return (
    <div className="rounded-xl border border-outline-variant overflow-hidden">
      {/* Section header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 bg-surface-container px-4 py-3 text-left transition-colors hover:bg-muted/50"
      >
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {section.section_code}
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              Weight: {weight}%
            </span>
          </div>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {section.title}
          </p>
        </div>

        {/* Live section scores */}
        <div className="hidden items-center gap-4 sm:flex">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Self
            </p>
            <p className="text-sm font-bold text-foreground">
              {selfScore.toFixed(2)}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Manager
            </p>
            <p className="text-sm font-bold text-foreground">
              {supScore.toFixed(2)}%
            </p>
          </div>
        </div>

        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {/* Questions */}
      {open && (
        <div className="divide-y divide-outline-variant/40 bg-background">
          {section.questions
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((question, qi) => {
              const entry = ratingsMap[question.id] ?? {
                self_rating: null,
                supervisor_rating: null,
                comments: "",
              };
              return (
                <div key={question.id} className="px-4 py-4 space-y-3">
                  {/* Question prompt */}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      <span className="mr-2 text-muted-foreground">{qi + 1}.</span>
                      {question.prompt}
                    </p>
                    {question.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {question.description}
                      </p>
                    )}
                  </div>

                  {/* Rating inputs */}
                  <div className="flex flex-wrap gap-6">
                    <StarRating
                      value={entry.self_rating}
                      max={scaleMax}
                      label="Self Rating"
                      readOnly={!canEditSelf}
                      onChange={(v) =>
                        handleRatingChange(question.id, "self_rating", v)
                      }
                    />
                    <StarRating
                      value={entry.supervisor_rating}
                      max={scaleMax}
                      label="Manager Rating"
                      readOnly={!canEditSupervisor}
                      onChange={(v) =>
                        handleRatingChange(question.id, "supervisor_rating", v)
                      }
                    />
                  </div>

                  {/* Comments */}
                  {(canEditSelf || canEditSupervisor) && (
                    <input
                      type="text"
                      value={entry.comments}
                      onChange={(e) =>
                        handleRatingChange(question.id, "comments", e.target.value)
                      }
                      placeholder="Optional: rationale or comment…"
                      className="w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                    />
                  )}
                  {!canEditSelf && !canEditSupervisor && entry.comments && (
                    <p className="text-xs italic text-muted-foreground">
                      {entry.comments}
                    </p>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grand Total Score Display
// ---------------------------------------------------------------------------

interface ScoreDisplayProps {
  sections: AppraisalSection[];
  ratingsMap: RatingsMap;
}

export function LiveScoreDisplay({ sections, ratingsMap }: ScoreDisplayProps) {
  const selfSectionScores = sections.map((s) => {
    const ratings = s.questions.map((q) => ratingsMap[q.id]?.self_rating ?? null);
    return calcSectionScore(ratings, s.rating_scale_max, parseFloat(s.weight));
  });
  const supSectionScores = sections.map((s) => {
    const ratings = s.questions.map((q) => ratingsMap[q.id]?.supervisor_rating ?? null);
    return calcSectionScore(ratings, s.rating_scale_max, parseFloat(s.weight));
  });

  const selfTotal = calcGrandTotal(selfSectionScores);
  const supTotal = calcGrandTotal(supSectionScores);
  const supCategory = getPerformanceCategory(supTotal);

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Live Score Summary
      </p>
      <div className="flex flex-wrap items-end gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Self Score
          </p>
          <p className="text-2xl font-bold text-foreground">
            {selfTotal.toFixed(2)}
            <span className="text-sm text-muted-foreground">%</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Manager Score
          </p>
          <p className="text-2xl font-bold text-foreground">
            {supTotal.toFixed(2)}
            <span className="text-sm text-muted-foreground">%</span>
          </p>
        </div>
        {supCategory && (
          <PerformanceTierBadge category={supCategory} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Phase 2 Component
// ---------------------------------------------------------------------------

export function Phase2RatingsTable({
  sections,
  ratingsMap,
  onRatingsChange,
  canEditSelf = false,
  canEditSupervisor = false,
  savedAnswers = [],
}: Phase2RatingsTableProps) {
  // Pre-fill ratingsMap from savedAnswers if not already set
  const initializedMap: RatingsMap = { ...ratingsMap };
  for (const answer of savedAnswers) {
    if (!initializedMap[answer.question]) {
      initializedMap[answer.question] = {
        self_rating: answer.self_rating,
        supervisor_rating: answer.supervisor_rating,
        comments: answer.comments,
      };
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-outline-variant/60 bg-primary/5 p-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            Phase 2 — Job Performance Assessment.
          </span>{" "}
          Rate each KPI/competency on a {sections[0]?.rating_scale_max ?? 5}-point scale.
          {canEditSelf && " Your self-ratings are editable."}
          {canEditSupervisor && " Manager ratings are editable."}
          {!canEditSelf && !canEditSupervisor && " All ratings are read-only at this stage."}
        </p>
      </div>

      {sections
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            ratingsMap={initializedMap}
            onRatingsChange={onRatingsChange}
            canEditSelf={canEditSelf}
            canEditSupervisor={canEditSupervisor}
          />
        ))}

      {sections.length > 0 && (
        <LiveScoreDisplay sections={sections} ratingsMap={initializedMap} />
      )}
    </div>
  );
}
