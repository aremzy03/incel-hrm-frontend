"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { DataTable } from "@/components/hrm/ui/DataTable";
import { StatusBadge } from "@/components/hrm/ui/StatusBadge";
import { FieldLabel } from "@/components/hrm/forms/FieldLabel";
import { Button } from "@/components/ui/button";
import { SettingsLiveRegion, SettingsQueryPanel } from "@/components/hrm/leave/SettingsDialog";
import { stitchCardClass, stitchSelectClass } from "@/lib/design/field-styles";
import { useLeavePolicies } from "@/lib/api/leave-policies";
import { useLeaveTypes } from "@/lib/api/leave-types";
import { formatLeaveDays } from "@/lib/leave/format";
import { formatIsoDate, policyStatusLabel } from "@/lib/leave/settings-labels";
import { cn } from "@/lib/utils";

const TABLE_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "type", label: "Type" },
  { key: "version", label: "Version" },
  { key: "status", label: "Status" },
  { key: "entitlement", label: "Entitlement" },
  { key: "effective", label: "Effective" },
];

export default function LeavePoliciesPage() {
  const formId = useId();
  const { data: policies = [], isLoading, isError, refetch } = useLeavePolicies();
  const { data: types = [] } = useLeaveTypes();
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(
    () =>
      policies.filter((p) => {
        if (typeFilter && p.leave_type !== typeFilter) return false;
        if (statusFilter && p.status !== statusFilter) return false;
        return true;
      }),
    [policies, typeFilter, statusFilter]
  );

  const emptyMessage =
    policies.length === 0
      ? "No leave policies yet. Create a draft, then publish it when the rules are ready."
      : "No policies match these filters.";

  const table = (
    <DataTable
      columns={TABLE_COLUMNS}
      emptyMessage={emptyMessage}
      className={filtered.length > 0 ? "rounded-none border-0 [box-shadow:none]" : undefined}
      getRowHref={(i) => `/leave/settings/policies/${filtered[i]?.id}`}
      getRowLabel={(i) => filtered[i]?.name}
      rows={filtered.map((p) => ({
        name: <span className="font-medium text-on-surface">{p.name}</span>,
        type: p.leave_type_detail?.name ?? "Unknown type",
        version: `v${p.version}`,
        status: <StatusBadge status={policyStatusLabel(p.status)} />,
        entitlement: `${formatLeaveDays(p.annual_entitlement)} days`,
        effective: `${formatIsoDate(p.effective_from)} → ${p.effective_to ? formatIsoDate(p.effective_to) : "open"}`,
      }))}
    />
  );

  const announcement = isError
    ? "Could not load leave policies."
    : isLoading
      ? "Loading leave policies."
      : `${filtered.length} ${filtered.length === 1 ? "policy" : "policies"}.`;

  return (
    <div className="space-y-6">
      <PageHeader
        className="mb-0"
        title="Leave policies"
        subtitle="Clone a published policy to change it. Do not edit an active policy in place."
        action={
          <Button
            nativeButton={false}
            render={<Link href="/leave/settings/policies/new" />}
            size="lg"
            className="min-h-11 rounded-xl px-6"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New draft
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor={`${formId}-type`}>Leave type</FieldLabel>
          <select
            id={`${formId}-type`}
            className={stitchSelectClass}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All types</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor={`${formId}-status`}>Status</FieldLabel>
          <select
            id={`${formId}-status`}
            className={stitchSelectClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      <SettingsQueryPanel
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        errorTitle="Could not load leave policies."
        errorHint="Check your connection and try again."
      >
        {filtered.length > 0 ? (
          <div className={cn(stitchCardClass, "overflow-hidden")}>
            <div className="hidden md:block">{table}</div>
            <ul className="divide-y divide-outline-variant md:hidden">
              {filtered.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/leave/settings/policies/${p.id}`}
                    className="flex min-h-11 flex-col gap-2 px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Open ${p.name}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 font-medium text-on-surface">{p.name}</p>
                      <StatusBadge status={policyStatusLabel(p.status)} />
                    </div>
                    <p className="text-body-md text-on-surface-variant">
                      {p.leave_type_detail?.name ?? "Unknown type"} · v{p.version} ·{" "}
                      {formatLeaveDays(p.annual_entitlement)} days
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <div className="hidden md:block">{table}</div>
            <div
              className={cn(
                stitchCardClass,
                "px-6 py-10 text-center text-body-md text-on-surface-variant md:hidden"
              )}
            >
              {emptyMessage}
            </div>
          </>
        )}
      </SettingsQueryPanel>
      <SettingsLiveRegion message={announcement} />
    </div>
  );
}
