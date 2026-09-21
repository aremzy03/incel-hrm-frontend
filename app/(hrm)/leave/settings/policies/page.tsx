"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { StatusBadge } from "@/components/hrm/ui/StatusBadge";
import { stitchCardClass, stitchSelectClass } from "@/lib/design/field-styles";
import { useLeavePolicies } from "@/lib/api/leave-policies";
import { useLeaveTypes } from "@/lib/api/leave-types";
import { cn } from "@/lib/utils";

export default function LeavePoliciesPage() {
  const { data: policies = [], isLoading } = useLeavePolicies();
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

  return (
    <div className="space-y-6">
        <PageHeader
          title="Leave policies"
          subtitle="Clone a published policy to change it. Do not patch ACTIVE policies."
          action={
            <Link href="/leave/settings/policies/new" className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              <Plus className="h-4 w-4" /> New draft
            </Link>
          }
        />
        <div className="flex flex-wrap gap-3">
          <select className={cn(stitchSelectClass, "max-w-xs")} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All types</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select className={cn(stitchSelectClass, "max-w-xs")} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
        <div className={cn(stitchCardClass, "overflow-x-auto")}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Version</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Entitlement</th>
                <th className="px-4 py-3 text-left">Effective</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Loading…</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3">
                    <Link href={`/leave/settings/policies/${p.id}`} className="font-medium text-primary hover:underline">{p.name}</Link>
                  </td>
                  <td className="px-4 py-3">{p.leave_type_detail?.name ?? p.leave_type}</td>
                  <td className="px-4 py-3">{p.version}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3">{p.annual_entitlement}</td>
                  <td className="px-4 py-3">{p.effective_from ?? "—"} → {p.effective_to ?? "open"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </div>
  );
}
