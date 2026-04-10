"use client";

import { useState, useMemo, useEffect, useRef, useId } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, X, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/hrm/ui/StatusBadge";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { DataTable } from "@/components/hrm/ui/DataTable";
import { apiGet, apiPost, ApiError } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { LEAVE_STATUS_DISPLAY } from "@/lib/types/leave";
import { canUserActOnLeaveRequest } from "@/lib/leave/approval";
import type {
  LeaveRequest,
  LeaveStatus,
  PaginatedResponse,
} from "@/lib/types/leave";

type ModalAction = "approve" | "reject";

interface ModalState {
  record: LeaveRequest;
  action: ModalAction;
}

const PENDING_STATUSES: LeaveStatus[] = [
  "PENDING_TEAM_LEAD",
  "PENDING_SUPERVISOR",
  "PENDING_MANAGER",
  "PENDING_HR",
  "PENDING_ED",
];

const FILTER_STATUSES: LeaveStatus[] = [
  "PENDING_TEAM_LEAD",
  "PENDING_SUPERVISOR",
  "PENDING_MANAGER",
  "PENDING_HR",
  "PENDING_ED",
  "APPROVED",
  "REJECTED",
];

const TABLE_COLUMNS = [
  { key: "employee", label: "Employee" },
  { key: "type", label: "Leave Type" },
  { key: "duration", label: "Duration" },
  { key: "days", label: "Days" },
  { key: "submitted", label: "Submitted" },
  { key: "status", label: "Status" },
  { key: "action", label: "Actions" },
];

function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

const selectClass =
  "rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

