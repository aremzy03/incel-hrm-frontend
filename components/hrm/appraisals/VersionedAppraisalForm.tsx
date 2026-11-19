"use client";

import { useEffect, useState } from "react";
import { Loader2, RotateCcw, Send, Save } from "lucide-react";
import { AppraisalStatusBadge, PerformanceTierBadge } from "@/components/hrm/appraisals/AppraisalStatusBadge";
import { AppraisalStepper } from "@/components/hrm/appraisals/AppraisalStepper";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAppraiseeSignoff,
  useFinalizeAppraisal,
  useHrCalibrate,
  useReopenAppraisal,
  useSelfSubmit,
  useSupervisorSubmit,
} from "@/lib/api/appraisals";
import { formatAppraisalDate, getPerformanceCategory } from "@/lib/appraisals/utils";
import {
  APPRAISAL_SUPERVISOR_ROLES,
  canFinalizeAppraisal,
  canHrCalibrate,
  canReopenAppraisal,
  hasRole,
} from "@/lib/rbac";
import { toast } from "@/lib/toast";
import type {
  AppraisalQuestion,
  AppraisalSection,
  AppraisalStatusCode,
  EmployeeAppraisalDetail,
  SectionAudience,
} from "@/lib/types/appraisal";

type AnswerValue = string | number | boolean | string[] | null;
type Respondent = "EMPLOYEE" | "SUPERVISOR" | "HR" | "MANAGEMENT";

const fieldClass =
  "w-full rounded-lg border border-outline-variant bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50";

function employeeEditing(status: AppraisalStatusCode) {
  return ["DRAFT", "NOT_STARTED", "REOPENED_FOR_EMPLOYEE"].includes(status);
}

function supervisorEditing(status: AppraisalStatusCode) {
  return ["SELF_SUBMITTED", "REOPENED_FOR_SUPERVISOR"].includes(status);
}

function supervisorSubmitted(status: AppraisalStatusCode) {
  return [
    "PENDING_APPRAISEE_ACCEPTANCE",
    "PENDING_HR_CALIBRATION",
    "PENDING_MANAGEMENT_DECISION",
    "FINALIZED",
  ].includes(status);
}

function employeeSubmitted(status: AppraisalStatusCode) {
  return !employeeEditing(status);
}

