"use client";

import { useState } from "react";
import { Loader2, Plus, Play, AlertCircle, Calendar } from "lucide-react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { useAppraisalCycles, useAppraisalTypes, useCreateCycle, useActivateCycle } from "@/lib/api/appraisals";
import { formatAppraisalDate } from "@/lib/appraisals/utils";
import type { AppraisalCycleStatus, CreateCyclePayload } from "@/lib/types/appraisal";
import { toast } from "@/lib/toast";

// ─── Status badge ──────────────────────────────────────────────────────────

const CYCLE_STATUS_STYLES: Record<AppraisalCycleStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  CLOSED: "bg-amber-100 text-amber-800",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

// ─── Create Cycle Form ──────────────────────────────────────────────────────

interface CreateCycleFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

function CreateCycleForm({ onCancel, onSuccess }: CreateCycleFormProps) {
  const { data: rawTypes } = useAppraisalTypes();
  const types = Array.isArray(rawTypes)
    ? rawTypes
    : (rawTypes as unknown as { results?: typeof rawTypes })?.results ?? [];
  const createCycle = useCreateCycle();

  const [form, setForm] = useState<CreateCyclePayload>({
    name: "",
    appraisal_type: "",
    start_date: "",
    end_date: "",
    submission_deadline: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createCycle.mutateAsync(form);
      toast.success("Appraisal cycle created successfully.");
      onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create cycle.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4"
    >
      <h3 className="text-sm font-bold text-foreground">New Appraisal Cycle</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs font-semibold text-foreground">Cycle Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. 2026 End of Year Appraisal Cycle"
            className="w-full rounded-lg border border-outline-variant bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs font-semibold text-foreground">Appraisal Type *</label>
          <select
            required
            value={form.appraisal_type}
            onChange={(e) => setForm({ ...form, appraisal_type: e.target.value })}
            className="w-full rounded-lg border border-outline-variant bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Select type…</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {(
          [
            { key: "start_date", label: "Start Date" },
            { key: "end_date", label: "End Date" },
            { key: "submission_deadline", label: "Submission Deadline" },
          ] as const
        ).map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <label className="text-xs font-semibold text-foreground">{label} *</label>
            <input
              required
              type="date"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full rounded-lg border border-outline-variant bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={createCycle.isPending} className="rounded-full px-5">
          {createCycle.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          Create Cycle
        </Button>
      </div>
    </form>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function AppraisalCyclesPage() {
  const { data: rawCycles, isLoading, error } = useAppraisalCycles();
  const cycles = Array.isArray(rawCycles)
    ? rawCycles
    : (rawCycles as unknown as { results?: typeof rawCycles })?.results ?? [];
  const activateCycle = useActivateCycle();
  const [showForm, setShowForm] = useState(false);

  async function handleActivate(cycleId: string) {
    try {
      const result = await activateCycle.mutateAsync(cycleId);
      toast.success(result.detail ?? `${result.spawned_count} appraisals created.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to activate cycle.");
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Appraisal Cycle Manager"
        subtitle="Create and activate annual, bi-annual, or 90-day appraisal cycles."
        action={
          !showForm && (
            <Button
              size="sm"
              className="rounded-full px-5"
              onClick={() => setShowForm(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              New Cycle
            </Button>
          )
        }
      />

      {showForm && (
        <CreateCycleForm
          onCancel={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-6 w-6 text-destructive" />
          <p className="text-sm text-destructive">{error.message}</p>
        </div>
      ) : cycles.length === 0 ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-12 text-center">
          <Calendar className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No appraisal cycles yet. Create one to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {cycles.map((cycle) => (
            <div
              key={cycle.id}
              className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${CYCLE_STATUS_STYLES[cycle.status]}`}
                  >
                    {cycle.status}
                  </span>
                  <h3 className="text-sm font-bold text-foreground">{cycle.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatAppraisalDate(cycle.start_date)} →{" "}
                  {formatAppraisalDate(cycle.end_date)} · Deadline:{" "}
                  {formatAppraisalDate(cycle.submission_deadline)}
                </p>
              </div>

              {cycle.status === "DRAFT" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleActivate(cycle.id)}
                  disabled={activateCycle.isPending}
                  className="rounded-full"
                >
                  {activateCycle.isPending ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-1.5 h-4 w-4" />
                  )}
                  Activate Cycle
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
