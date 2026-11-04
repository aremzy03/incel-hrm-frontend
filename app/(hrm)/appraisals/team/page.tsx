"use client";

import { Loader2, Users2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { StatCard } from "@/components/hrm/ui/StatCard";
import { AppraisalListTable } from "@/components/hrm/appraisals/AppraisalListTable";
import { useTeamAppraisals } from "@/lib/api/appraisals";

export default function TeamAppraisalsPage() {
  const { data: rawAppraisals, isLoading, error } = useTeamAppraisals();
  const appraisals = Array.isArray(rawAppraisals)
    ? rawAppraisals
    : (rawAppraisals as unknown as { results?: typeof rawAppraisals })?.results ?? [];

  const pendingReview = appraisals.filter(
    (a) => a.status === "SELF_SUBMITTED" || a.status === "REOPENED_FOR_SUPERVISOR"
  ).length;
  const inProgress = appraisals.filter(
    (a) => !["FINALIZED", "NOT_STARTED", "DRAFT"].includes(a.status)
  ).length;
  const finalized = appraisals.filter((a) => a.status === "FINALIZED").length;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="Team Appraisals"
        subtitle="Review and complete assessments for your direct reports."
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-6 w-6 text-destructive" />
          <p className="text-sm text-destructive">{error.message}</p>
        </div>
      ) : (
        <section className="space-y-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 custom-shadow sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Awaiting your review"
              value={String(pendingReview)}
              icon={<Users2 className="h-4 w-4" />}
              trend="need action"
            />
            <StatCard
              label="In progress"
              value={String(inProgress)}
              icon={<Users2 className="h-4 w-4" />}
              trend="across all stages"
            />
            <StatCard
              label="Finalized"
              value={String(finalized)}
              icon={<Users2 className="h-4 w-4" />}
              trend="completed"
            />
          </div>

          <AppraisalListTable
            appraisals={appraisals}
            mode="team"
            emptyMessage="No team appraisals found. Appraisals will appear here when a cycle is launched and your direct reports submit their self-assessments."
            header={
              <div className="flex items-center justify-between px-6 py-4">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Direct Reports
                </h2>
              </div>
            }
          />
        </section>
      )}
    </div>
  );
}
