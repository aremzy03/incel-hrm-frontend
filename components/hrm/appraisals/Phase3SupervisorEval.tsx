"use client";

import { useId } from "react";
import type { AppraisalSupervisorPhase3 } from "@/lib/types/appraisal";

export interface Phase3FormData {
  strengths: string;
  areas_for_development: string;
  training_development_needs: string;
}

const FIELDS: {
  key: keyof Phase3FormData;
  label: string;
  placeholder: string;
  hint: string;
}[] = [
  {
    key: "strengths",
    label: "Key Strengths",
    placeholder:
      "Describe the employee's most significant strengths and positive contributions…",
    hint: "Reference specific behaviours, skills, or outcomes you've observed.",
  },
  {
    key: "areas_for_development",
    label: "Areas for Development",
    placeholder:
      "Identify specific competencies, behaviours, or skills that need improvement…",
    hint: "Be constructive and specific. Link to KPIs where possible.",
  },
  {
    key: "training_development_needs",
    label: "Training & Development Needs",
    placeholder:
      "List recommended training programmes, certifications, or coaching activities…",
    hint: "These recommendations will be shared with HR for L&D planning.",
  },
];

interface Phase3SupervisorEvalProps {
  data: Phase3FormData;
  onChange: (data: Phase3FormData) => void;
  readOnly?: boolean;
  initialData?: AppraisalSupervisorPhase3 | null;
}

export function Phase3SupervisorEval({
  data,
  onChange,
  readOnly = false,
}: Phase3SupervisorEvalProps) {
  const baseId = useId();

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-outline-variant/60 bg-amber-50 dark:bg-amber-900/10 p-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            Phase 3 — Supervisor Qualitative Evaluation.
          </span>{" "}
          Provide a narrative assessment of the employee&apos;s strengths, development areas, and
          recommended training. These observations inform the 1-on-1 discussion in Phase 4.
        </p>
      </div>

      {FIELDS.map(({ key, label, placeholder, hint }) => {
        const id = `${baseId}-${key}`;
        return (
          <div key={key} className="space-y-1.5">
            <label
              htmlFor={id}
              className="block text-sm font-semibold text-foreground"
            >
              {label}
              <span className="ml-1 text-destructive" aria-hidden="true">
                *
              </span>
            </label>
            <p className="text-xs text-muted-foreground">{hint}</p>
            {readOnly ? (
              <div className="min-h-[80px] rounded-lg border border-outline-variant bg-surface-container px-3 py-2.5 text-sm text-foreground">
                {data[key] || (
                  <span className="italic text-muted-foreground">Not provided</span>
                )}
              </div>
            ) : (
              <textarea
                id={id}
                value={data[key]}
                onChange={(e) => onChange({ ...data, [key]: e.target.value })}
                placeholder={placeholder}
                rows={4}
                className="w-full resize-y rounded-lg border border-outline-variant bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                required
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
