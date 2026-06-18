"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { useDepartments } from "@/lib/api/departments";
import { useUnits } from "@/lib/api/units";
import { useLoanSettings, usePatchLoanSettings } from "@/lib/api/loans";
import { useAuth } from "@/contexts/AuthContext";
import { hasRole } from "@/lib/rbac";
import { getLoanApiErrorMessage } from "@/lib/loans/errors";
import { useLoanToast } from "@/components/hrm/loans/LoanToast";

type ObserverScope = "none" | "department" | "unit";

const selectClass =
  "w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export default function LoanSettingsPage() {
  const { user } = useAuth();
  const { showToast, Toast } = useLoanToast();
  const allowed = hasRole(user, "HR");

  const { data: settings, isLoading } = useLoanSettings();
  const patchMutation = usePatchLoanSettings();
  const { data: departmentsData } = useDepartments();
  const departments = departmentsData?.results ?? [];

  const [requireLmApproval, setRequireLmApproval] = useState(true);
  const [observerScope, setObserverScope] = useState<ObserverScope>("none");
  const [observerDepartmentId, setObserverDepartmentId] = useState("");
  const [observerUnitId, setObserverUnitId] = useState("");
  const [unitDepartmentId, setUnitDepartmentId] = useState("");

  const { data: units = [] } = useUnits(unitDepartmentId);

  useEffect(() => {
    if (!settings) return;
    setRequireLmApproval(settings.require_line_manager_approval);
    if (settings.observer_department) {
      setObserverScope("department");
      setObserverDepartmentId(settings.observer_department.id);
      setObserverUnitId("");
      setUnitDepartmentId("");
    } else if (settings.observer_unit) {
      setObserverScope("unit");
      setObserverUnitId(settings.observer_unit.id);
      setObserverDepartmentId("");
    } else {
      setObserverScope("none");
      setObserverDepartmentId("");
      setObserverUnitId("");
      setUnitDepartmentId("");
    }
  }, [settings]);

  function handleObserverScopeChange(scope: ObserverScope) {
    setObserverScope(scope);
    if (scope === "none") {
      setObserverDepartmentId("");
      setObserverUnitId("");
      setUnitDepartmentId("");
    } else if (scope === "department") {
      setObserverUnitId("");
      setUnitDepartmentId("");
    } else {
      setObserverDepartmentId("");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!allowed) return;

    if (observerScope === "unit" && !observerUnitId) {
      showToast("Select a unit for observer access, or choose None.");
      return;
    }
    if (observerScope === "department" && !observerDepartmentId) {
      showToast("Select a department for observer access, or choose None.");
      return;
    }

    const payload = {
      require_line_manager_approval: requireLmApproval,
      observer_department_id:
        observerScope === "department" ? observerDepartmentId : null,
      observer_unit_id: observerScope === "unit" ? observerUnitId : null,
    };

    try {
      await patchMutation.mutateAsync(payload);
      showToast("Loan settings saved.");
    } catch (err) {
      showToast(getLoanApiErrorMessage(err, "Could not save loan settings."));
    }
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-7xl space-y-4">
        <PageHeader title="Loan settings" subtitle="Configure loan approval workflow" />
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to access loan settings. HR role is required.
        </p>
        <Link href="/loans" className="text-sm text-primary hover:underline">
          Back to Staff Loans
        </Link>
      </div>
    );
  }

  return (
    <>
      {Toast}
      <div className="mx-auto max-w-2xl space-y-8">
        <PageHeader
          title="Loan settings"
          subtitle="Configure line manager approval and observer access for loan applications."
        />

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form
            onSubmit={handleSave}
            className="space-y-8 rounded-xl border border-border/90 bg-card p-6 shadow-sm"
          >
            <div className="space-y-3" data-tour="loans-settings-lm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    id="require-lm-approval-label"
                    className="text-sm font-medium text-foreground"
                  >
                    Require line manager approval
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    New submissions require department line manager approval before HR.
                    Does not affect loans already in progress.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  id="require-lm-approval"
                  aria-checked={requireLmApproval}
                  aria-labelledby="require-lm-approval-label"
                  onClick={() => setRequireLmApproval((v) => !v)}
                  className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    requireLmApproval ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-sm ring-0 transition-transform ${
                      requireLmApproval ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="space-y-4 border-t border-border pt-6" data-tour="loans-settings-observer">
              <div>
                <p className="text-sm font-medium text-foreground">Observer scope</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Members of this department or unit can view all loan applications and
                  reports. They cannot approve or disburse.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                {(["none", "department", "unit"] as const).map((scope) => (
                  <label
                    key={scope}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="observer-scope"
                      checked={observerScope === scope}
                      onChange={() => handleObserverScopeChange(scope)}
                    />
                    {scope === "none"
                      ? "None"
                      : scope === "department"
                        ? "Department"
                        : "Unit"}
                  </label>
                ))}
              </div>

              {observerScope === "department" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Department</label>
                  <select
                    value={observerDepartmentId}
                    onChange={(e) => setObserverDepartmentId(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Select department…</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {observerScope === "unit" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Department (for unit list)
                    </label>
                    <select
                      value={unitDepartmentId}
                      onChange={(e) => {
                        setUnitDepartmentId(e.target.value);
                        setObserverUnitId("");
                      }}
                      className={selectClass}
                    >
                      <option value="">Select department…</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {unitDepartmentId && (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Unit</label>
                      <select
                        value={observerUnitId}
                        onChange={(e) => setObserverUnitId(e.target.value)}
                        className={selectClass}
                      >
                        <option value="">Select unit…</option>
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-border pt-6">
              <button
                type="submit"
                disabled={patchMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {patchMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Save settings
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
