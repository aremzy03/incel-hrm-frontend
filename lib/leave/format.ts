import type { LeaveBalance, LeaveStatus } from "@/lib/types/leave";

/** Employee-facing next-step copy. Complete strings so translators can reorder. */
const LEAVE_STATUS_HINT: Partial<Record<LeaveStatus, string>> = {
  PENDING_TEAM_LEAD: "Waiting on Team Lead",
  PENDING_SUPERVISOR: "Waiting on Unit Supervisor",
  PENDING_MANAGER: "Waiting on Manager",
  PENDING_HR: "Waiting on HR",
  PENDING_ED: "Waiting on ED",
  REJECTED: "Open to read the comment",
};

export function leaveStatusHint(status: LeaveStatus): string | undefined {
  return LEAVE_STATUS_HINT[status];
}

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

export function formatLeaveShortDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function sortLeaveBalances(balances: LeaveBalance[]): LeaveBalance[] {
  return [...balances].sort((a, b) => {
    const aAnnual = (a.leave_type.code ?? "").toUpperCase() === "ANNUAL" ? 0 : 1;
    const bAnnual = (b.leave_type.code ?? "").toUpperCase() === "ANNUAL" ? 0 : 1;
    if (aAnnual !== bAnnual) return aAnnual - bAnnual;
    return (a.leave_type.display_order ?? 100) - (b.leave_type.display_order ?? 100);
  });
}
