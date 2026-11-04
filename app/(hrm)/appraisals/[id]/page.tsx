"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, AlertCircle, RotateCcw, Send, Save } from "lucide-react";
import { useAppraisalDetail, useSelfSubmit, useSupervisorSubmit, useAppraiseeSignoff, useHrCalibrate, useFinalizeAppraisal, useReopenAppraisal } from "@/lib/api/appraisals";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { AppraisalStepper } from "@/components/hrm/appraisals/AppraisalStepper";
import { AppraisalStatusBadge } from "@/components/hrm/appraisals/AppraisalStatusBadge";
import { Phase1SelfAssessment, type Phase1FormData } from "@/components/hrm/appraisals/Phase1SelfAssessment";
import { Phase2RatingsTable, type RatingsMap } from "@/components/hrm/appraisals/Phase2RatingsTable";
import { Phase3SupervisorEval, type Phase3FormData } from "@/components/hrm/appraisals/Phase3SupervisorEval";
import {
  Phase4Signoff,
  type Phase4SupervisorData,
  type Phase4SignoffData,
  type Phase4HrData,
  type Phase4ManagementData,
} from "@/components/hrm/appraisals/Phase4Signoff";
import { Button } from "@/components/ui/button";
import { formatAppraisalDate } from "@/lib/appraisals/utils";
import { canActOnAppraisal, canHrCalibrate, canFinalizeAppraisal, canReopenAppraisal, APPRAISAL_SUPERVISOR_ROLES } from "@/lib/rbac";
import { hasRole } from "@/lib/rbac";
import type { AppraisalStatusCode, SelfRatingPayload, SupervisorRatingPayload, RecommendationCode } from "@/lib/types/appraisal";
import { toast } from "@/lib/toast";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isEmployeeEditableStatus(status: AppraisalStatusCode) {
  return ["DRAFT", "NOT_STARTED", "REOPENED_FOR_EMPLOYEE"].includes(status);
}

function isSupervisorEditableStatus(status: AppraisalStatusCode) {
  return ["SELF_SUBMITTED", "REOPENED_FOR_SUPERVISOR"].includes(status);
}

function isSignoffStatus(status: AppraisalStatusCode) {
  return status === "PENDING_APPRAISEE_ACCEPTANCE";
}

function isHrCalibrateStatus(status: AppraisalStatusCode) {
  return status === "PENDING_HR_CALIBRATION";
}

