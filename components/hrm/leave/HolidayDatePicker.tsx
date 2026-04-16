"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { isWeekend, toYmd } from "@/lib/public-holidays/utils";

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
}

function buildCalendarDays(year: number, month: number): CalendarDay[] {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Mon=0

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

function parseYmd(v: string): Date | null {
  if (!v) return null;
  const d = new Date(v + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function formatDisplay(v: string): string {
  const d = parseYmd(v);
  if (!d) return "Select date";
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function HolidayDatePicker({
  value,
  onChange,
  holidayNameByDate,
  min,
  disableWeekendsAndHolidays,
  label,
}: {
  value: string;
  onChange: (next: string) => void;
  holidayNameByDate: Map<string, string>;
  min?: string;
  disableWeekendsAndHolidays?: boolean;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => parseYmd(value), [value]);
  const minDate = useMemo(() => (min ? parseYmd(min) : null), [min]);

  const now = selected ?? new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const days = useMemo(() => buildCalendarDays(year, month), [year, month]);

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function isBeforeMin(d: Date): boolean {
    if (!minDate) return false;
    const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const b = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()).getTime();
    return a < b;
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full rounded-lg border border-border bg-input px-3 py-2 text-left text-sm text-foreground",
          "transition focus:outline-none focus:ring-2 focus:ring-ring"
        )}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {formatDisplay(value)}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${label} picker`}
          className="absolute z-50 mt-2 w-[320px] rounded-xl border border-border bg-card p-3 shadow-xl"
        >
          <div
            ref={panelRef}
            tabIndex={-1}
            className="focus:outline-none"
          >
            <div className="flex items-center justify-between pb-2">
              <button
                type="button"
                onClick={prevMonth}
                className="rounded-md p-2 text-muted-foreground transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-sm font-semibold text-foreground">
                {MONTHS[month]} {year}
              </div>
              <button
                type="button"
                onClick={nextMonth}
                className="rounded-md p-2 text-muted-foreground transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 pb-1">
              {DOW.map((d) => (
                <div
                  key={d}
                  className="py-1 text-center text-[10px] font-semibold uppercase text-muted-foreground"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((cell, idx) => {
                const ymd = toYmd(cell.date);
                const holidayName = holidayNameByDate.get(ymd);
                const weekend = isWeekend(cell.date);
                const isSelected = value ? ymd === value : false;
                const disabled =
                  isBeforeMin(cell.date) ||
                  (disableWeekendsAndHolidays && (weekend || !!holidayName));
                const disabledReason = isBeforeMin(cell.date)
                  ? "Before minimum date"
                  : disableWeekendsAndHolidays && weekend
                    ? "Weekend"
                    : disableWeekendsAndHolidays && holidayName
                      ? `Public holiday: ${holidayName}`
                      : null;

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onChange(ymd);
                      setOpen(false);
                      buttonRef.current?.focus();
                    }}
                    className={cn(
                      "relative flex h-9 w-9 items-center justify-center rounded-md text-sm transition",
                      "focus:outline-none focus:ring-2 focus:ring-ring",
                      !cell.isCurrentMonth && "text-muted-foreground opacity-70",
                      weekend && "bg-amber-50/70 dark:bg-amber-950/20",
                      holidayName && "border border-red-500/30 bg-red-500/5",
                      isSelected && "bg-primary text-primary-foreground",
                      disabled && "cursor-not-allowed opacity-40 hover:bg-transparent"
                    )}
                    title={disabledReason ?? (holidayName ? `Public holiday: ${holidayName}` : undefined)}
                    aria-label={disabledReason ? `${ymd} (${disabledReason})` : holidayName ? `${ymd} ${holidayName}` : ymd}
                  >
                    {holidayName && (
                      <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500" />
                    )}
                    {cell.date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
                className="rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

