import type { LeaveRequest } from "@/lib/types/leave";

export function isReconciledRequest(req: LeaveRequest): boolean {
  return req.is_reconciled === true;
}

export function formatReconciledMeta(req: LeaveRequest): string {
  if (!req.reconciled_by || !req.reconciled_at) return "";
  const name =
    `${req.reconciled_by.first_name} ${req.reconciled_by.last_name}`.trim() ||
    req.reconciled_by.email;
  return `Reconciled by ${name} on ${new Date(req.reconciled_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

export function spansMultipleYears(start: string, end: string): boolean {
  if (!start || !end) return false;
  return new Date(start).getFullYear() !== new Date(end).getFullYear();
}

export const CSV_RECONCILE_TEMPLATE =
  "email,leave_type,start_date,end_date,reconciliation_note,reason,cover_person_email\n" +
  "employee@test.com,Annual,2025-03-10,2025-03-14,Confirmed absence,Absent,\n";

export function downloadCsvTemplate() {
  const blob = new Blob([CSV_RECONCILE_TEMPLATE], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "leave-reconciliation-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}
