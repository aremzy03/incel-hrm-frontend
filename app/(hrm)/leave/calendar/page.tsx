"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { apiGet } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { listPublicHolidays } from "@/lib/api/public-holidays";
import { buildHolidayLookup, isWeekend, toYmd } from "@/lib/public-holidays/utils";
import type { PublicHoliday } from "@/lib/types/public-holidays";
import type { CalendarEntry, PaginatedResponse } from "@/lib/types/leave";

type ViewMode = "my" | "team";

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
}

interface CalendarEvent {
  id: string;
  employeeId: string;
  employee: string;
  department: string;
  type: string;
  start: Date;
  end: Date;
}

const CHIP_STYLES: Record<string, string> = {
  "Annual Leave": "bg-blue-100 text-blue-700",
  "Sick Leave": "bg-red-100 text-red-700",
  "Casual Leave": "bg-orange-100 text-orange-700",
  "Maternity Leave": "bg-purple-100 text-purple-700",
};

const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CHIP_LIMIT = 2;

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

function buildCalendarDays(year: number, month: number): CalendarDay[] {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;

  const days: CalendarDay[] = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month, -i), isCurrentMonth: false });
  }
  for (let d = 1; d <= lastOfMonth.getDate(); d++) {
    days.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }
  const tail = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= tail; i++) {
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }

  return days;
}

function getEventsForDay(date: Date, events: CalendarEvent[]): CalendarEvent[] {
  const day = stripTime(date);
  return events.filter(
    (ev) => day >= stripTime(ev.start) && day <= stripTime(ev.end)
  );
}

