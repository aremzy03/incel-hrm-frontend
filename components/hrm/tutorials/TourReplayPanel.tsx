"use client";

import { useState } from "react";
import { CheckCircle2, GraduationCap, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTour } from "@/contexts/TourContext";
import { isTourFinished } from "@/lib/tutorials/eligibility";
import type { TourId } from "@/lib/tutorials/types";

export function TourReplayPanel({ onNavigate }: { onNavigate?: () => void }) {
  const { eligibleTours, progress, isRunning, startTour } = useTour();
  const [open, setOpen] = useState(false);

  if (!eligibleTours.length) return null;

  return (
    <div className="border-t border-outline-variant p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-label-md font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
      >
        <GraduationCap className="h-4 w-4 shrink-0" />
        <span className="truncate">Module tours</span>
      </button>

      {open ? (
        <ul className="mt-2 space-y-1">
          {eligibleTours.map((tour) => {
            const finished = isTourFinished(progress, tour.id);
            return (
              <li key={tour.id}>
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => {
                    onNavigate?.();
                    setOpen(false);
                    void startTour(tour.id as TourId, { replay: true });
                  }}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface-container-high disabled:opacity-50",
                    finished ? "text-on-surface-variant" : "text-on-surface"
                  )}
                >
                  {finished ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-container" />
                  ) : (
                    <PlayCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary-container" />
                  )}
                  <span>
                    <span className="block font-medium">{tour.label}</span>
                    <span className="block text-xs text-on-surface-variant/80">
                      {tour.description}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
