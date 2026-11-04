"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export const APPRAISAL_PHASES = [
  { id: 1, label: "Self-Assessment", description: "Phase 1" },
  { id: 2, label: "Performance Ratings", description: "Phase 2" },
  { id: 3, label: "Supervisor Evaluation", description: "Phase 3" },
  { id: 4, label: "1-on-1 & Sign-off", description: "Phase 4" },
] as const;

interface AppraisalStepperProps {
  activePhase: number;
  onPhaseChange?: (phase: number) => void;
  completedPhases?: number[];
  className?: string;
}

export function AppraisalStepper({
  activePhase,
  onPhaseChange,
  completedPhases = [],
  className,
}: AppraisalStepperProps) {
  return (
    <nav
      aria-label="Appraisal phases"
      className={cn("w-full", className)}
    >
      {/* Mobile: scrollable tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest p-1 sm:hidden">
        {APPRAISAL_PHASES.map((phase) => {
          const isActive = activePhase === phase.id;
          const isDone = completedPhases.includes(phase.id);
          return (
            <button
              key={phase.id}
              onClick={() => onPhaseChange?.(phase.id)}
              className={cn(
                "flex min-w-max flex-1 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {isDone && !isActive ? (
                <Check className="h-3 w-3 shrink-0 text-emerald-500" />
              ) : (
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted-foreground/20 text-muted-foreground"
                  )}
                >
                  {phase.id}
                </span>
              )}
              {phase.label}
            </button>
          );
        })}
      </div>

      {/* Desktop: horizontal step indicator */}
      <div className="hidden sm:flex sm:items-center sm:gap-0">
        {APPRAISAL_PHASES.map((phase, idx) => {
          const isActive = activePhase === phase.id;
          const isDone = completedPhases.includes(phase.id);
          const isLast = idx === APPRAISAL_PHASES.length - 1;
          return (
            <div key={phase.id} className="flex flex-1 items-center">
              <button
                onClick={() => onPhaseChange?.(phase.id)}
                className="group flex flex-col items-center gap-1.5 focus-visible:outline-none"
              >
                {/* Circle */}
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all",
                    isActive &&
                      "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30",
                    isDone &&
                      !isActive &&
                      "border-emerald-500 bg-emerald-500 text-white",
                    !isActive &&
                      !isDone &&
                      "border-outline-variant bg-surface-container text-muted-foreground group-hover:border-primary/60 group-hover:text-primary"
                  )}
                >
                  {isDone && !isActive ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    phase.id
                  )}
                </div>
                {/* Labels */}
                <div className="text-center">
                  <p
                    className={cn(
                      "text-[10px] font-medium uppercase tracking-wider",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {phase.description}
                  </p>
                  <p
                    className={cn(
                      "text-xs font-semibold",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {phase.label}
                  </p>
                </div>
              </button>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    "mx-2 mb-6 h-0.5 flex-1 rounded-full transition-all",
                    isDone ? "bg-emerald-400" : "bg-outline-variant"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