function isManagementStatus(status: AppraisalStatusCode) {
  return status === "PENDING_MANAGEMENT_DECISION";
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function AppraisalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: appraisal, isLoading, error } = useAppraisalDetail(id);

  // ── Phase 1 State ─────────────────────────────────────────────────────────
  const [phase1, setPhase1] = useState<Phase1FormData>({
    key_achievements: "",
    noteworthy_achievements: "",
    challenges_encountered: "",
    support_needed: "",
  });

  // ── Phase 2 State ─────────────────────────────────────────────────────────
  const [ratingsMap, setRatingsMap] = useState<RatingsMap>({});

  // ── Phase 3 State ─────────────────────────────────────────────────────────
  const [phase3, setPhase3] = useState<Phase3FormData>({
    strengths: "",
    areas_for_development: "",
    training_development_needs: "",
  });

  // ── Phase 4 State ─────────────────────────────────────────────────────────
  const [phase4Supervisor, setPhase4Supervisor] = useState<Phase4SupervisorData>({
    goals_next_year: "",
    recommendations: [] as RecommendationCode[],
    recommendation_others: "",
    supervisor_comments: "",
  });

  const [phase4Signoff, setPhase4Signoff] = useState<Phase4SignoffData>({
    appraisee_agrees: null,
    appraisee_disagree_reason: "",
    appraisee_additional_comments: "",
  });

  const [phase4Hr, setPhase4Hr] = useState<Phase4HrData>({
    hr_observations: "",
    hr_recommended_action: "",
  });

  const [phase4Management, setPhase4Management] = useState<Phase4ManagementData>({
    management_comments: "",
    committee_decision: "",
  });

  const [activePhase, setActivePhase] = useState(1);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const selfSubmit = useSelfSubmit(id);
  const supervisorSubmit = useSupervisorSubmit(id);
  const appraiseeSignoff = useAppraiseeSignoff(id);
  const hrCalibrate = useHrCalibrate(id);
  const finalize = useFinalizeAppraisal(id);
  const reopen = useReopenAppraisal(id);

  // ── Pre-fill state from fetched data ─────────────────────────────────────
  useEffect(() => {
    if (!appraisal) return;

    if (appraisal.phase1_self) {
      setPhase1({
        key_achievements: appraisal.phase1_self.key_achievements,
        noteworthy_achievements: appraisal.phase1_self.noteworthy_achievements,
        challenges_encountered: appraisal.phase1_self.challenges_encountered,
        support_needed: appraisal.phase1_self.support_needed,
      });
    }

    // Pre-fill ratingsMap from saved answers
    const map: RatingsMap = {};
    for (const a of appraisal.answers) {
      map[a.question] = {
        self_rating: a.self_rating,
        supervisor_rating: a.supervisor_rating,
        comments: a.comments,
      };
    }
    setRatingsMap(map);

    if (appraisal.phase3_supervisor) {
      setPhase3({
        strengths: appraisal.phase3_supervisor.strengths,
        areas_for_development: appraisal.phase3_supervisor.areas_for_development,
        training_development_needs: appraisal.phase3_supervisor.training_development_needs,
      });
    }

    if (appraisal.phase4_signoff) {
      const s = appraisal.phase4_signoff;
      setPhase4Supervisor({
        goals_next_year: s.goals_next_year,
        recommendations: s.recommendations,
        recommendation_others: s.recommendation_others,
        supervisor_comments: s.supervisor_comments,
      });
      setPhase4Signoff({
        appraisee_agrees: s.appraisee_agrees,
        appraisee_disagree_reason: s.appraisee_disagree_reason,
        appraisee_additional_comments: s.appraisee_additional_comments,
      });
      setPhase4Hr({
        hr_observations: s.hr_observations,
        hr_recommended_action: s.hr_recommended_action,
      });
      setPhase4Management({
        management_comments: s.management_comments,
        committee_decision: s.committee_decision,
      });
    }
  }, [appraisal]);

  // ── Role / Permission Flags ────────────────────────────────────────────────
  const status = appraisal?.status;
  const employeeId = appraisal?.employee.id ?? "";
  const isEmployee = user?.id === employeeId;
  const isSupervisor = hasRole(user, ...APPRAISAL_SUPERVISOR_ROLES);
  const isHr = canHrCalibrate(user ?? null);
  const isManagement = canFinalizeAppraisal(user ?? null);
  const canReopen = canReopenAppraisal(user ?? null);

  const canEditPhase1 = !!status && isEmployeeEditableStatus(status) && isEmployee;
  const canEditSelfRatings = !!status && isEmployeeEditableStatus(status) && isEmployee;
  const canEditSupervisorRatings = !!status && isSupervisorEditableStatus(status) && isSupervisor;
  const canEditPhase3 = !!status && isSupervisorEditableStatus(status) && isSupervisor;
  const canEditPhase4Supervisor = !!status && isSupervisorEditableStatus(status) && isSupervisor;
  const canEditSignoff = !!status && isSignoffStatus(status) && isEmployee;
  const canEditHr = !!status && isHrCalibrateStatus(status) && isHr;
  const canEditManagement = !!status && isManagementStatus(status) && isManagement;

  // ── Submit Handlers ────────────────────────────────────────────────────────

  function buildSelfRatings(): SelfRatingPayload[] {
    return Object.entries(ratingsMap)
      .filter(([, v]) => v.self_rating !== null)
      .map(([question_id, v]) => ({
        question_id,
        self_rating: v.self_rating!,
        comments: v.comments || undefined,
      }));
  }

  function buildSupervisorRatings(): SupervisorRatingPayload[] {
    return Object.entries(ratingsMap)
      .filter(([, v]) => v.supervisor_rating !== null)
      .map(([question_id, v]) => ({
        question_id,
        supervisor_rating: v.supervisor_rating!,
        comments: v.comments || undefined,
      }));
  }

  async function handleSaveDraft() {
    if (!status || !canEditPhase1) return;
    try {
      await selfSubmit.mutateAsync({
        ...phase1,
        ratings: buildSelfRatings(),
        is_draft: true,
      });
      toast.success("Draft saved successfully.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save draft.");
    }
  }

  async function handleSelfSubmit() {
    try {
      await selfSubmit.mutateAsync({
        ...phase1,
        ratings: buildSelfRatings(),
        is_draft: false,
      });
      toast.success("Self-assessment submitted successfully.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to submit self-assessment.");
    }
  }

  async function handleSupervisorSubmit(isDraft: boolean) {
    try {
      await supervisorSubmit.mutateAsync({
        ratings: buildSupervisorRatings(),
        ...phase3,
        ...phase4Supervisor,
        is_draft: isDraft,
      });
      toast.success(isDraft ? "Draft saved." : "Manager assessment submitted.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Submission failed.");
    }
  }

  async function handleSignoff() {
    if (phase4Signoff.appraisee_agrees === null) {
      toast.error("Please select whether you agree or disagree with the appraisal.");
      return;
    }
    if (phase4Signoff.appraisee_agrees === false && !phase4Signoff.appraisee_disagree_reason.trim()) {
      toast.error("Please provide a reason for your disagreement.");
      return;
    }
    try {
      await appraiseeSignoff.mutateAsync({
        appraisee_agrees: phase4Signoff.appraisee_agrees,
        appraisee_disagree_reason: phase4Signoff.appraisee_disagree_reason,
        appraisee_additional_comments: phase4Signoff.appraisee_additional_comments,
      });
      toast.success("Sign-off submitted.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Sign-off failed.");
    }
  }

  async function handleHrCalibrate() {
    try {
      await hrCalibrate.mutateAsync(phase4Hr);
      toast.success("HR calibration submitted.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "HR calibration failed.");
    }
  }

  async function handleFinalize() {
    try {
      await finalize.mutateAsync(phase4Management);
      toast.success("Appraisal finalized.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Finalization failed.");
    }
  }

  // ── Determine completed phases ────────────────────────────────────────────
  function getCompletedPhases(): number[] {
    if (!status) return [];
    const completed: number[] = [];
    if (appraisal?.phase1_self) completed.push(1);
    if (appraisal?.self_submitted_at) completed.push(2);
    if (appraisal?.phase3_supervisor) completed.push(3);
    if (appraisal?.phase4_signoff?.appraisee_agrees !== null) completed.push(4);
    return completed;
  }

  // ── Action Button ─────────────────────────────────────────────────────────
  const isMutating =
    selfSubmit.isPending ||
    supervisorSubmit.isPending ||
    appraiseeSignoff.isPending ||
    hrCalibrate.isPending ||
    finalize.isPending;

  function renderActionButton() {
    if (!status || status === "FINALIZED") return null;
    if (canEditPhase1)
      return (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSaveDraft}
            disabled={isMutating}
          >
            <Save className="mr-1.5 h-4 w-4" />
            Save Draft
          </Button>
          <Button
            size="sm"
            onClick={handleSelfSubmit}
            disabled={isMutating}
            className="rounded-full px-5"
          >
            {selfSubmit.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-1.5 h-4 w-4" />
            )}
            Submit Self Assessment
          </Button>
        </div>
      );
    if (canEditSupervisorRatings)
      return (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleSupervisorSubmit(true)} disabled={isMutating}>
            <Save className="mr-1.5 h-4 w-4" />
            Save Draft
          </Button>
          <Button size="sm" onClick={() => handleSupervisorSubmit(false)} disabled={isMutating} className="rounded-full px-5">
            {supervisorSubmit.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
            Submit Manager Assessment
          </Button>
        </div>
      );
    if (canEditSignoff)
      return (
        <Button size="sm" onClick={handleSignoff} disabled={isMutating} className="rounded-full px-5">
          {appraiseeSignoff.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
          Complete Sign-Off
        </Button>
      );
    if (canEditHr)
      return (
        <Button size="sm" onClick={handleHrCalibrate} disabled={isMutating} className="rounded-full px-5">
          {hrCalibrate.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
          Submit HR Calibration
        </Button>
      );
    if (canEditManagement)
      return (
        <Button size="sm" onClick={handleFinalize} disabled={isMutating} className="rounded-full px-5">
          {finalize.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
          Finalize Appraisal
        </Button>
      );
    return null;
  }

  // ── Loading / Error states ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !appraisal) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
        <p className="text-sm font-medium text-destructive">
          {error?.message ?? "Appraisal not found."}
        </p>
      </div>
    );
  }

  const sections = appraisal.template.sections;

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
                onClick={() =>
                  reopen.mutateAsync({
                    target_stage: "REOPENED_FOR_EMPLOYEE",
                    reason: "HR override reopen",
                  })
                }
                disabled={reopen.isPending}
              >
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Reopen
              </Button>
            )}
            {renderActionButton()}
          </div>
        }
      />

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3">
        <AppraisalStatusBadge status={appraisal.status} />
        {appraisal.supervisor && (
          <span className="text-xs text-muted-foreground">
            Manager:{" "}
            <span className="font-medium text-foreground">
              {appraisal.supervisor.first_name} {appraisal.supervisor.last_name}
            </span>
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          Deadline:{" "}
          <span className="font-medium text-foreground">
            {formatAppraisalDate(appraisal.cycle.submission_deadline)}
          </span>
        </span>
      </div>

      {/* Phase stepper */}
      <AppraisalStepper
        activePhase={activePhase}
        onPhaseChange={setActivePhase}
        completedPhases={getCompletedPhases()}
      />

      {/* Phase content */}
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-8">
        {activePhase === 1 && (
          <Phase1SelfAssessment
            data={phase1}
            onChange={setPhase1}
            readOnly={!canEditPhase1}
          />
        )}

        {activePhase === 2 && (
          <Phase2RatingsTable
            sections={sections}
            ratingsMap={ratingsMap}
            onRatingsChange={setRatingsMap}
            canEditSelf={canEditSelfRatings}
            canEditSupervisor={canEditSupervisorRatings}
            savedAnswers={appraisal.answers}
          />
        )}

        {activePhase === 3 && (
          <Phase3SupervisorEval
            data={phase3}
            onChange={setPhase3}
            readOnly={!canEditPhase3}
          />
        )}

        {activePhase === 4 && (
          <Phase4Signoff
            supervisorData={phase4Supervisor}
            onSupervisorChange={canEditPhase4Supervisor ? setPhase4Supervisor : undefined}
            signoffData={phase4Signoff}
            onSignoffChange={canEditSignoff ? setPhase4Signoff : undefined}
            hrData={phase4Hr}
            onHrChange={canEditHr ? setPhase4Hr : undefined}
            managementData={phase4Management}
            onManagementChange={canEditManagement ? setPhase4Management : undefined}
            canEditSupervisor={canEditPhase4Supervisor}
            canEditSignoff={canEditSignoff}
            canEditHr={canEditHr}
            canEditManagement={canEditManagement}
            supervisorScore={appraisal.supervisor_score_total}
            performanceCategory={appraisal.performance_category}
          />
        )}
      </div>

      {/* Phase navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActivePhase((p) => Math.max(1, p - 1))}
          disabled={activePhase === 1}
        >
          ← Previous
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActivePhase((p) => Math.min(4, p + 1))}
          disabled={activePhase === 4}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
