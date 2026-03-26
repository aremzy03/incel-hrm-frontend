import type { PublicHoliday } from "@/lib/types/public-holidays";

export function isWeekend(date: Date): boolean {
  const d = date.getDay();
  return d === 0 || d === 6;
}

export function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function buildHolidayLookup(holidays: PublicHoliday[]) {
  const dateSet = new Set<string>();
  const nameByDate = new Map<string, string>();
  for (const h of holidays) {
    dateSet.add(h.date);
    if (!nameByDate.has(h.date)) nameByDate.set(h.date, h.name);
  }
  return { dateSet, nameByDate };
}

export function countWorkingDaysPreview(
  start: Date,
  end: Date,
  holidaySet: Set<string>
): number {
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;

  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  let count = 0;
  while (cursor <= last) {
    if (!isWeekend(cursor) && !holidaySet.has(toYmd(cursor))) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

