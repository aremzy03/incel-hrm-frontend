"use client";

import { GraduationCap, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTour, useTourAutoStart } from "@/contexts/TourContext";
import {
  getPrimaryTour,
  isTourFinished,
} from "@/lib/tutorials/eligibility";
import { useAuth } from "@/contexts/AuthContext";
import { useLoanAccessFlags } from "@/lib/loans/access";

export function TourBanner() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isObserver } = useLoanAccessFlags();
  const {
    module,
    isLoading,
    isRunning,
    progress,
    startTour,
    dismissTour,
    hasOutstanding,
  } = useTour();

  useTourAutoStart(pathname);

  if (!module || !user || isLoading || isRunning) return null;

  const dashboardPath = module === "leave" ? "/leave" : "/loans";
  if (pathname !== dashboardPath) return null;
  if (!hasOutstanding) return null;

  const primary = getPrimaryTour(user, module, {
    isLoanObserver: module === "loans" ? isObserver : false,
  });
  if (!primary || isTourFinished(progress, primary.id)) return null;

  const moduleLabel = module === "leave" ? "Leave Management" : "Staff Loans";

  return (
    <div
      className="mb-6 flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      role="status"
    >
      <div className="flex items-start gap-3">
        <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            New to {moduleLabel}?
          </p>
          <p className="text-sm text-muted-foreground">
            Take a guided tour: applying for leave, your history, and the
            department calendar.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          className="rounded-lg"
          onClick={() => void startTour(primary.id, { replay: true })}
        >
          Start tour
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-lg"
          onClick={() => void dismissTour(primary.id)}
        >
          Not now
        </Button>
        <button
          type="button"
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Dismiss tour banner"
          onClick={() => void dismissTour(primary.id)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
