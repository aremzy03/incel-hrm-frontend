"use client";

import { useState } from "react";
import { Breadcrumb } from "@/components/hrm/ui/Breadcrumb";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { UserSearchField } from "@/components/hrm/leave/UserSearchField";
import { stitchCardClass, stitchFieldClass } from "@/lib/design/field-styles";
import {
  useApproverDelegates, useCreateApproverDelegate, useDeleteApproverDelegate, useUpdateApproverDelegate,
} from "@/lib/api/leave-settings";
import { useAuth } from "@/contexts/AuthContext";
import { canManageLeaveSettings } from "@/lib/leave/access";
import { formatRelieverName } from "@/lib/leave/reliever";

export default function DelegatesPage() {
  const { user } = useAuth();
  const isHr = canManageLeaveSettings(user);
  const { data: rows = [] } = useApproverDelegates();
  const create = useCreateApproverDelegate();
  const update = useUpdateApproverDelegate();
  const del = useDeleteApproverDelegate();
  const [primary, setPrimary] = useState<string | null>(isHr ? null : user?.id ?? null);
  const [delegate, setDelegate] = useState<string | null>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Breadcrumb items={[{ label: "Leave Management", href: "/leave" }, { label: "Out of office" }]} />
      <PageHeader title="Out of office" subtitle="Delegates can approve while the range is active. Role checks still run against the primary." />
      <form className={`${stitchCardClass} space-y-3 p-6`} onSubmit={(e) => {
        e.preventDefault();
        if (!delegate || !start || !end) return;
        create.mutate({
          user: isHr ? primary ?? user?.id : user?.id,
          delegate,
          start_date: start,
          end_date: end,
          is_active: true,
        });
      }}>
        {isHr && <UserSearchField label="Primary approver" value={primary} onChange={(id) => setPrimary(id)} />}
        <UserSearchField label="Delegate" value={delegate} onChange={(id) => setDelegate(id)} />
        <input type="date" className={stitchFieldClass} value={start} onChange={(e) => setStart(e.target.value)} />
        <input type="date" className={stitchFieldClass} value={end} onChange={(e) => setEnd(e.target.value)} />
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Add coverage</button>
      </form>
      <div className={stitchCardClass}>
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/40"><th className="px-4 py-3 text-left">Primary</th><th className="text-left">Delegate</th><th>Dates</th><th>Active</th><th /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3">{r.user_detail ? formatRelieverName(r.user_detail) : r.user}</td>
                <td className="px-4 py-3">{r.delegate_detail ? formatRelieverName(r.delegate_detail) : r.delegate}</td>
                <td className="px-4 py-3">{r.start_date} – {r.end_date}</td>
                <td className="px-4 py-3">
                  <button className="text-xs" onClick={() => update.mutate({ id: r.id, payload: { is_active: !r.is_active } })}>
                    {r.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3"><button className="text-xs text-destructive" onClick={() => del.mutate(r.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
