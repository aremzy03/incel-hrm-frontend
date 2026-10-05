"use client";

import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { FieldLabel } from "@/components/hrm/forms/FieldLabel";
import { UserSearchField } from "@/components/hrm/leave/UserSearchField";
import { Button } from "@/components/ui/button";
import {
  SettingsConfirmDialog,
  SettingsLiveRegion,
  SettingsQueryPanel,
} from "@/components/hrm/leave/SettingsDialog";
import { stitchCardClass, stitchFieldClass, stitchSelectClass } from "@/lib/design/field-styles";
import {
  useWorkingCalendars,
  useCreateWorkingCalendar,
  useUpdateWorkingCalendar,
  useDeleteWorkingCalendar,
  useHolidayCalendars,
  useCreateHolidayCalendar,
  useAddHoliday,
  useDeleteHoliday,
  useCalendarAssignments,
  useCreateCalendarAssignment,
  useDeleteCalendarAssignment,
} from "@/lib/api/leave-settings";
import { useDepartments } from "@/lib/api/departments";
import {
  formatIsoDate,
  formatPersonName,
  formatWeekdays,
  mutationErrorMessage,
  WEEKDAY_LABELS,
} from "@/lib/leave/settings-labels";
import type {
  HolidayCalendar,
  HolidayCalendarItem,
  LeaveCalendarAssignment,
  WorkingCalendar,
} from "@/lib/types/leave";
import { cn } from "@/lib/utils";

type ConfirmState =
  | { kind: "working"; row: WorkingCalendar }
  | { kind: "holiday-cal"; row: HolidayCalendar }
  | { kind: "holiday"; calendar: HolidayCalendar; item: HolidayCalendarItem }
  | { kind: "assign"; row: LeaveCalendarAssignment };