function ConfirmModal({
  modal,
  onClose,
  onConfirm,
  isPending,
}: {
  modal: ModalState;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}) {
  const dialogId = useId();
  const [reason, setReason] = useState("");
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isApprove = modal.action === "approve";
  const Verb = isApprove ? "Approve" : "Reject";
  const verb = isApprove ? "approve" : "reject";
  const employeeName = `${modal.record.employee.first_name} ${modal.record.employee.last_name}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${dialogId}-title`}
    >
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition hover:bg-muted"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <h2
          id={`${dialogId}-title`}
          className="text-lg font-semibold text-foreground"
        >
          Confirm {Verb}al
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Are you sure you want to{" "}
          <span className="font-medium text-foreground">{verb}</span> the leave
          request for{" "}
          <span className="font-medium text-foreground">{employeeName}</span>?
        </p>

        <div className="mt-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
          <p className="font-medium text-foreground">
            {modal.record.leave_type.name}
          </p>
          <p className="text-muted-foreground">
            {modal.record.start_date} &mdash; {modal.record.end_date} &middot;{" "}
            {modal.record.total_working_days} day
            {modal.record.total_working_days !== 1 ? "s" : ""}
          </p>
        </div>

        {!isApprove && (
          <div className="mt-4">
            <label
              htmlFor={`${dialogId}-reason`}
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Reason for rejection{" "}
              <span className="text-xs font-normal text-destructive">
                (required)
              </span>
            </label>
            <textarea
              id={`${dialogId}-reason`}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a reason to notify the employee..."
              className="w-full resize-none rounded-lg border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:opacity-80"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            onClick={() => onConfirm(reason)}
            disabled={isPending || (!isApprove && !reason.trim())}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition hover:opacity-90 disabled:opacity-50",
              isApprove
                ? "bg-primary text-primary-foreground"
                : "bg-destructive text-destructive-foreground"
            )}
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirm {Verb}al
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminApprovalsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: requestsRaw, isLoading } = useQuery({
    queryKey: ["admin-leave-requests"],
    queryFn: () =>
      apiGet<PaginatedResponse<LeaveRequest> | LeaveRequest[]>("leave-requests"),
  });

  const records: LeaveRequest[] = Array.isArray(requestsRaw)
    ? requestsRaw
    : requestsRaw?.results ?? [];

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | LeaveStatus>("all");
  const [modal, setModal] = useState<ModalState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const leaveTypeNames = useMemo(() => {
    const names = new Set(records.map((r) => r.leave_type.name));
    return Array.from(names).sort();
  }, [records]);

  const pendingCount = useMemo(
    () =>
      records.filter((r) =>
        PENDING_STATUSES.includes(r.status as LeaveStatus)
      ).length,
    [records]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      const fullName =
        `${r.employee.first_name} ${r.employee.last_name}`.toLowerCase();
      const nameMatch = !q || fullName.includes(q);
      const typeMatch = typeFilter === "all" || r.leave_type.name === typeFilter;
      const statusMatch = statusFilter === "all" || r.status === statusFilter;
      return nameMatch && typeMatch && statusMatch;
    });
  }, [records, search, typeFilter, statusFilter]);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

  const approveMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      apiPost<LeaveRequest>(`leave-requests/${id}/approve`, {
        comment: comment || undefined,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-leave-requests"] });
      const rec = modal?.record;
      if (rec) {
        showToast(
          `Leave request for ${rec.employee.first_name} ${rec.employee.last_name} has been approved.`
        );
      }
      setModal(null);
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError ? err.message : "Failed to approve.";
      showToast(msg);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      apiPost<LeaveRequest>(`leave-requests/${id}/reject`, { comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leave-requests"] });
      const rec = modal?.record;
      if (rec) {
        showToast(
          `Leave request for ${rec.employee.first_name} ${rec.employee.last_name} has been rejected.`
        );
      }
      setModal(null);
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError ? err.message : "Failed to reject.";
      showToast(msg);
    },
  });

  function handleConfirm(reason: string) {
    if (!modal) return;
    const payload = { id: modal.record.id, comment: reason.trim() };
    if (modal.action === "approve") {
      approveMutation.mutate(payload);
    } else {
      rejectMutation.mutate(payload);
    }
  }

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const hasFilters =
    search !== "" || typeFilter !== "all" || statusFilter !== "all";

  return (
    <>
      <div className="space-y-6 p-8">
        <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
          <Link href="/leave" className="text-primary hover:underline">
            Leave Management
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium text-foreground">Leave Approvals</span>
        </nav>

        <PageHeader
          title="Leave Approvals"
          action={
            pendingCount > 0 ? (
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                {pendingCount} Pending
              </span>
            ) : undefined
          }
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search employee..."
                  className="w-48 rounded-lg border border-border bg-input py-2 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Search by employee name"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={selectClass}
                aria-label="Filter by leave type"
              >
                <option value="all">All Types</option>
                {leaveTypeNames.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "all" | LeaveStatus)
                }
                className={selectClass}
                aria-label="Filter by status"
              >
                <option value="all">All Statuses</option>
                {FILTER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {LEAVE_STATUS_DISPLAY[s]}
                  </option>
                ))}
              </select>

              {hasFilters && (
                <button
                  onClick={() => {
                    setSearch("");
                    setTypeFilter("all");
                    setStatusFilter("all");
                  }}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </button>
              )}
            </div>

            <DataTable
              columns={TABLE_COLUMNS}
              emptyMessage="No leave requests match the selected filters."
              rows={filtered.map((row) => {
                const status = row.status as LeaveStatus;
                const isPending = PENDING_STATUSES.includes(status);
                const { canApprove, canReject } = canUserActOnLeaveRequest(user, row);
                const showActions = isPending && canApprove && canReject;
                return {
                  employee: (
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                        {getInitials(
                          row.employee.first_name,
                          row.employee.last_name
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {row.employee.first_name} {row.employee.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {row.employee.email}
                        </p>
                      </div>
                    </div>
                  ),
                  type: (
                    <span className="text-muted-foreground">
                      {row.leave_type.name}
                    </span>
                  ),
                  duration: (
                    <span className="text-muted-foreground">
                      {row.start_date} &mdash; {row.end_date}
                    </span>
                  ),
                  days: (
                    <span className="text-muted-foreground">
                      {row.total_working_days}
                    </span>
                  ),
                  submitted: (
                    <span className="text-muted-foreground">
                      {new Date(row.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  ),
                  status: <StatusBadge status={row.status} />,
                  action: showActions ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setModal({ record: row, action: "approve" })
                        }
                        className="rounded-md bg-green-600 px-3 py-1 text-xs text-white transition hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          setModal({ record: row, action: "reject" })
                        }
                        className="rounded-md bg-destructive px-3 py-1 text-xs text-destructive-foreground transition hover:opacity-90"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">&mdash;</span>
                  ),
                };
              })}
            />
          </>
        )}
      </div>

      {modal && (
        <ConfirmModal
          modal={modal}
          onClose={() => setModal(null)}
          onConfirm={handleConfirm}
          isPending={approveMutation.isPending || rejectMutation.isPending}
        />
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 top-4 z-50 flex max-w-sm items-start gap-2.5 rounded-lg bg-green-600 px-4 py-2.5 text-sm text-white shadow-lg"
        >
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{toast}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-auto shrink-0 rounded p-0.5 opacity-70 hover:opacity-100 transition"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
