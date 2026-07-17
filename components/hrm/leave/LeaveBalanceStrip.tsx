import type { LeaveBalance } from "@/lib/types/leave";

interface LeaveBalanceStripProps {
  balances: LeaveBalance[];
  /** When true, omit the outer card wrapper (for embedding in another panel). */
  embedded?: boolean;
}

export function LeaveBalanceStrip({ balances, embedded = false }: LeaveBalanceStripProps) {
  if (balances.length === 0) return null;

  const content = (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {balances.map((b) => {
        const total = b.allocated_days;
        const pct = total > 0 ? Math.round((b.remaining_days / total) * 100) : 0;
        return (
          <div key={b.id} className="space-y-1.5">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-on-surface">{b.leave_type.name}</span>
              <span className="text-on-surface-variant">
                {b.remaining_days}/{total} days
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
              <div
                className="h-full rounded-full bg-primary-container transition-all"
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  if (embedded) return content;

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 custom-shadow">
      {content}
    </div>
  );
}