export default function CalendarsPage() {
  const formId = useId();
  const workingQ = useWorkingCalendars();
  const holidayQ = useHolidayCalendars();
  const assignQ = useCalendarAssignments();
  const { data: depts } = useDepartments();
  const createW = useCreateWorkingCalendar();
  const updateW = useUpdateWorkingCalendar();
  const delW = useDeleteWorkingCalendar();
  const createH = useCreateHolidayCalendar();
  const addH = useAddHoliday();
  const delH = useDeleteHoliday();
  const createA = useCreateCalendarAssignment();
  const delA = useDeleteCalendarAssignment();

  const working = workingQ.data ?? [];
  const holidays = holidayQ.data ?? [];
  const assigns = assignQ.data ?? [];
  const departments = depts?.results ?? [];

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
  const [error, setError] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const workingById = new Map(working.map((c) => [c.id, c.name]));
  const holidayById = new Map(holidays.map((c) => [c.id, c.name]));
  const deptById = new Map(departments.map((d) => [d.id, d.name]));

  function assignmentLabel(a: LeaveCalendarAssignment): string {
    const who = a.employee
      ? formatPersonName(a.employee_detail)
      : a.department
        ? (deptById.get(a.department) ?? "Department")
        : "Unscoped";
    const work = a.working_calendar ? workingById.get(a.working_calendar) ?? "Working calendar" : "No working calendar";
    const hol = a.holiday_calendar ? holidayById.get(a.holiday_calendar) ?? "Holiday calendar" : "No holiday calendar";
    return `${who} · ${work} · ${hol}`;
  }

  const isPending =
    createW.isPending ||
    updateW.isPending ||
    delW.isPending ||
    createH.isPending ||
    addH.isPending ||
    delH.isPending ||
    createA.isPending ||
    delA.isPending;

  async function createWorking() {
    setError(null);
    if (!wName.trim()) {
      setError("Enter a working calendar name.");
      return;
    }
    if (weekdays.length === 0) {
      setError("Choose at least one working day.");
      return;
    }
    try {
      await createW.mutateAsync({
        name: wName.trim(),
        weekdays,
        timezone: "Africa/Lagos",
        hours_per_day: 8,
        is_active: true,
      });
      setLiveMessage(`Created ${wName.trim()}.`);
      setWName("");
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not create this working calendar."));
    }
  }

  async function toggleWorking(c: WorkingCalendar) {
    setError(null);
    try {
      await updateW.mutateAsync({ id: c.id, payload: { is_active: !c.is_active } });
      setLiveMessage(c.is_active ? `${c.name} is off.` : `${c.name} is on.`);
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not update this calendar."));
    }
  }

  async function createHolidayCal() {
    setError(null);
    if (!hName.trim()) {
      setError("Enter a holiday calendar name.");
      return;
    }
    try {
      await createH.mutateAsync({ name: hName.trim() });
      setLiveMessage(`Created ${hName.trim()}.`);
      setHName("");
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not create this holiday calendar."));
    }
  }

  async function addHoliday() {
    setError(null);
    if (!holidayCal || !hLabel.trim() || !hDate) {
      setError("Choose a calendar, name, and date for the holiday.");
      return;
    }
    try {
      await addH.mutateAsync({
        calendarId: holidayCal,
        payload: { name: hLabel.trim(), date: hDate },
      });
      setLiveMessage(`Added ${hLabel.trim()}.`);
      setHLabel("");
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not add this holiday."));
    }
  }

  async function assignCalendar() {
    setError(null);
    if (target === "employee" && !employee) {
      setError("Choose the employee.");
      return;
    }
    if (target === "department" && !department) {
      setError("Choose the department.");
      return;
    }
    if (!wc && !hc) {
      setError("Choose a working calendar, a holiday calendar, or both.");
      return;
    }
    try {
      await createA.mutateAsync({
        employee: target === "employee" ? employee : null,
        department: target === "department" ? department : null,
        working_calendar: wc || null,
        holiday_calendar: hc || null,
      });
      setLiveMessage("Assignment saved.");
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not save this assignment."));
    }
  }

  async function runConfirm() {
    if (!confirm) return;
    try {
      if (confirm.kind === "working") {
        await delW.mutateAsync(confirm.row.id);
        setLiveMessage(`Deleted ${confirm.row.name}.`);
      } else if (confirm.kind === "holiday-cal") {
        // Holiday calendars have no dedicated delete API in the current page; treat as unused.
      } else if (confirm.kind === "holiday") {
        await delH.mutateAsync({
          calendarId: confirm.calendar.id,
          holidayId: confirm.item.id,
        });
        setLiveMessage(`Removed ${confirm.item.name}.`);
      } else {
        await delA.mutateAsync(confirm.row.id);
        setLiveMessage("Assignment removed.");
      }
      setConfirm(null);
    } catch (err) {
      setError(mutationErrorMessage(err, "Could not complete that action."));
      setConfirm(null);
    }
  }

  const listLoading = workingQ.isLoading || holidayQ.isLoading || assignQ.isLoading;
  const listError = workingQ.isError || holidayQ.isError || assignQ.isError;

  return (
    <div className="space-y-6">
      <PageHeader
        className="mb-0"
        title="Working and holiday calendars"
        subtitle="Assign working and holiday calendars to employees or departments. Organisation-wide public holidays are uploaded under Public holidays."
      />

      {error ? (
        <p
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-body-md text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <SettingsQueryPanel
        isLoading={listLoading}
        isError={listError}
        onRetry={() => {
          void workingQ.refetch();
          void holidayQ.refetch();
          void assignQ.refetch();
        }}
        errorTitle="Could not load calendars."
        errorHint="Check your connection and try again."
      >
        <section className={`${stitchCardClass} space-y-4 p-6`} aria-labelledby="working-cal-heading">
          <h2 id="working-cal-heading" className="text-title-sm font-semibold text-on-surface">
            Working calendars
          </h2>
          <div>
            <FieldLabel htmlFor={`${formId}-wname`}>Name</FieldLabel>
            <input
              id={`${formId}-wname`}
              className={stitchFieldClass}
              value={wName}
              autoComplete="off"
              onChange={(e) => setWName(e.target.value)}
            />
          </div>
          <fieldset>
            <legend className="mb-1.5 text-label-md text-on-surface-variant">Working days</legend>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_LABELS.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={weekdays.includes(i)}
                  className={cn(
                    "min-h-11 rounded-full px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    weekdays.includes(i)
                      ? "bg-primary-container text-white"
                      : "bg-surface-container-high text-on-surface-variant"
                  )}
                  onClick={() =>
                    setWeekdays((w) => (w.includes(i) ? w.filter((x) => x !== i) : [...w, i]))
                  }
                >
                  {d}
                </button>
              ))}
            </div>
          </fieldset>
          <Button
            type="button"
            size="lg"
            className="min-h-11 rounded-xl px-6"
            disabled={createW.isPending}
            onClick={() => void createWorking()}
          >
            {createW.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Create working calendar
          </Button>
          {working.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">No working calendars yet.</p>
          ) : (
            <ul className="divide-y divide-outline-variant">
              {working.map((c) => (
                <li key={c.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-on-surface">
                      {c.name}
                      {c.is_org_default ? " · Organisation default" : ""}
                    </p>
                    <p className="text-body-md text-on-surface-variant">{formatWeekdays(c.weekdays)}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 rounded-xl"
                      disabled={updateW.isPending}
                      onClick={() => void toggleWorking(c)}
                    >
                      {c.is_active ? "Turn off" : "Turn on"}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="min-h-11 rounded-xl"
                      onClick={() => setConfirm({ kind: "working", row: c })}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${stitchCardClass} space-y-4 p-6`} aria-labelledby="holiday-cal-heading">
          <h2 id="holiday-cal-heading" className="text-title-sm font-semibold text-on-surface">
            Holiday calendars
          </h2>
          <div>
            <FieldLabel htmlFor={`${formId}-hname`}>Calendar name</FieldLabel>
            <input
              id={`${formId}-hname`}
              className={stitchFieldClass}
              value={hName}
              autoComplete="off"
              onChange={(e) => setHName(e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-h-11 rounded-xl"
            disabled={createH.isPending}
            onClick={() => void createHolidayCal()}
          >
            Create calendar
          </Button>
          <div>
            <FieldLabel htmlFor={`${formId}-hcal`}>Add a holiday to</FieldLabel>
            <select
              id={`${formId}-hcal`}
              className={stitchSelectClass}
              value={holidayCal}
              onChange={(e) => setHolidayCal(e.target.value)}
            >
              <option value="">Choose calendar</option>
              {holidays.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor={`${formId}-hlabel`}>Holiday name</FieldLabel>
            <input
              id={`${formId}-hlabel`}
              className={stitchFieldClass}
              value={hLabel}
              autoComplete="off"
              onChange={(e) => setHLabel(e.target.value)}
            />
          </div>
          <div>
            <FieldLabel htmlFor={`${formId}-hdate`}>Date</FieldLabel>
            <input
              id={`${formId}-hdate`}
              type="date"
              lang="en-GB"
              className={stitchFieldClass}
              value={hDate}
              onChange={(e) => setHDate(e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-h-11 rounded-xl"
            disabled={addH.isPending}
            onClick={() => void addHoliday()}
          >
            Add holiday
          </Button>
          {holidays.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">No holiday calendars yet.</p>
          ) : (
            holidays.map((c) => (
              <div key={c.id} className="border-t border-outline-variant pt-3">
                <p className="font-medium text-on-surface">{c.name}</p>
                {(c.holidays ?? []).length === 0 ? (
                  <p className="mt-1 text-body-md text-on-surface-variant">No dates on this calendar.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {(c.holidays ?? []).map((h) => (
                      <li
                        key={h.id}
                        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="text-body-md">
                          {h.name} · {formatIsoDate(h.date)}
                          {h.is_recurring ? " · Repeats yearly" : ""}
                        </span>
                        <Button
                          type="button"
                          variant="destructive"
                          className="min-h-11 rounded-xl"
                          onClick={() => setConfirm({ kind: "holiday", calendar: c, item: h })}
                          aria-label={`Remove ${h.name}`}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </section>

        <section className={`${stitchCardClass} space-y-4 p-6`} aria-labelledby="cal-assign-heading">
          <h2 id="cal-assign-heading" className="text-title-sm font-semibold text-on-surface">
            Calendar assignments
          </h2>
          <div>
            <FieldLabel htmlFor={`${formId}-target`}>Assign to</FieldLabel>
            <select
              id={`${formId}-target`}
              className={stitchSelectClass}
              value={target}
              onChange={(e) => setTarget(e.target.value as "employee" | "department")}
            >
              <option value="department">Department</option>
              <option value="employee">Employee</option>
            </select>
          </div>
          {target === "employee" ? (
            <UserSearchField label="Employee" value={employee} onChange={(id) => setEmployee(id)} />
          ) : (
            <div>
              <FieldLabel htmlFor={`${formId}-dept`}>Department</FieldLabel>
              <select
                id={`${formId}-dept`}
                className={stitchSelectClass}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="">Choose department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <FieldLabel htmlFor={`${formId}-wc`} optional>
              Working calendar
            </FieldLabel>
            <select
              id={`${formId}-wc`}
              className={stitchSelectClass}
              value={wc}
              onChange={(e) => setWc(e.target.value)}
            >
              <option value="">None</option>
              {working.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor={`${formId}-hc`} optional>
              Holiday calendar
            </FieldLabel>
            <select
              id={`${formId}-hc`}
              className={stitchSelectClass}
              value={hc}
              onChange={(e) => setHc(e.target.value)}
            >
              <option value="">None</option>
              {holidays.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            size="lg"
            className="min-h-11 rounded-xl px-6"
            disabled={createA.isPending}
            onClick={() => void assignCalendar()}
          >
            Assign
          </Button>
          {assigns.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">No calendar assignments yet.</p>
          ) : (
            <ul className="divide-y divide-outline-variant">
              {assigns.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="min-w-0 text-body-md">{assignmentLabel(a)}</span>
                  <Button
                    type="button"
                    variant="destructive"
                    className="min-h-11 rounded-xl"
                    onClick={() => setConfirm({ kind: "assign", row: a })}
                    aria-label={`Remove assignment ${assignmentLabel(a)}`}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </SettingsQueryPanel>

      <SettingsLiveRegion message={liveMessage} />

      {confirm && confirm.kind !== "holiday-cal" ? (
        <SettingsConfirmDialog
          title={
            confirm.kind === "working"
              ? `Delete ${confirm.row.name}?`
              : confirm.kind === "holiday"
                ? `Remove ${confirm.item.name}?`
                : "Remove this assignment?"
          }
          body={
            confirm.kind === "working"
              ? "Staff on this calendar will fall back to the organisation default if one exists."
              : confirm.kind === "holiday"
                ? `${confirm.item.name} on ${formatIsoDate(confirm.item.date)} will no longer count as a holiday.`
                : "The employee or department will use the next matching calendar."
          }
          confirmLabel={confirm.kind === "assign" || confirm.kind === "holiday" ? "Remove" : "Delete"}
          destructive
          isPending={isPending}
          onClose={() => {
            if (!isPending) setConfirm(null);
          }}
          onConfirm={() => void runConfirm()}
        />
      ) : null}
    </div>
  );
}
