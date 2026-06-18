import type { RoleName } from "@/lib/types/auth";

export type TourModule = "leave" | "loans";

export type TourId =
  | "leave-employee"
  | "leave-approver"
  | "leave-hr"
  | "loans-employee"
  | "loans-approver"
  | "loans-hr"
  | "loans-observer";

export type TutorialProgressStatus = "COMPLETED" | "DISMISSED";

export interface TutorialProgressItem {
  tour_id: TourId;
  status: TutorialProgressStatus;
  updated_at: string;
}

export interface TourStep {
  element: string;
  title: string;
  description: string;
  route?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export interface TourDefinition {
  id: TourId;
  module: TourModule;
  label: string;
  description: string;
  /** Primary tour auto-started on first module visit */
  isPrimary?: boolean;
  requiredRoles?: RoleName[];
  /** When true, tour is shown only if this returns true (e.g. loan observer) */
  requiresObserver?: boolean;
  steps: TourStep[];
}
