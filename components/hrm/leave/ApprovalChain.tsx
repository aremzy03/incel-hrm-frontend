import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { stitchCardClass } from "@/lib/design/field-styles";

export type ApprovalStepState = "completed" | "active" | "upcoming";

export interface ApprovalStep {
  label: string;
  description?: string;
  state: ApprovalStepState;
}

interface ApprovalChainProps {
  steps: ApprovalStep[];
  title?: string;
  className?: string;
}

export function ApprovalChain({
  steps,
  title = "Approval Chain",
  className,
}: ApprovalChainProps) {
  return (
    <div className={cn(stitchCardClass, "p-6", className)}>
      <h3 className="mb-6 text-title-sm font-semibold text-on-surface">{title}</h3>
      <div className="relative space-y-8 pl-4">
        <div className="absolute top-2 bottom-2 left-[11px] w-0.5 bg-outline-variant" />
        {steps.map((step, i) => (
          <div key={i} className="relative flex items-start gap-4">
            <div
              className={cn(
                "z-10 mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-4",
                step.state === "completed" &&
                  "border-primary-container bg-primary-container text-on-primary",
                step.state === "active" &&
                  "animate-pulse border-primary-container bg-surface",
                step.state === "upcoming" &&
                  "border-outline-variant bg-surface"
              )}
            >
              {step.state === "completed" ? (
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              ) : null}
            </div>
            <div>
              <p
                className={cn(
                  "text-body-md font-bold",
                  step.state === "upcoming"
                    ? "text-on-surface-variant"
                    : "text-on-surface"
                )}
              >
                {step.label}
              </p>
              {step.description ? (
                <p className="text-label-md text-on-surface-variant">
                  {step.description}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
