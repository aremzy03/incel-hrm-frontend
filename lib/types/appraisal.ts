// ─── Status & Enum Codes ─────────────────────────────────────────────────────

export type AppraisalStatusCode =
  | "NOT_STARTED"
  | "DRAFT"
  | "SELF_SUBMITTED"
  | "PENDING_APPRAISEE_ACCEPTANCE"
  | "PENDING_HR_CALIBRATION"
  | "PENDING_MANAGEMENT_DECISION"
  | "FINALIZED"
  | "REOPENED_FOR_EMPLOYEE"
  | "REOPENED_FOR_SUPERVISOR";

export type PerformanceCategoryCode =
  | "EXCEPTIONAL"
  | "HIGH"
  | "GOOD"
  | "DEVELOPING"
  | "UNDER";

export type RecommendationCode =
  | "COMMENDATION_LETTER"
  | "SPECIALIZED_TRAINING"
  | "BONUS_GIFTS"
  | "SPECIAL_RECOGNITION"
  | "CONSIDERED_FUTURE_PROMOTION"
  | "PROMOTION_NEXT_GRADE"
  | "PROMOTION_SUPERVISORY"
  | "PERFORMANCE_MEMO"
  | "TAILORED_TRAINING"
  | "WARNING_LETTER"
  | "PIP_PROBATION"
  | "ROLE_TRANSFER"
  | "DEMOTION"
  | "TERMINATION"
  | "OTHERS";

export type AppraisalCycleType =
  | "90_DAY"
  | "6_MONTH"
  | "BI_ANNUAL_JULY"
  | "BI_ANNUAL_DECEMBER";

export type AppraisalCycleStatus = "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED";

// ─── Template & Cycle ────────────────────────────────────────────────────────

export interface AppraisalCycle {
  id: string;
  name: string;
  appraisal_type: string; // UUID of AppraisalType
  appraisal_type_name?: string;
  start_date: string;
  end_date: string;
  submission_deadline: string;
  status: AppraisalCycleStatus;
  created_at: string;
  updated_at: string;
}

export interface AppraisalType {
  id: string;
  name: string;
  description?: string;
}

export interface AppraisalQuestion {
  id: string;
  section: string; // UUID of AppraisalSection
  prompt: string;
  description: string;
  order: number;
}

export interface AppraisalSection {
  id: string;
  template: string; // UUID of AppraisalTemplate
  title: string;
  section_code: string; // e.g. "SECTION_A"
  weight: string; // Decimal string e.g. "15.00"
  rating_scale_max: number; // 4 or 5
  order: number;
  questions: AppraisalQuestion[];
}

export interface AppraisalTemplate {
  id: string;
  title: string;
  department_name?: string;
  appraisal_type_name: string;
  description: string;
  sections: AppraisalSection[];
}

// ─── Per-Question Answers ────────────────────────────────────────────────────

export interface AppraisalQuestionAnswer {
  id: string;
  question: string; // UUID
  question_prompt: string;
  section_id: string;
  section_code: string;
  self_rating: number | null;
  supervisor_rating: number | null;
  comments: string;
}

// ─── Phase Data ───────────────────────────────────────────────────────────────

export interface AppraisalSelfPhase1 {
  id: string;
  key_achievements: string;
  noteworthy_achievements: string;
  challenges_encountered: string;
  support_needed: string;
}

export interface AppraisalSupervisorPhase3 {
  id: string;
  strengths: string;
  areas_for_development: string;
  training_development_needs: string;
}

export interface AppraisalPhase4Signoff {
  id: string;
  goals_next_year: string;
  recommendations: RecommendationCode[];
  recommendation_others: string;
  supervisor_comments: string;
  appraisee_agrees: boolean | null;
  appraisee_disagree_reason: string;
  appraisee_additional_comments: string;
  hr_observations: string;
  hr_recommended_action: string;
  management_comments: string;
  committee_decision: string;
}

// ─── Full Appraisal Detail (GET /appraisals/{id}/) ───────────────────────────

export interface EmployeeAppraisalDetail {
  id: string;
  employee: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  supervisor?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  cycle: {
    id: string;
    name: string;
    submission_deadline: string;
  };
  template: AppraisalTemplate;
  status: AppraisalStatusCode;
  status_display: string;
  /** Decimal string e.g. "90.00" */
  self_score_total: string;
  /** Decimal string e.g. "90.00" */
  supervisor_score_total: string;
  performance_category: PerformanceCategoryCode | null;
  phase1_self: AppraisalSelfPhase1 | null;
  answers: AppraisalQuestionAnswer[];
  phase3_supervisor: AppraisalSupervisorPhase3 | null;
  phase4_signoff: AppraisalPhase4Signoff | null;
  self_submitted_at: string | null;
  supervisor_submitted_at: string | null;
  appraisee_signed_at: string | null;
  hr_reviewed_at: string | null;
  finalized_at: string | null;
  created_at: string;
}

/** Lightweight summary returned by list endpoints */
export interface EmployeeAppraisalSummary {
  id: string;
  employee: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  supervisor?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  cycle: {
    id: string;
    name: string;
    submission_deadline: string;
  };
  status: AppraisalStatusCode;
  status_display: string;
  self_score_total: string;
  supervisor_score_total: string;
  performance_category: PerformanceCategoryCode | null;
  created_at: string;
}

// ─── Request Payloads ────────────────────────────────────────────────────────

export interface SelfRatingPayload {
  question_id: string;
  self_rating: number;
  comments?: string;
}

export interface SelfSubmitPayload {
  key_achievements: string;
  noteworthy_achievements: string;
  challenges_encountered: string;
  support_needed: string;
  ratings: SelfRatingPayload[];
  /** true = save draft without advancing status */
  is_draft: boolean;
}

export interface SupervisorRatingPayload {
  question_id: string;
  supervisor_rating: number;
  comments?: string;
}

export interface SupervisorSubmitPayload {
  ratings: SupervisorRatingPayload[];
  strengths: string;
  areas_for_development: string;
  training_development_needs: string;
  goals_next_year: string;
  recommendations: RecommendationCode[];
  recommendation_others?: string;
  supervisor_comments: string;
  /** true = save draft without advancing status */
  is_draft: boolean;
}

export interface AppraiseeSignoffPayload {
  appraisee_agrees: boolean;
  appraisee_disagree_reason?: string;
  appraisee_additional_comments?: string;
}

export interface HrCalibratePayload {
  hr_observations: string;
  hr_recommended_action: string;
}

export interface FinalizePayload {
  management_comments: string;
  committee_decision: string;
}

export interface ReopenPayload {
  target_stage: "REOPENED_FOR_EMPLOYEE" | "REOPENED_FOR_SUPERVISOR";
  reason: string;
}

export interface CreateCyclePayload {
  name: string;
  appraisal_type: string; // UUID
  start_date: string;
  end_date: string;
  submission_deadline: string;
}

// ─── Audit Log ───────────────────────────────────────────────────────────────

export interface AppraisalAuditLog {
  id: string;
  appraisal: string;
  actor: {
    id: string;
    first_name: string;
    last_name: string;
  };
  action: string;
  from_status: AppraisalStatusCode | null;
  to_status: AppraisalStatusCode | null;
  notes: string;
  created_at: string;
}
