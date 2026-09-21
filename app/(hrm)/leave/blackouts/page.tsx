"use client";

import { useState } from "react";
import { Breadcrumb } from "@/components/hrm/ui/Breadcrumb";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { HrOnly } from "@/components/hrm/leave/HrOnly";
import { stitchCardClass, stitchFieldClass, stitchSelectClass } from "@/lib/design/field-styles";
import { useBlackoutPeriods, useCreateBlackout, useDeleteBlackout, useUpdateBlackout } from "@/lib/api/leave-settings";
import { useLeaveTypes } from "@/lib/api/leave-types";
import { useDepartments } from "@/lib/api/departments";

export default function BlackoutsPage() {
  const { data: rows = [] } = useBlackoutPeriods();
  const { data: types = [] } = useLeaveTypes();
  const { data: depts } = useDepartments();
  const create = useCreateBlackout();
  const update = useUpdateBlackout();
  const del = useDeleteBlackout();
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [enforcement, setEnforcement] = useState<"BLOCK" | "WARN">("BLOCK");
  const [leaveTypes, setLeaveTypes] = useState<string[]>([]);
  const [department, setDepartment] = useState("");

  return (
    <HrOnly title="Blackout periods">
      <div className="mx-auto max-w-5xl space-y-6">
        <Breadcrumb items={[{ label: "Leave Management", href: "/leave" }, { label: "Blackout periods" }]} />
        <PageHeader title="Blackout periods" subtitle="Empty leave types = all types. Empty department = organisation-wide. WARN does not block submit." />
        <form className={`${stitchCardClass} grid items-start gap-3 p-6 md:grid-cols-2`} onSubmit={(e) => {
          e.preventDefault();
          create.mutate({
            name, start_date: start, end_date: end, enforcement,
            leave_types: leaveTypes, department: department || null, is_active: true,
          });
        }}>
          <input className={stitchFieldClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <select className={stitchSelectClass} value={enforcement} onChange={(e) => setEnforcement(e.target.value as "BLOCK" | "WARN")}>
            <option>BLOCK</option><option>WARN</option>
          </select>
          <input type="date" className={stitchFieldClass} value={start} onChange={(e) => setStart(e.target.value)} required />
          <input type="date" className={stitchFieldClass} value={end} onChange={(e) => setEnd(e.target.value)} required />
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Leave types (empty = all)</label>
            <div className="max-h-28 overflow-y-auto rounded-xl bg-surface-container-low px-3 py-2">
              {types.map((t) => (
                <label key={t.id} className="flex items-center gap-2 py-0.5 text-sm text-on-surface">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={leaveTypes.includes(t.id)}
                    onChange={(e) => {
                      setLeaveTypes((prev) =>
                        e.target.checked ? [...prev, t.id] : prev.filter((id) => id !== t.id)
                      );
                    }}
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Department</label>
            <select className={stitchSelectClass} value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">All departments</option>
              {(depts?.results ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Create</button>
        </form>
        <div className={stitchCardClass}>
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/40"><th className="px-4 py-3 text-left">Name</th><th>Dates</th><th>Enforcement</th><th>Active</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3">{r.start_date} – {r.end_date}</td>
                  <td className="px-4 py-3">{r.enforcement}</td>
                  <td className="px-4 py-3">
                    <button className="text-xs" onClick={() => update.mutate({ id: r.id, payload: { is_active: !r.is_active } })}>{r.is_active ? "Active" : "Off"}</button>
                  </td>
                  <td className="px-4 py-3"><button className="text-xs text-destructive" onClick={() => del.mutate(r.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </HrOnly>
  );
}
