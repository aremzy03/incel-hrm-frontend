import type { LeaveBalance } from "@/lib/types/leave";
import { stitchCardClass } from "@/lib/design/field-styles";
import { cn } from "@/lib/utils";

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
            const total = b.allocated_days;
            const pct = total > 0 ? Math.round((b.remaining_days / total) * 100) : 0;
            return (
              <div key={b.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-body-md font-medium text-on-surface">
                    {b.leave_type.name}
                  </span>
                  <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-label-md font-bold text-primary">
                    {b.remaining_days}/{total} days
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