export function VersionedAppraisalDetail({ appraisal }: { appraisal: EmployeeAppraisalDetail }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<Record<string, Partial<Record<Respondent, AnswerValue>>>>({});
  const [agrees, setAgrees] = useState<boolean | null>(appraisal.phase4_signoff?.appraisee_agrees ?? null);
  const [disagreeReason, setDisagreeReason] = useState(appraisal.phase4_signoff?.appraisee_disagree_reason ?? "");
  const [extraComments, setExtraComments] = useState(appraisal.phase4_signoff?.appraisee_additional_comments ?? "");

  const selfSubmit = useSelfSubmit(appraisal.id);
  const supervisorSubmit = useSupervisorSubmit(appraisal.id);
  const appraiseeSignoff = useAppraiseeSignoff(appraisal.id);
  const hrCalibrate = useHrCalibrate(appraisal.id);
  const finalize = useFinalizeAppraisal(appraisal.id);
  const reopen = useReopenAppraisal(appraisal.id);

  useEffect(() => {
    const next: Record<string, Partial<Record<Respondent, AnswerValue>>> = {};
    for (const answer of appraisal.answers) {
      const respondent = answer.respondent ?? "EMPLOYEE";
      next[answer.question] = {
        ...(next[answer.question] ?? {}),
        [respondent]: answer.value ?? null,
      };
    }
    setValues(next);
  }, [appraisal]);

  const status = appraisal.status;
  const isOwner = user?.id === appraisal.employee.id;
  const isSupervisor = hasRole(user, ...APPRAISAL_SUPERVISOR_ROLES);
  const isHr = canHrCalibrate(user ?? null);
  const isManagement = canFinalizeAppraisal(user ?? null);
  const canReopen = canReopenAppraisal(user ?? null);
  const formPhases = appraisal.form?.phases?.length
    ? appraisal.form.phases
    : [{ id: "form", title: "Appraisal", order: 1, sections: appraisal.form?.sections ?? [] }];
  const sections = formPhases.flatMap((phase) => phase.sections);
  const submissions = appraisal.phase_submissions ?? [];

  function requiredRespondents(phase: (typeof formPhases)[number]) {
    const found = new Set<Respondent>();
    for (const section of phase.sections) {
      const audience = section.audience ?? "EMPLOYEE";
      if (audience === "BOTH") {
        found.add("EMPLOYEE");
        found.add("SUPERVISOR");
      } else {
        found.add(audience);
      }
    }
    return [...found];
  }

  function phaseSubmittedBy(phaseId: string, respondent: Respondent) {
    return submissions.some((item) => item.phase === phaseId && item.respondent === respondent);
  }

  function phaseProgressComplete(phase: (typeof formPhases)[number], includeLaterRoles: boolean) {
    return requiredRespondents(phase)
      .filter((respondent) => includeLaterRoles || respondent === "EMPLOYEE" || respondent === "SUPERVISOR")
      .every((respondent) => phaseSubmittedBy(phase.id, respondent));
  }

  const viewer: Respondent = isOwner ? "EMPLOYEE" : isSupervisor ? "SUPERVISOR" : isHr ? "HR" : "MANAGEMENT";

  function phaseUnlocked(phase: (typeof formPhases)[number]) {
    for (const earlier of formPhases) {
      if (earlier.id === phase.id) return true;
      if (!phaseProgressComplete(earlier, viewer === "HR" || viewer === "MANAGEMENT")) return false;
    }
    return false;
  }

  function canSee(audience: SectionAudience) {
    if (isHr) return true;
    if (audience === "HR" || audience === "MANAGEMENT") {
      if (isOwner || isSupervisor) return status === "FINALIZED";
      return isManagement && ["PENDING_MANAGEMENT_DECISION", "FINALIZED"].includes(status);
    }
    if (audience === "SUPERVISOR") {
      if (isSupervisor) return true;
      if (isOwner) return supervisorSubmitted(status);
      return isManagement && ["PENDING_MANAGEMENT_DECISION", "FINALIZED"].includes(status);
    }
    if (isOwner) return true;
    if (isSupervisor) return employeeSubmitted(status);
    return isManagement && ["PENDING_MANAGEMENT_DECISION", "FINALIZED"].includes(status);
  }

  function canEdit(audience: SectionAudience, respondent: Respondent) {
    const activePhase = step === signoffStep ? null : visiblePhases[step - 1];
    if (!activePhase || !phaseUnlocked(activePhase) || phaseSubmittedBy(activePhase.id, respondent)) return false;
    if (audience === "BOTH") {
      if (respondent === "EMPLOYEE") return isOwner && employeeEditing(status);
      if (respondent === "SUPERVISOR") return supervisorMayEdit(activePhase);
      return false;
    }
    if (audience === "EMPLOYEE") return isOwner && employeeEditing(status);
    if (audience === "SUPERVISOR") return supervisorMayEdit(activePhase);
    if (audience === "HR") return isHr && status === "PENDING_HR_CALIBRATION";
    if (audience === "MANAGEMENT") return isManagement && status === "PENDING_MANAGEMENT_DECISION";
    return false;
  }

  function setAnswer(questionId: string, respondent: Respondent, value: AnswerValue) {
    setValues((current) => ({
      ...current,
      [questionId]: { ...(current[questionId] ?? {}), [respondent]: value },
    }));
  }

  function supervisorMayEdit(phase: (typeof formPhases)[number] | null | undefined) {
    if (!isSupervisor || !phase || !phaseUnlocked(phase) || phaseSubmittedBy(phase.id, "SUPERVISOR")) return false;
    if (requiredRespondents(phase).includes("EMPLOYEE") && !phaseSubmittedBy(phase.id, "EMPLOYEE")) return false;
    return supervisorEditing(status) || employeeEditing(status) || status === "SELF_SUBMITTED";
  }

  function answersFor(respondent: Respondent, audiences: SectionAudience[], phase?: (typeof formPhases)[number] | null) {
    const source = phase?.sections ?? sections;
    return source
      .filter((section) => audiences.includes(section.audience ?? "EMPLOYEE"))
      .flatMap((section) =>
        section.questions.map((question) => ({
          question_id: question.id,
          value: values[question.id]?.[respondent] ?? null,
        }))
      );
  }

  function phaseFor(respondent: Respondent) {
    const current = step === signoffStep ? null : visiblePhases[step - 1];
    if (current && requiredRespondents(current).includes(respondent) && phaseUnlocked(current)) return current;
    return (
      formPhases.find(
        (phase) =>
          requiredRespondents(phase).includes(respondent) &&
          phaseUnlocked(phase) &&
          !phaseSubmittedBy(phase.id, respondent)
      ) ?? null
    );
  }

  async function submitEmployee(isDraft: boolean) {
    const phase = phaseFor("EMPLOYEE");
    try {
      await selfSubmit.mutateAsync({
        answers: answersFor("EMPLOYEE", ["EMPLOYEE", "BOTH"], phase),
        is_draft: isDraft,
        phase_id: phase && phase.id !== "form" ? phase.id : undefined,
      });
      toast.success(isDraft ? "Draft saved." : "Phase submitted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit.");
    }
  }

  async function submitSupervisor(isDraft: boolean) {
    const phase = phaseFor("SUPERVISOR");
    try {
      await supervisorSubmit.mutateAsync({
        answers: answersFor("SUPERVISOR", ["SUPERVISOR", "BOTH"], phase),
        is_draft: isDraft,
        phase_id: phase && phase.id !== "form" ? phase.id : undefined,
      });
      toast.success(isDraft ? "Draft saved." : "Phase submitted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit.");
    }
  }

  async function submitSignoff() {
    if (agrees === null) {
      toast.error("Choose whether you agree with the appraisal.");
      return;
    }
    if (agrees === false && !disagreeReason.trim()) {
      toast.error("A reason is required when you disagree.");
      return;
    }
    try {
      await appraiseeSignoff.mutateAsync({
        appraisee_agrees: agrees,
        appraisee_disagree_reason: disagreeReason,
        appraisee_additional_comments: extraComments,
      });
      toast.success("Sign-off submitted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign off.");
    }
  }

  async function submitHr() {
    try {
      await hrCalibrate.mutateAsync({
        answers: answersFor("HR", ["HR"], phaseFor("HR")),
        is_draft: false,
        phase_id: phaseFor("HR")?.id,
      });
      toast.success("HR calibration submitted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit HR calibration.");
    }
  }

  async function submitManagement() {
    try {
      await finalize.mutateAsync({
        answers: answersFor("MANAGEMENT", ["MANAGEMENT"], phaseFor("MANAGEMENT")),
        is_draft: false,
        phase_id: phaseFor("MANAGEMENT")?.id,
      });
      toast.success("Appraisal finalized.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not finalize.");
    }
  }

  const busy =
    selfSubmit.isPending ||
    supervisorSubmit.isPending ||
    appraiseeSignoff.isPending ||
    hrCalibrate.isPending ||
    finalize.isPending;

  const visiblePhases = formPhases.filter((phase) =>
    phase.sections.some((section) => canSee(section.audience ?? "EMPLOYEE"))
  );
  const signoffStep = visiblePhases.length + 1;
  const pipeline = [
    ...visiblePhases.map((phase, index) => ({
      id: index + 1,
      label: phase.title || `Phase ${index + 1}`,
      description: `Phase ${index + 1}`,
    })),
    { id: signoffStep, label: "Sign-off", description: "Agree or disagree" },
  ];
  const visibleSections = (visiblePhases[step - 1]?.sections ?? []).filter((section) =>
    canSee(section.audience ?? "EMPLOYEE")
  );

  const openPhase = step === signoffStep ? null : visiblePhases[step - 1] ?? null;
  const waitingOnSupervisor = Boolean(
    openPhase &&
      isOwner &&
      phaseSubmittedBy(openPhase.id, "EMPLOYEE") &&
      requiredRespondents(openPhase).includes("SUPERVISOR") &&
      !phaseSubmittedBy(openPhase.id, "SUPERVISOR")
  );
  const signoffLocked = formPhases.some((phase) => !phaseProgressComplete(phase, false));
  const lockedPhaseIds = [
    ...visiblePhases.flatMap((phase, index) => (phaseUnlocked(phase) ? [] : [index + 1])),
    ...(signoffLocked ? [signoffStep] : []),
  ];
  const completedPhaseIds = visiblePhases.flatMap((phase, index) =>
    phaseProgressComplete(phase, viewer === "HR" || viewer === "MANAGEMENT") ? [index + 1] : []
  );

  const tier = getPerformanceCategory(Number(appraisal.official_score ?? 0));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title={`${appraisal.employee.first_name} ${appraisal.employee.last_name} — Appraisal`}
        subtitle={appraisal.cycle.name}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {canReopen && status !== "FINALIZED" && (
              <Button
                variant="ghost"
                size="sm"
                disabled={reopen.isPending}
                onClick={() =>
                  reopen.mutate({ target_stage: "REOPENED_FOR_EMPLOYEE", reason: "HR override reopen" })
                }
              >
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Reopen
              </Button>
            )}
            {isOwner && employeeEditing(status) && phaseFor("EMPLOYEE") && !phaseSubmittedBy(phaseFor("EMPLOYEE")!.id, "EMPLOYEE") && (
              <>
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => submitEmployee(true)}>
                  <Save className="mr-1.5 h-4 w-4" />
                  Save draft
                </Button>
                <Button size="sm" className="rounded-full px-5" disabled={busy} onClick={() => submitEmployee(false)}>
                  <Send className="mr-1.5 h-4 w-4" />
                  Submit
                </Button>
              </>
            )}
            {isSupervisor && supervisorMayEdit(phaseFor("SUPERVISOR")) && (
              <>
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => submitSupervisor(true)}>
                  <Save className="mr-1.5 h-4 w-4" />
                  Save draft
                </Button>
                <Button size="sm" className="rounded-full px-5" disabled={busy} onClick={() => submitSupervisor(false)}>
                  <Send className="mr-1.5 h-4 w-4" />
                  Submit
                </Button>
              </>
            )}
            {isOwner && status === "PENDING_APPRAISEE_ACCEPTANCE" && !signoffLocked && (
              <Button size="sm" className="rounded-full px-5" disabled={busy} onClick={submitSignoff}>
                Complete sign-off
              </Button>
            )}
            {isHr && status === "PENDING_HR_CALIBRATION" && (
              <Button size="sm" className="rounded-full px-5" disabled={busy} onClick={submitHr}>
                Submit HR calibration
              </Button>
            )}
            {isManagement && status === "PENDING_MANAGEMENT_DECISION" && (
              <Button size="sm" className="rounded-full px-5" disabled={busy} onClick={submitManagement}>
                Finalize
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3">
        <AppraisalStatusBadge status={status} />
        <span className="text-xs text-muted-foreground">
          Official score:{" "}
          <span className="font-medium text-foreground">{appraisal.official_score ?? "0.00"}</span>
          {appraisal.score_is_provisional ? " (provisional)" : ""}
        </span>
        {(isHr || isManagement) && (
          <>
            <span className="text-xs text-muted-foreground">
              Employee score:{" "}
              <span className="font-medium text-foreground">{appraisal.self_score_total}</span>
            </span>
            <span className="text-xs text-muted-foreground">
              Supervisor score:{" "}
              <span className="font-medium text-foreground">{appraisal.supervisor_score_total}</span>
            </span>
          </>
        )}
        {tier && <PerformanceTierBadge category={tier} />}
        <span className="text-xs text-muted-foreground">
          Deadline: {formatAppraisalDate(appraisal.cycle.submission_deadline)}
        </span>
      </div>

      <AppraisalStepper
        phases={pipeline}
        activePhase={step}
        onPhaseChange={setStep}
        completedPhases={completedPhaseIds}
        lockedPhaseIds={lockedPhaseIds}
      />

      <div className="space-y-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-8">
        {waitingOnSupervisor && (
          <p className="text-sm text-muted-foreground">Waiting for the supervisor to submit this phase.</p>
        )}
        {step === signoffStep && (
          <SignoffPanel
            agrees={agrees}
            reason={disagreeReason}
            comments={extraComments}
            readOnly={!(isOwner && status === "PENDING_APPRAISEE_ACCEPTANCE")}
            onAgrees={setAgrees}
            onReason={setDisagreeReason}
            onComments={setExtraComments}
          />
        )}
        {step !== signoffStep && visibleSections.length === 0 && (
          <p className="text-sm text-muted-foreground">This phase has no questions for you.</p>
        )}
        {step !== signoffStep &&
          visibleSections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              values={values}
              canEdit={canEdit}
              showEmployeeColumn={
                section.audience !== "SUPERVISOR" &&
                (isOwner || isHr || (isSupervisor && employeeSubmitted(status)) || (isManagement && ["PENDING_MANAGEMENT_DECISION", "FINALIZED"].includes(status)))
              }
              showSupervisorColumn={
                section.audience === "SUPERVISOR" ||
                (section.audience === "BOTH" && (isSupervisor || isHr || supervisorSubmitted(status) || (isManagement && ["PENDING_MANAGEMENT_DECISION", "FINALIZED"].includes(status))))
              }
              onChange={setAnswer}
            />
          ))}
      </div>
    </div>
  );
}

