"use client";

import { useState } from "react";
import { Breadcrumb } from "@/components/hrm/ui/Breadcrumb";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { HrOnly } from "@/components/hrm/leave/HrOnly";
import { stitchCardClass, stitchSelectClass } from "@/lib/design/field-styles";
import { downloadLeaveReportCsv, useLeaveReportJson } from "@/lib/api/leave-reports";
import { useDepartments } from "@/lib/api/departments";
import { formatLeaveDays } from "@/lib/leave/format";

type Tab = "utilization" | "who-is-out" | "liability";

export default function LeaveReportsPage() {
  const year = new Date().getFullYear();
  const [tab, setTab] = useState<Tab>("utilization");
  const [dept, setDept] = useState("");
  const [scope, setScope] = useState<"today" | "week">("today");
  const { data: depts } = useDepartments();
  const params = {
    year,
    department: dept || undefined,
    scope: tab === "who-is-out" ? scope : undefined,
  };
  const { data, isLoading } = useLeaveReportJson<unknown>(tab, params);

  const rows: Record<string, unknown>[] = Array.isArray(data)
    ? data
    : ((data as { results?: Record<string, unknown>[] } | undefined)?.results ??
      (data as { rows?: Record<string, unknown>[] } | undefined)?.rows ??
      []);

  return (
    <HrOnly title="Leave reports">
      <div className="mx-auto max-w-6xl space-y-6">
        <Breadcrumb items={[{ label: "Leave Management", href: "/leave" }, { label: "Leave reports" }]} />
        <PageHeader title="Leave reports" subtitle="Read-only utilization, who is out, and liability. CSV uses export=csv." />
        <div className="flex flex-wrap gap-2">
          {(["utilization", "who-is-out", "liability"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-full px-3 py-1 text-sm ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <select className={stitchSelectClass} value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="">All departments</option>
            {(depts?.results ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          {tab === "who-is-out" && (
            <select className={stitchSelectClass} value={scope} onChange={(e) => setScope(e.target.value as "today" | "week")}>
              <option value="today">Today</option>
              <option value="week">This week</option>
            </select>
          )}
          <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => downloadLeaveReportCsv(tab, params)}>
            Download CSV
          </button>
        </div>
        <div className={`${stitchCardClass} overflow-x-auto p-4`}>
          {isLoading ? "Loading…" : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {rows[0] ? Object.keys(rows[0]).map((k) => <th key={k} className="px-2 py-2 text-left">{k}</th>) : <th>No rows</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t">
                    {Object.values(r).map((v, j) => (
                      <td key={j} className="px-2 py-2">{typeof v === "number" ? formatLeaveDays(v) : String(v ?? "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </HrOnly>
  );
}
