import { cn } from "@/lib/utils";
import { LOAN_STATUS_DISPLAY, type LoanStatus } from "@/lib/types/loan";

const STYLE_MAP: Record<LoanStatus, string> = {
  DRAFT: "bg-secondary text-secondary-foreground",
  PENDING_MANAGER: "bg-amber-100 text-amber-700",
  PENDING_HR: "bg-yellow-100 text-yellow-700",
  PENDING_ED: "bg-yellow-100 text-yellow-700",
  PENDING_MD: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  ACTIVE: "bg-blue-100 text-blue-700",
  CLOSED: "bg-muted text-muted-foreground",
  LIQUIDATED: "bg-muted text-muted-foreground",
};

interface LoanStatusBadgeProps {
  status: LoanStatus | string;
  className?: string;
}

export function LoanStatusBadge({ status, className }: LoanStatusBadgeProps) {
  const key = status as LoanStatus;
  const label =
    key in LOAN_STATUS_DISPLAY
      ? LOAN_STATUS_DISPLAY[key]
      : String(status);

  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        STYLE_MAP[key] ?? "bg-muted text-muted-foreground",
        className
      )}
    >
      {label}
    </span>
  );
}
