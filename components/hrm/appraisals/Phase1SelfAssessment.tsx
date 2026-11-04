"use client";

import { useId } from "react";
import type { AppraisalSelfPhase1 } from "@/lib/types/appraisal";

export interface Phase1FormData {
  key_achievements: string;
  noteworthy_achievements: string;
  challenges_encountered: string;
  support_needed: string;
}

interface Phase1SelfAssessmentProps {
  data: Phase1FormData;
  onChange: (data: Phase1FormData) => void;
  readOnly?: boolean;
  /** Pre-fill from existing saved data */
  initialData?: AppraisalSelfPhase1 | null;
}

const FIELDS: {
  key: keyof Phase1FormData;
  label: string;
  placeholder: string;
  hint: string;
}[] = [
  {
    key: "key_achievements",
    label: "Key Achievements",
    placeholder:
      "Describe your key achievements based on your goals from the previous review period…",
    hint: "Reference specific targets, projects, or outcomes from your annual goals.",
  },
  {
    key: "noteworthy_achievements",
    label: "Other Noteworthy Accomplishments",
    placeholder:
      "List any other significant contributions, innovations, or wins not covered above…",
    hint: "Include cross-functional contributions, team wins, or process improvements.",
  },
  {
    key: "challenges_encountered",
    label: "Challenges Encountered",
    placeholder:
      "Describe the main obstacles or challenges you faced during this period…",
    hint: "Be honest and specific. This helps identify systemic issues or resource gaps.",
  },
  {
    key: "support_needed",
    label: "Support Needed from Management",
    placeholder:
      "What support, resources, or changes would help you perform better next period?",
    hint: "This is shared with your line manager and HR to plan developmental actions.",
  },
];

export function Phase1SelfAssessment({
  data,
  onChange,
  readOnly = false,
}: Phase1SelfAssessmentProps) {
  const baseId = useId();

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-outline-variant/60 bg-primary/5 p-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Phase 1 — Employee Self-Assessment.</span>{" "}
          Reflect honestly on your performance over the review period. Your responses form the
          foundation for your manager&apos;s evaluation in Phase 2 &amp; 3.
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
                  <span className="italic text-muted-foreground">
                    Not provided
                  </span>
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
