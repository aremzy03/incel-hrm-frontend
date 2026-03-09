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
  CANCELLED: "bg-muted text-muted-foreground",
  Cancelled: "bg-muted text-muted-foreground",
  DRAFT: "bg-secondary text-secondary-foreground",
  Draft: "bg-secondary text-secondary-foreground",
  PENDING_MANAGER: "bg-yellow-100 text-yellow-700",
  PENDING_HR: "bg-yellow-100 text-yellow-700",
  PENDING_ED: "bg-yellow-100 text-yellow-700",
};

function getStatusStyle(status: string): string {
  if (STYLE_MAP[status]) return STYLE_MAP[status];
  if (status.startsWith("Pending") || status.startsWith("PENDING"))
    return "bg-yellow-100 text-yellow-700";
  return "bg-muted text-muted-foreground";
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
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        getStatusStyle(status),
        className
      )}
    >
      {getDisplayLabel(status)}
    </span>
  );
}
