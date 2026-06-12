import { cn } from "@/lib/utils";
import { LEAVE_STATUS_DISPLAY } from "@/lib/types/leave";
import type { LeaveStatus } from "@/lib/types/leave";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STYLE_MAP: Record<string, string> = {
  APPROVED: "bg-green-100 text-green-700",
  Approved: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  Rejected: "bg-red-100 text-red-700",
  CANCELLED: "bg-surface-container-high text-on-surface-variant",
  Cancelled: "bg-surface-container-high text-on-surface-variant",
  DRAFT: "bg-secondary-container text-on-secondary-container",
  Draft: "bg-secondary-container text-on-secondary-container",
  PENDING_TEAM_LEAD: "bg-amber-100 text-amber-700",
  PENDING_SUPERVISOR: "bg-amber-100 text-amber-700",
  PENDING_MANAGER: "bg-amber-100 text-amber-700",
  PENDING_HR: "bg-amber-100 text-amber-700",
  PENDING_ED: "bg-amber-100 text-amber-700",
};

function getStatusStyle(status: string): string {
  if (STYLE_MAP[status]) return STYLE_MAP[status];
  if (status.startsWith("Pending") || status.startsWith("PENDING"))
    return "bg-amber-100 text-amber-700";
  return "bg-surface-container-high text-on-surface-variant";
}

function getDisplayLabel(status: string): string {
  if (status in LEAVE_STATUS_DISPLAY)
    return LEAVE_STATUS_DISPLAY[status as LeaveStatus];
  return status;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase",
        getStatusStyle(status),
        className
      )}
    >
      {getDisplayLabel(status)}
    </span>
  );
}
