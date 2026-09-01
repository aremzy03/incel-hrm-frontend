export function formatLeaveDays(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return "0";
  const rounded = Math.round(n * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return String(rounded).replace(/\.?0+$/, "");
}

export function availableBalanceDays(b: {
  allocated_days: number;
  used_days: number;
  pending_days?: number;
  available_days?: number;
}): number {
  if (typeof b.available_days === "number") return Number(b.available_days);
  return Number(b.allocated_days) - Number(b.used_days) - Number(b.pending_days ?? 0);
}

export function formatLeaveDuration(start: string, end: string): string {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const monthYear = startDate.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });

  if (start === end) {
    return startDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const sameMonth =
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear();

  if (sameMonth) {
    return `${startDate.getDate()}–${endDate.getDate()} ${monthYear}`;
  }

  const startLabel = startDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  const endLabel = endDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${startLabel} – ${endLabel}`;
}
