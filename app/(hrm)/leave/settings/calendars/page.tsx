"use client";

import { useState } from "react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { UserSearchField } from "@/components/hrm/leave/UserSearchField";
import { stitchCardClass, stitchFieldClass, stitchSelectClass } from "@/lib/design/field-styles";
import {
  useWorkingCalendars, useCreateWorkingCalendar, useUpdateWorkingCalendar, useDeleteWorkingCalendar,
  useHolidayCalendars, useCreateHolidayCalendar, useAddHoliday, useDeleteHoliday,
  useCalendarAssignments, useCreateCalendarAssignment, useDeleteCalendarAssignment,
} from "@/lib/api/leave-settings";
import { useDepartments } from "@/lib/api/departments";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarsPage() {
  const { data: working = [] } = useWorkingCalendars();
  const { data: holidays = [] } = useHolidayCalendars();
  const { data: assigns = [] } = useCalendarAssignments();
  const { data: depts } = useDepartments();
  const createW = useCreateWorkingCalendar();
  const updateW = useUpdateWorkingCalendar();
  const delW = useDeleteWorkingCalendar();
  const createH = useCreateHolidayCalendar();
  const addH = useAddHoliday();
  const delH = useDeleteHoliday();
  const createA = useCreateCalendarAssignment();
  const delA = useDeleteCalendarAssignment();
  const [wName, setWName] = useState("");
  const [weekdays, setWeekdays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [hName, setHName] = useState("");
  const [holidayCal, setHolidayCal] = useState("");
  const [hDate, setHDate] = useState("");
  const [hLabel, setHLabel] = useState("");
  const [target, setTarget] = useState<"employee" | "department">("department");
  const [employee, setEmployee] = useState<string | null>(null);
  const [department, setDepartment] = useState("");
  const [wc, setWc] = useState("");
  const [hc, setHc] = useState("");

  return (
    <div className="space-y-6">
        <PageHeader title="Working & holiday calendars" subtitle="Assign working and holiday calendars to employees or departments. Upload organisation-wide holidays under Public holidays." />

        <section className={`${stitchCardClass} space-y-3 p-6`}>
          <h3 className="font-semibold">Working calendars</h3>
          <input className={stitchFieldClass} placeholder="Name" value={wName} onChange={(e) => setWName(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d, i) => (
              <button key={d} type="button" className={`rounded-full px-3 py-1 text-xs ${weekdays.includes(i) ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                onClick={() => setWeekdays((w) => w.includes(i) ? w.filter((x) => x !== i) : [...w, i])}>{d}</button>
            ))}
          </div>
          <button className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={() => createW.mutate({ name: wName, weekdays, timezone: "Africa/Lagos", hours_per_day: 8, is_active: true })}>Create</button>
          <ul className="text-sm">
            {working.map((c) => (
              <li key={c.id} className="flex justify-between border-t py-2">
                <span>{c.name} {c.is_org_default ? "(org default)" : ""} [{c.weekdays.join(",")}]</span>
                <span className="flex gap-2">
                  <button className="text-xs" onClick={() => updateW.mutate({ id: c.id, payload: { is_active: !c.is_active } })}>{c.is_active ? "Deactivate" : "Activate"}</button>
                  <button className="text-xs text-destructive" onClick={() => delW.mutate(c.id)}>Delete</button>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className={`${stitchCardClass} space-y-3 p-6`}>
          <h3 className="font-semibold">Holiday calendars</h3>
          <input className={stitchFieldClass} placeholder="Calendar name" value={hName} onChange={(e) => setHName(e.target.value)} />
          <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => createH.mutate({ name: hName })}>Create calendar</button>
          <select className={stitchSelectClass} value={holidayCal} onChange={(e) => setHolidayCal(e.target.value)}>
            <option value="">Select calendar to add holiday</option>
            {holidays.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input className={stitchFieldClass} placeholder="Holiday name" value={hLabel} onChange={(e) => setHLabel(e.target.value)} />
          <input type="date" className={stitchFieldClass} value={hDate} onChange={(e) => setHDate(e.target.value)} />
          <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => holidayCal && addH.mutate({ calendarId: holidayCal, payload: { name: hLabel, date: hDate } })}>Add holiday</button>
          {holidays.map((c) => (
            <div key={c.id} className="border-t pt-3">
              <p className="font-medium">{c.name}</p>
              <ul className="text-sm">
                {(c.holidays ?? []).map((h) => (
                  <li key={h.id} className="flex justify-between">
                    {h.name} {h.date} {h.is_recurring ? "(recurring)" : ""}
                    <button className="text-xs text-destructive" onClick={() => delH.mutate({ calendarId: c.id, holidayId: h.id })}>Remove</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className={`${stitchCardClass} space-y-3 p-6`}>
          <h3 className="font-semibold">Calendar assignments</h3>
          <select className={stitchSelectClass} value={target} onChange={(e) => setTarget(e.target.value as "employee" | "department")}>
            <option value="department">Department</option>
            <option value="employee">Employee</option>
          </select>
          {target === "employee" ? (
            <UserSearchField label="Employee" value={employee} onChange={(id) => setEmployee(id)} />
          ) : (
            <select className={stitchSelectClass} value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">Department</option>
              {(depts?.results ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
          <select className={stitchSelectClass} value={wc} onChange={(e) => setWc(e.target.value)}>
            <option value="">Working calendar (optional)</option>
            {working.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className={stitchSelectClass} value={hc} onChange={(e) => setHc(e.target.value)}>
            <option value="">Holiday calendar (optional)</option>
            {holidays.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={() => createA.mutate({
            employee: target === "employee" ? employee : null,
            department: target === "department" ? department : null,
            working_calendar: wc || null,
            holiday_calendar: hc || null,
          })}>Assign</button>
          <ul className="text-sm">
            {assigns.map((a) => (
              <li key={a.id} className="flex justify-between border-t py-2">
                <span>{a.employee ?? a.department} / {a.working_calendar ?? "—"} / {a.holiday_calendar ?? "—"}</span>
                <button className="text-xs text-destructive" onClick={() => delA.mutate(a.id)}>Delete</button>
              </li>
            ))}
          </ul>
        </section>
    </div>
  );
}
