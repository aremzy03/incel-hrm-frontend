"use client";

import { Loader2, ClipboardList, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { StatCard } from "@/components/hrm/ui/StatCard";
import { AppraisalListTable } from "@/components/hrm/appraisals/AppraisalListTable";
import { useMyAppraisals } from "@/lib/api/appraisals";

export default function MyAppraisalsPage() {
  const { data: rawAppraisals, isLoading, error } = useMyAppraisals();
  const appraisals = Array.isArray(rawAppraisals)
    ? rawAppraisals
    : (rawAppraisals as unknown as { results?: typeof rawAppraisals })?.results ?? [];

  const activeCount = appraisals.filter(
    (a) => !["FINALIZED", "NOT_STARTED"].includes(a.status)
  ).length;
  const pendingSignoff = appraisals.filter(
    (a) => a.status === "PENDING_APPRAISEE_ACCEPTANCE"
  ).length;
  const finalized = appraisals.filter((a) => a.status === "FINALIZED").length;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="My Appraisals"
        subtitle="Track your active and historical performance appraisals."
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
              label="Active appraisals"
              value={String(activeCount)}
              icon={<ClipboardList className="h-4 w-4" />}
              trend="in progress"
            />
            <StatCard
              label="Pending your sign-off"
              value={String(pendingSignoff)}
              icon={<ClipboardList className="h-4 w-4" />}
              trend="awaiting action"
            />
            <StatCard
              label="Finalized"
              value={String(finalized)}
              icon={<ClipboardList className="h-4 w-4" />}
              trend="completed"
            />
          </div>

          <AppraisalListTable
            appraisals={appraisals}
            mode="employee"
            emptyMessage="No appraisals found. Your line manager or HR will assign you one when a cycle is launched."
            header={
              <div className="flex items-center justify-between px-6 py-4">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  All Appraisals
                </h2>
              </div>
            }
          />
        </section>
      )}
    </div>
  );
}