function SectionCard({
  section,
  values,
  canEdit,
  showEmployeeColumn,
  showSupervisorColumn,
  onChange,
}: {
  section: AppraisalSection;
  values: Record<string, Partial<Record<Respondent, AnswerValue>>>;
  canEdit: (audience: SectionAudience, respondent: Respondent) => boolean;
  showEmployeeColumn: boolean;
  showSupervisorColumn: boolean;
  onChange: (questionId: string, respondent: Respondent, value: AnswerValue) => void;
}) {
  const audience = section.audience ?? "EMPLOYEE";
  const respondents: Respondent[] =
    audience === "BOTH"
      ? [
          ...(showEmployeeColumn ? ["EMPLOYEE" as const] : []),
          ...(showSupervisorColumn ? ["SUPERVISOR" as const] : []),
        ]
      : audience === "SUPERVISOR"
        ? ["SUPERVISOR"]
        : audience === "HR"
          ? ["HR"]
          : audience === "MANAGEMENT"
            ? ["MANAGEMENT"]
            : ["EMPLOYEE"];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-bold">{section.title}</h2>
        <p className="text-xs text-muted-foreground">
          {section.kind === "SCORED" || section.kind === "INFORMATIONAL_RATING"
            ? `${section.kind === "SCORED" ? "Scored" : "Informational"} · ${section.weight}% · scale 1–${section.rating_scale_max}${
                section.audience === "BOTH" ? " · employee and supervisor scores stay separate" : ""
              }`
            : section.kind === "CHECKBOX"
              ? "Checkboxes · choose any that apply"
              : section.kind}
        </p>
      </div>
      {section.questions.map((question) => (
        <div key={question.id} className="space-y-2">
          <p className="text-sm font-medium">
            {question.prompt}
            {question.required ? <span className="ml-1 text-destructive">*</span> : null}
          </p>
          {question.description ? <p className="text-xs text-muted-foreground">{question.description}</p> : null}
          <div className={respondents.length > 1 ? "grid gap-3 sm:grid-cols-2" : "space-y-2"}>
            {respondents.map((respondent) => (
              <QuestionInput
                key={respondent}
                question={question}
                scale={section.rating_scale_max}
                likert={section.kind === "INFORMATIONAL_RATING"}
                label={respondents.length > 1 ? respondent.toLowerCase() : undefined}
                value={values[question.id]?.[respondent] ?? null}
                readOnly={!canEdit(audience, respondent)}
                onChange={(value) => onChange(question.id, respondent, value)}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function selectedRating(value: AnswerValue) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function LikertScale({
  scale,
  value,
  readOnly,
  onChange,
}: {
  scale: number;
  value: AnswerValue;
  readOnly: boolean;
  onChange: (value: AnswerValue) => void;
}) {
  const selected = selectedRating(value);
  return (
    <div role="radiogroup" className="flex flex-wrap gap-2 font-normal normal-case">
      {Array.from({ length: scale }, (_, index) => {
        const rating = index + 1;
        const active = selected === rating;
        return (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={readOnly}
            onClick={() => onChange(rating)}
            className={`h-11 min-w-11 rounded-full border px-3 text-sm font-semibold transition-colors disabled:cursor-default ${
              active
                ? "border-primary bg-primary text-primary-foreground disabled:opacity-100"
                : "border-outline-variant bg-background text-foreground hover:border-primary/50 disabled:opacity-70"
            }`}
          >
            {rating}
          </button>
        );
      })}
    </div>
  );
}

function QuestionInput({
  question,
  scale,
  likert = false,
  label,
  value,
  readOnly,
  onChange,
}: {
  question: AppraisalQuestion;
  scale: number;
  likert?: boolean;
  label?: string;
  value: AnswerValue;
  readOnly: boolean;
  onChange: (value: AnswerValue) => void;
}) {
  const type = question.response_type ?? "LONG_TEXT";
  return (
    <div className="block space-y-1 text-xs font-semibold capitalize text-muted-foreground">
      {label}
      {type === "RATING" && likert && <LikertScale scale={scale} value={value} readOnly={readOnly} onChange={onChange} />}
      {type === "RATING" && !likert && (
        <select
          className={fieldClass}
          disabled={readOnly}
          value={value === null || value === undefined ? "" : String(value)}
          onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
        >
          <option value="">Select…</option>
          {Array.from({ length: scale }, (_, index) => index + 1).map((rating) => (
            <option key={rating} value={rating}>
              {rating}
            </option>
          ))}
        </select>
      )}
      {type === "SHORT_TEXT" && (
        <input
          className={fieldClass}
          disabled={readOnly}
          maxLength={500}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {type === "LONG_TEXT" && (
        <textarea
          className={fieldClass}
          rows={3}
          disabled={readOnly}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {type === "YES_NO" && (
        <select
          className={fieldClass}
          disabled={readOnly}
          value={value === true ? "yes" : value === false ? "no" : ""}
          onChange={(event) => onChange(event.target.value === "" ? null : event.target.value === "yes")}
        >
          <option value="">Select…</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      )}
      {type === "MULTI_SELECT" && (
        <div className="space-y-1 font-normal normal-case">
          {(question.options ?? []).map((option) => {
            const selected = Array.isArray(value) ? value : [];
            const checked = selected.includes(option);
            return (
              <label key={option} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={checked}
                  onChange={() =>
                    onChange(checked ? selected.filter((item) => item !== option) : [...selected, option])
                  }
                />
                {option}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SignoffPanel({
  agrees,
  reason,
  comments,
  readOnly,
  onAgrees,
  onReason,
  onComments,
}: {
  agrees: boolean | null;
  reason: string;
  comments: string;
  readOnly: boolean;
  onAgrees: (value: boolean) => void;
  onReason: (value: string) => void;
  onComments: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold">Do you agree with this appraisal?</h2>
      <div className="flex gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" disabled={readOnly} checked={agrees === true} onChange={() => onAgrees(true)} />
          I agree
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" disabled={readOnly} checked={agrees === false} onChange={() => onAgrees(false)} />
          I disagree
        </label>
      </div>
      {agrees === false && (
        <textarea
          className={fieldClass}
          rows={3}
          disabled={readOnly}
          placeholder="Reason for disagreement"
          value={reason}
          onChange={(event) => onReason(event.target.value)}
        />
      )}
      <textarea
        className={fieldClass}
        rows={3}
        disabled={readOnly}
        placeholder="Additional comments"
        value={comments}
        onChange={(event) => onComments(event.target.value)}
      />
    </div>
  );
}
