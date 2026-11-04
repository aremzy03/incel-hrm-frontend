"use client";

import { useState } from "react";
import { Loader2, BarChart3, AlertCircle, Search } from "lucide-react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { StatCard } from "@/components/hrm/ui/StatCard";
import { AppraisalListTable } from "@/components/hrm/appraisals/AppraisalListTable";
import { useAllAppraisals } from "@/lib/api/appraisals";
import type { AppraisalStatusCode, EmployeeAppraisalSummary } from "@/lib/types/appraisal";

const STATUS_FILTER_OPTIONS: { label: string; value: AppraisalStatusCode | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Pending Manager", value: "SELF_SUBMITTED" },
  { label: "Pending Sign-Off", value: "PENDING_APPRAISEE_ACCEPTANCE" },
  { label: "Pending HR", value: "PENDING_HR_CALIBRATION" },
  { label: "Pending Decision", value: "PENDING_MANAGEMENT_DECISION" },
  { label: "Finalized", value: "FINALIZED" },
  { label: "Reopened", value: "REOPENED_FOR_EMPLOYEE" },
];

function filterAppraisals(
  appraisals: EmployeeAppraisalSummary[],
  statusFilter: AppraisalStatusCode | "ALL",
  search: string
): EmployeeAppraisalSummary[] {
  if (!Array.isArray(appraisals)) return [];
  let filtered = appraisals;
  if (statusFilter !== "ALL") {
    filtered = filtered.filter((a) => a.status === statusFilter);
  }
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        `${a.employee?.first_name ?? ""} ${a.employee?.last_name ?? ""}`.toLowerCase().includes(q) ||
        (a.cycle?.name ?? "").toLowerCase().includes(q)
    );
  }
  return filtered;
}

export default function AllAppraisalsPage() {
  const { data: rawAppraisals, isLoading, error } = useAllAppraisals();
  const appraisals = Array.isArray(rawAppraisals)
    ? rawAppraisals
    : (rawAppraisals as unknown as { results?: EmployeeAppraisalSummary[] })?.results ?? [];
  const [statusFilter, setStatusFilter] = useState<AppraisalStatusCode | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const total = appraisals.length;
  const pendingHr = appraisals.filter((a) => a.status === "PENDING_HR_CALIBRATION").length;
  const finalized = appraisals.filter((a) => a.status === "FINALIZED").length;
  const completionRate = total > 0 ? Math.round((finalized / total) * 100) : 0;

  const filtered = filterAppraisals(appraisals, statusFilter, search);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="All Appraisals"
        subtitle="Monitor completion rates, perform calibration, and manage final decisions."
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <StatCard
              label="Total appraisals"
              value={String(total)}
              icon={<BarChart3 className="h-4 w-4" />}
              trend="this cycle"
            />
            <StatCard
              label="Completion rate"
              value={`${completionRate}%`}
              icon={<BarChart3 className="h-4 w-4" />}
              trend="finalized"
            />
            <StatCard
              label="Pending HR calibration"
              value={String(pendingHr)}
              icon={<BarChart3 className="h-4 w-4" />}
              trend="awaiting action"
            />
            <StatCard
              label="Finalized"
              value={String(finalized)}
              icon={<BarChart3 className="h-4 w-4" />}
              trend="completed"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or cycle…"
                className="w-full rounded-lg border border-outline-variant bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    statusFilter === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <AppraisalListTable
            appraisals={filtered}
            mode="all"
            emptyMessage="No appraisals match your current filters."
            header={
              <div className="flex items-center justify-between px-6 py-4">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  {filtered.length} appraisal{filtered.length !== 1 ? "s" : ""}
                </h2>
              </div>
            }
          />
        </section>
      )}
    </div>
  );
}
