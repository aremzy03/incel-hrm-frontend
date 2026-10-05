import type { LeaveBalance } from "@/lib/types/leave";
import { stitchCardClass } from "@/lib/design/field-styles";
import { cn } from "@/lib/utils";
import { availableBalanceDays, formatLeaveDays } from "@/lib/leave/format";

interface LeaveBalancePanelProps {
  balances: LeaveBalance[];
  loading?: boolean;
}

export function LeaveBalancePanel({ balances, loading }: LeaveBalancePanelProps) {
  return (
    <div className={cn(stitchCardClass, "p-6")}>
      <h3 className="mb-6 text-title-sm font-semibold text-on-surface">
        Leave Balances
      </h3>
      {loading ? (
        <p className="text-sm text-on-surface-variant">Loading balances...</p>
      ) : balances.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No balance data available.</p>
      ) : (
        <div className="space-y-6">
          {balances.map((b) => {
            const total = Number(b.allocated_days);
            const available = availableBalanceDays(b);
            const pct = total > 0 ? Math.round((available / total) * 100) : 0;
            return (
              <div key={b.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-body-md font-medium text-on-surface">
                    {b.leave_type.name}
                  </span>
                  <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-label-md font-bold text-primary">
                    {formatLeaveDays(available)}/{formatLeaveDays(total)} available
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                  />
                </div>
                <p className="text-xs text-on-surface-variant">
                  Allocated {formatLeaveDays(b.allocated_days)} · Used {formatLeaveDays(b.used_days)} · Pending {formatLeaveDays(b.pending_days ?? 0)}
                </p>
                {Number(b.carried_forward_days ?? 0) > 0 && (
                  <p className="text-xs text-on-surface-variant">
                    {formatLeaveDays(b.carried_forward_days)} days carried from last year
                    {b.carry_forward_expires_on ? ` (expires ${b.carry_forward_expires_on})` : ""}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
