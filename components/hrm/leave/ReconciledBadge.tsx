"use client";

import { cn } from "@/lib/utils";
import type { LeaveRequest } from "@/lib/types/leave";
import { formatReconciledMeta } from "@/lib/leave/reconciliation";

export function ReconciledBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-bold uppercase text-indigo-800",
        className
      )}
    >
      Reconciled
    </span>
  );
}

export function ReconciledBanner({ request }: { request: LeaveRequest }) {
  const meta = formatReconciledMeta(request);
  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 dark:border-indigo-900/40 dark:bg-indigo-950/30">
      <div className="flex flex-wrap items-center gap-2">
        <ReconciledBadge />
        <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
          Reconciled by HR — immediately approved (no approval workflow)
        </span>
      </div>
      {meta && (
        <p className="mt-1 text-xs text-indigo-800/80 dark:text-indigo-300/80">
          {meta}
        </p>
      )}
      {request.reconciliation_note && (
        <p className="mt-2 rounded-lg bg-white/60 px-3 py-2 text-sm text-indigo-950 dark:bg-black/20 dark:text-indigo-100">
          <span className="font-medium">HR note:</span> {request.reconciliation_note}
        </p>
      )}
    </div>
  );
}
