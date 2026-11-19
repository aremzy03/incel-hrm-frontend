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
  section: string;
  prompt: string;
  description: string;
  order: number;
  response_type?: QuestionResponseType;
  counts_toward_score?: boolean;
  required?: boolean;
  weight?: string | null;
  options?: string[];
}

export type QuestionResponseType =
  | "RATING"
  | "SHORT_TEXT"
  | "LONG_TEXT"
  | "YES_NO"
  | "MULTI_SELECT";

export type SectionKind = "SCORED" | "INFORMATIONAL_RATING" | "NARRATIVE" | "CHECKBOX";

export type SectionAudience = "EMPLOYEE" | "SUPERVISOR" | "BOTH" | "HR" | "MANAGEMENT";

export type TemplateScope = "ORG" | "DEPARTMENT" | "UNIT" | "TEAM" | "";

export interface AppraisalSection {
  id: string;
  template?: string;
  version?: string;
  title: string;
  section_code: string;
  kind?: SectionKind;
  audience?: SectionAudience;
  weight: string;
  rating_scale_max: number;
  order: number;
  questions: AppraisalQuestion[];
}

export interface AppraisalPhase {
  id: string;
  title: string;
  order: number;
  sections: AppraisalSection[];
}

export interface AppraisalTemplateVersion {
  id: string;
  version_number: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  published_at: string | null;
  phases?: AppraisalPhase[];
  sections: AppraisalSection[];
}

export interface AppraisalTemplate {
  id: string;
  title: string;
  description?: string;
  appraisal_type?: string;
  appraisal_type_name: string;
  department?: string | null;
  department_name?: string | null;
  unit?: string | null;
  unit_name?: string | null;
  team?: string | null;
  team_name?: string | null;
  scope?: TemplateScope;
  assignment_locked?: boolean;
  is_active?: boolean;
  sections: AppraisalSection[];
  draft?: AppraisalTemplateVersion | null;
  published?: AppraisalTemplateVersion | null;
  created_at?: string;
  updated_at?: string;
}

export interface AppraisalTemplateSummary {
  id: string;
  title: string;
  description: string;
  appraisal_type: string;
  appraisal_type_name: string;
  scope: TemplateScope;
  department: string | null;
  department_name: string | null;
  unit: string | null;
  unit_name: string | null;
  team: string | null;
  team_name: string | null;
  is_active: boolean;
  has_draft: boolean;
  published_version_number: number | null;
  updated_at: string;
}

// ─── Per-Question Answers ────────────────────────────────────────────────────

export interface AppraisalQuestionAnswer {
  id: string;
  question: string; // UUID
  question_prompt: string;
  section_id: string;
  section_code: string;
  respondent?: "EMPLOYEE" | "SUPERVISOR" | "HR" | "MANAGEMENT";
  value?: string | number | boolean | string[] | null;
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
  template_version?: string | null;
  form?: AppraisalTemplateVersion | null;
  status: AppraisalStatusCode;
  status_display: string;
  /** Decimal string e.g. "90.00" */
  self_score_total: string;
  /** Decimal string e.g. "90.00" */
  supervisor_score_total: string;
  official_score?: string;
  score_is_provisional?: boolean;
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
  phase_submissions?: { id: string; phase: string; respondent: string; submitted_at: string }[];
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

export interface DynamicAnswerPayload {
  question_id: string;
  value: string | number | boolean | string[] | null;
}

export interface DynamicStepPayload {
  answers: DynamicAnswerPayload[];
  is_draft: boolean;
  phase_id?: string;
}

export interface TemplateQuestionDraft {
  prompt: string;
  description: string;
  response_type: QuestionResponseType;
  counts_toward_score: boolean;
  required: boolean;
  weight: string | null;
  options: string[];
  order?: number;
}

export interface TemplateSectionDraft {
  title: string;
  section_code: string;
  kind: SectionKind;
  audience: SectionAudience;
  weight: string;
  rating_scale_max: number;
  order?: number;
  questions: TemplateQuestionDraft[];
}

export interface TemplatePhaseDraft {
  title: string;
  sections: TemplateSectionDraft[];
}

export interface TemplateWritePayload {
  title: string;
  description?: string;
  appraisal_type: string;
  scope?: TemplateScope;
  department?: string | null;
  unit?: string | null;
  team?: string | null;
  phases?: TemplatePhaseDraft[];
  sections?: TemplateSectionDraft[];
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