function DetailPanel({
  date,
  events,
  onClose,
}: {
  date: Date;
  events: CalendarEvent[];
  onClose: () => void;
}) {
  const label = date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-foreground/10 backdrop-blur-sm lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="fixed inset-y-0 right-0 z-40 flex w-80 flex-col border-l border-border bg-card shadow-xl"
        aria-label="Day detail"
      >
        <div className="flex items-start justify-between border-b border-border p-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Leave on
            </p>
            <p className="mt-0.5 font-semibold text-foreground">{label}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No leave scheduled for this day.
            </p>
          ) : (
            <ul className="space-y-3">
              {events.map((ev) => (
                <li key={ev.id} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                    {getInitials(ev.employee)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {ev.employee}
                    </p>
                    <p className="text-xs text-muted-foreground">{ev.department}</p>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        CHIP_STYLES[ev.type] ?? "bg-muted text-muted-foreground"
                      )}
                    >
                      {ev.type}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}

export default function LeaveCalendarPage() {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed (JS)
  const [view, setView] = useState<ViewMode>("team");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // API month is 1-indexed
  const apiMonth = month + 1;

  const { data: entriesRaw, isLoading } = useQuery({
    queryKey: ["calendar-entries", year, apiMonth],
    queryFn: () =>
      apiGet<CalendarEntry[] | PaginatedResponse<CalendarEntry>>(
        `calendar?year=${year}&month=${apiMonth}`
      ),
  });

  const { data: holidaysRaw } = useQuery({
    queryKey: ["public-holidays", year],
    queryFn: () => listPublicHolidays(year),
  });

  const holidays: PublicHoliday[] = Array.isArray(holidaysRaw)
    ? holidaysRaw
    : (holidaysRaw as { results?: PublicHoliday[] } | undefined)?.results ?? [];

  const { nameByDate: holidayNameByDate } = useMemo(
    () => buildHolidayLookup(holidays),
    [holidays]
  );

  const entries: CalendarEntry[] = Array.isArray(entriesRaw)
    ? entriesRaw
    : entriesRaw?.results ?? [];

  const calendarEvents: CalendarEvent[] = useMemo(
    () =>
      entries.map((e) => ({
        id: e.id,
        employeeId: e.employee.id,
        employee: `${e.employee.first_name} ${e.employee.last_name}`,
        department: e.employee.department_name,
        type: e.leave_type.name,
        start: new Date(e.start_date + "T00:00:00"),
        end: new Date(e.end_date + "T00:00:00"),
      })),
    [entries]
  );

  const visibleEvents = useMemo(() => {
    if (view === "my" && user) {
      return calendarEvents.filter((e) => e.employeeId === user.id);
    }
    return calendarEvents;
  }, [view, user, calendarEvents]);

  function prevMonth() {
    setSelectedDate(null);
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    setSelectedDate(null);
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const calendarDays = useMemo(
    () => buildCalendarDays(year, month),
    [year, month]
  );

  const selectedEvents = useMemo(
    () => (selectedDate ? getEventsForDay(selectedDate, visibleEvents) : []),
    [selectedDate, visibleEvents]
  );

  const legendTypes = useMemo(() => {
    const types = new Set(calendarEvents.map((e) => e.type));
    return Array.from(types).sort();
  }, [calendarEvents]);

  return (
    <>
      <div className="space-y-6 p-8">
        <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
          <Link href="/leave" className="text-primary hover:underline">
            Leave Management
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium text-foreground">Leave Calendar</span>
        </nav>

        <PageHeader
          title="Leave Calendar"
          subtitle="See approved leave across your department this month."
          action={
            <div
              className="flex rounded-full bg-muted p-1 gap-1"
              role="group"
              aria-label="View mode"
            >
              {(["team", "my"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "rounded-full px-3 py-1 text-sm transition",
                    view === v
                      ? "bg-card font-medium text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-pressed={view === v}
                >
                  {v === "team" ? "Department" : "My Leave"}
                </button>
              ))}
            </div>
          }
        />

        {/* Month navigator */}
        <div className="flex items-center gap-4">
          <button
            onClick={prevMonth}
            className="rounded-lg border border-border bg-card p-2 text-foreground transition hover:bg-muted"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <h2 className="min-w-[160px] text-center text-lg font-semibold text-foreground">
            {MONTH_NAMES[month]} {year}
          </h2>

          <button
            onClick={nextMonth}
            className="rounded-lg border border-border bg-card p-2 text-foreground transition hover:bg-muted"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => {
              const today = new Date();
              setYear(today.getFullYear());
              setMonth(today.getMonth());
              setSelectedDate(null);
            }}
            className="ml-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted"
          >
            Today
          </button>

          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Calendar grid */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="grid grid-cols-7 border-b border-border">
            {DOW_LABELS.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-medium uppercase text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((cell, idx) => {
              const cellEvents = getEventsForDay(cell.date, visibleEvents);
              const overflow = cellEvents.length - CHIP_LIMIT;
              const isSelected =
                selectedDate !== null && isSameDay(cell.date, selectedDate);
              const weekend = isWeekend(cell.date);
              const holidayName = holidayNameByDate.get(toYmd(cell.date));

              return (
                <button
                  key={idx}
                  onClick={() =>
                    setSelectedDate(isSelected ? null : new Date(cell.date))
                  }
                  className={cn(
                    "relative min-h-[80px] border-t border-border p-1.5 text-left transition",
                    cell.isCurrentMonth ? "bg-card hover:bg-muted/30" : "bg-muted/20",
                    weekend && "bg-amber-50/60 dark:bg-amber-950/20",
                    isToday(cell.date) &&
                      cell.isCurrentMonth &&
                      "border-primary bg-primary/10",
                    isSelected && "ring-2 ring-inset ring-primary"
                  )}
                  title={holidayName ? `Public holiday: ${holidayName}` : undefined}
                  aria-label={cell.date.toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                >
                  {holidayName && (
                    <span
                      className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-card"
                      aria-label={`Public holiday: ${holidayName}`}
                    />
                  )}
                  <span
                    className={cn(
                      "mb-1 block text-sm font-medium leading-none",
                      cell.isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground",
                      isToday(cell.date) &&
                        cell.isCurrentMonth &&
                        "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"
                    )}
                  >
                    {cell.date.getDate()}
                  </span>

                  {holidayName && (
                    <span
                      className={cn(
                        "mb-1 block truncate rounded-sm px-1 py-0.5 text-[10px] font-semibold leading-tight",
                        "bg-red-500/10 text-red-700 dark:bg-red-500/15 dark:text-red-200"
                      )}
                      title={holidayName}
                    >
                      {holidayName}
                    </span>
                  )}

                  <div className="space-y-0.5">
                    {cellEvents.slice(0, CHIP_LIMIT).map((ev) => (
                      <div
                        key={ev.id}
                        className={cn(
                          "truncate rounded-sm px-1 py-0.5 text-[10px] font-medium leading-tight",
                          CHIP_STYLES[ev.type] ?? "bg-muted text-muted-foreground"
                        )}
                        title={`${ev.employee} \u2014 ${ev.type}`}
                      >
                        {ev.employee.split(" ")[0]}
                      </div>
                    ))}
                    {overflow > 0 && (
                      <div className="px-1 text-[10px] text-muted-foreground">
                        +{overflow} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        {legendTypes.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {legendTypes.map((type) => (
              <div key={type} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "inline-block h-2.5 w-2.5 rounded-sm",
                    CHIP_STYLES[type] ?? "bg-muted"
                  )}
                />
                <span className="text-xs text-muted-foreground">{type}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedDate && (
        <DetailPanel
          date={selectedDate}
          events={selectedEvents}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </>
  );
}
