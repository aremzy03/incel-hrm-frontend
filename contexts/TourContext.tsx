"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLoanAccessFlags } from "@/lib/loans/access";
import { runGuidedTour } from "@/lib/tutorials/driver";
import {
  getEligibleTours,
  getPrimaryTour,
  hasOutstandingTours,
  isTourFinished,
} from "@/lib/tutorials/eligibility";
import {
  fetchTutorialProgress,
  updateTutorialProgress,
} from "@/lib/tutorials/progress";
import type { TourId, TourModule, TutorialProgressItem } from "@/lib/tutorials/types";

interface TourContextValue {
  module: TourModule | null;
  progress: TutorialProgressItem[];
  isLoading: boolean;
  isRunning: boolean;
  eligibleTours: ReturnType<typeof getEligibleTours>;
  hasOutstanding: boolean;
  startTour: (tourId: TourId, options?: { replay?: boolean }) => Promise<void>;
  dismissTour: (tourId: TourId) => Promise<void>;
}

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({
  module,
  children,
}: {
  module: TourModule | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { isObserver } = useLoanAccessFlags();
  const [progress, setProgress] = useState<TutorialProgressItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  const observerOptions = useMemo(
    () => ({ isLoanObserver: module === "loans" ? isObserver : false }),
    [isObserver, module]
  );

  const eligibleTours = useMemo(
    () =>
      module && user ? getEligibleTours(user, module, observerOptions) : [],
    [module, user, observerOptions]
  );

  const hasOutstanding = useMemo(
    () =>
      module && user
        ? hasOutstandingTours(user, module, progress, observerOptions)
        : false,
    [module, user, progress, observerOptions]
  );

  const refreshProgress = useCallback(async () => {
    if (!isAuthenticated) {
      setProgress([]);
      setIsLoading(false);
      return;
    }
    try {
      const items = await fetchTutorialProgress();
      setProgress(items);
    } catch {
      setProgress([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refreshProgress();
  }, [refreshProgress]);

  const startTour = useCallback(
    async (tourId: TourId, options?: { replay?: boolean }) => {
      if (!module || isRunning) return;
      const tour = eligibleTours.find((t) => t.id === tourId);
      if (!tour) return;

      if (!options?.replay && isTourFinished(progress, tourId)) return;

      setIsRunning(true);
      try {
        const result = await runGuidedTour(tour, router);
        if (result === "completed") {
          const item = await updateTutorialProgress(tourId, "complete");
          setProgress((prev) => {
            const next = prev.filter((p) => p.tour_id !== tourId);
            return [...next, item];
          });
        } else {
          const item = await updateTutorialProgress(tourId, "dismiss");
          setProgress((prev) => {
            const next = prev.filter((p) => p.tour_id !== tourId);
            return [...next, item];
          });
        }
      } finally {
        setIsRunning(false);
      }
    },
    [eligibleTours, isRunning, module, progress, router]
  );

  const dismissTour = useCallback(async (tourId: TourId) => {
    const item = await updateTutorialProgress(tourId, "dismiss");
    setProgress((prev) => {
      const next = prev.filter((p) => p.tour_id !== tourId);
      return [...next, item];
    });
  }, []);

  const value = useMemo<TourContextValue>(
    () => ({
      module,
      progress,
      isLoading,
      isRunning,
      eligibleTours,
      hasOutstanding,
      startTour,
      dismissTour,
    }),
    [
      module,
      progress,
      isLoading,
      isRunning,
      eligibleTours,
      hasOutstanding,
      startTour,
      dismissTour,
    ]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error("useTour must be used within TourProvider");
  }
  return ctx;
}

export function useTourAutoStart(pathname: string) {
  const { module, isLoading, isRunning, progress, startTour } = useTour();
  const { user } = useAuth();
  const { isObserver } = useLoanAccessFlags();
  const autoStartedRef = useRef(false);

  useEffect(() => {
    if (!module || !user || isLoading || isRunning || autoStartedRef.current) {
      return;
    }

    const dashboardPath = module === "leave" ? "/leave" : "/loans";
    if (pathname !== dashboardPath) return;

    const primary = getPrimaryTour(user, module, {
      isLoanObserver: module === "loans" ? isObserver : false,
    });
    if (!primary) return;
    if (isTourFinished(progress, primary.id)) return;

    autoStartedRef.current = true;
    const timer = window.setTimeout(() => {
      void startTour(primary.id);
    }, 600);

    return () => window.clearTimeout(timer);
  }, [
    isLoading,
    isObserver,
    isRunning,
    module,
    pathname,
    progress,
    startTour,
    user,
  ]);
}
