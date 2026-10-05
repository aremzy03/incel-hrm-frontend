import { cn } from "@/lib/utils";
import type { LeaveBalance } from "@/lib/types/leave";
import {
  availableBalanceDays,
  formatLeaveDays,
  formatLeaveShortDate,
  sortLeaveBalances,
} from "@/lib/leave/format";

interface LeaveBalanceStripProps {
  balances: LeaveBalance[];
  embedded?: boolean;
}

export function LeaveBalanceStrip({
  balances,
  embedded = false,
}: LeaveBalanceStripProps) {
  if (balances.length === 0) return null;

  const ordered = sortLeaveBalances(balances);

  const content = (
    <div className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
      {ordered.map((b) => {
        const total = Number(b.allocated_days);
        const available = availableBalanceDays(b);
        const pending = Number(b.pending_days ?? 0);
        const carried = Number(b.carried_forward_days ?? 0);
        const pct = total > 0 ? Math.round((available / total) * 100) : 0;
        const depleted = total > 0 && available <= 0;
        const label = `${b.leave_type.name}: ${formatLeaveDays(available)} of ${formatLeaveDays(total)} days remaining`;

        return (
          <div key={b.id} className="min-w-0 space-y-2">
            <p
              className="truncate text-body-md font-medium text-on-surface"
              title={b.leave_type.name}
            >
              {b.leave_type.name}
            </p>
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span
                className={`font-data-table text-headline-lg font-semibold tabular-nums tracking-tight ${depleted ? "text-error" : "text-on-surface"}`}
              >
                {formatLeaveDays(available)}
              </span>
              <span className="text-label-md text-on-surface-variant">
                of {formatLeaveDays(total)} remaining
              </span>
            </p>
            <div
              className={cn(
                "h-1.5 w-full overflow-hidden rounded-full",
                depleted
                  ? "bg-error-container"
                  : "bg-surface-container-high"
              )}
              role="progressbar"
              aria-label={label}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={Math.max(0, available)}
              aria-valuetext={label}
            >
              <div
                className="h-full rounded-full bg-primary-container transition-[width]"
                style={{
                  width: `${Math.min(100, Math.max(0, pct))}%`,
                }}
              />
            </div>
            {pending > 0 ? (
              <p className="text-label-md text-on-surface-variant">
                {formatLeaveDays(pending)} pending approval
              </p>
            ) : null}
            {carried > 0 ? (
              <p className="text-label-md text-on-surface-variant">
                {formatLeaveDays(carried)} carried
                {b.carry_forward_expires_on
                  ? ` · until ${formatLeaveShortDate(b.carry_forward_expires_on)}`
                  : ""}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );

  if (embedded) return content;

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 custom-shadow sm:p-6">
      {content}
    </div>
  );
}
