import type { User } from "@/lib/types/auth";
import { hasRole } from "@/lib/rbac";
import { getToursForModule } from "./definitions";
import type { TourDefinition, TourId, TourModule, TutorialProgressItem } from "./types";

export function getEligibleTours(
  user: User | null,
  module: TourModule,
  options?: { isLoanObserver?: boolean }
): TourDefinition[] {
  if (!user) return [];

  return getToursForModule(module).filter((tour) => {
    if (tour.requiresObserver) {
      return options?.isLoanObserver === true;
    }
    if (tour.requiredRoles?.length) {
      return hasRole(user, ...tour.requiredRoles);
    }
    return true;
  });
}

export function getPrimaryTour(
  user: User | null,
  module: TourModule,
  options?: { isLoanObserver?: boolean }
): TourDefinition | undefined {
  return getEligibleTours(user, module, options).find((t) => t.isPrimary);
}

export function getTourStatus(
  progress: TutorialProgressItem[],
  tourId: TourId
): TutorialProgressItem["status"] | null {
  return progress.find((p) => p.tour_id === tourId)?.status ?? null;
}

export function isTourFinished(
  progress: TutorialProgressItem[],
  tourId: TourId
): boolean {
  const status = getTourStatus(progress, tourId);
  return status === "COMPLETED" || status === "DISMISSED";
}

export function hasOutstandingTours(
  user: User | null,
  module: TourModule,
  progress: TutorialProgressItem[],
  options?: { isLoanObserver?: boolean }
): boolean {
  return getEligibleTours(user, module, options).some(
    (t) => !isTourFinished(progress, t.id)
  );
}
