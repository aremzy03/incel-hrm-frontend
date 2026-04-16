"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  User,
  FileText,
  AlertTriangle,
  CheckCircle,
  X,
  XCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/hrm/ui/StatusBadge";
import { apiGet, apiPost, apiPatch, ApiError } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartmentMembers } from "@/lib/api/departments";
import { useLeaveTypes } from "@/lib/api/leave-types";
import { canUserActOnLeaveRequest } from "@/lib/leave/approval";
import type {
  LeaveRequest,
  LeaveApprovalLog,
  LeaveRequestCreatePayload,
  LeaveStatus,
} from "@/lib/types/leave";

const fieldClass =
  "w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition";

function extractCoverPersonId(
  cp: LeaveRequest["cover_person"]
): string {
  if (!cp) return "";
  return typeof cp === "string" ? cp : cp?.id ?? "";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getActionIcon(action: string) {
  switch (action) {
    case "APPROVE":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "REJECT":
      return <XCircle className="h-4 w-4 text-red-600" />;
    case "CANCEL":
      return <XCircle className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Clock className="h-4 w-4 text-yellow-600" />;
  }
}

function approvalLogTitle(log: LeaveApprovalLog): string {
  switch (log.action) {
    case "MODIFY":
      return "Request Sent";
    case "APPROVE":
      return "Approved";
    default:
      return log.action_display;
  }
}

type ApprovalModalAction = "approve" | "reject";

function ApproverConfirmModal({
  action,
  request,
  onClose,
  onConfirm,
  isPending,
}: {
  action: ApprovalModalAction;
  request: LeaveRequest;
  onClose: () => void;
  onConfirm: (comment: string) => void;
  isPending: boolean;
}) {
  const dialogId = `leave-approver-${request.id}`;
  const [comment, setComment] = useState("");
  const isApprove = action === "approve";
  const Verb = isApprove ? "Approve" : "Reject";

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
          {isApprove
            ? "Approving will move this request to the next stage."
            : "Rejecting will end the approval process and notify the employee."}
        </p>

        <div className="mt-4">
          <label
            htmlFor={`${dialogId}-comment`}
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {isApprove ? (
              <>
                Comment{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (optional)
                </span>
              </>
            ) : (
              <>
                Reason for rejection{" "}
                <span className="text-xs font-normal text-destructive">
                  (required)
                </span>
              </>
            )}
          </label>
          <textarea
            id={`${dialogId}-comment`}
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              isApprove
                ? "Optional comment..."
                : "Provide a reason to notify the employee..."
            }
            className="w-full resize-none rounded-lg border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:opacity-80"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(comment.trim())}
            disabled={isPending || (!isApprove && !comment.trim())}
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

export default function LeaveRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [editForm, setEditForm] = useState<{
    leave_type: string;
    start_date: string;
    end_date: string;
    reason: string;
    cover_person: string;
  } | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [approvalModal, setApprovalModal] = useState<{
    action: ApprovalModalAction;
  } | null>(null);

  const {
    data: request,
    isLoading: requestLoading,
    error: requestError,
  } = useQuery({
    queryKey: ["leave-request", id],
    queryFn: () => apiGet<LeaveRequest>(`leave-requests/${id}`),
  });

  const deptId = useMemo(
    () =>
      typeof user?.department === "string"
        ? user.department
        : user?.department?.id ?? null,
    [user?.department]
  );
  const { data: leaveTypes = [] } = useLeaveTypes();
  const { data: departmentMembers = [] } = useDepartmentMembers(deptId ?? "");
  const coverOptions = departmentMembers.filter((m) => m.id !== user?.id);

  const isOwnDraft =
    request?.status === "DRAFT" && request?.employee?.id === user?.id;
  const canEdit = !!request && isOwnDraft;
  const isOwner = !!request && request?.employee?.id === user?.id;

  const isPending = (request?.status as string | undefined)?.startsWith("PENDING");
  const { canApprove, canReject } = canUserActOnLeaveRequest(user, request);
  const showApproverActions =
    !!request && !!isPending && canApprove && canReject && !isOwner;
  const canOwnerCancel =
    !!request &&
    isOwner &&
    ([
      "DRAFT",
      "PENDING_TEAM_LEAD",
      "PENDING_SUPERVISOR",
      "PENDING_MANAGER",
    ] as LeaveStatus[]).includes(
      request.status as LeaveStatus
    );

  const submitMutation = useMutation({
    mutationFn: (payload: LeaveRequestCreatePayload) =>
      apiPost<LeaveRequest>(`leave-requests/${id}/submit/`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-request", id] });
      queryClient.invalidateQueries({ queryKey: ["leave-request-logs", id] });
      queryClient.invalidateQueries({ queryKey: ["my-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-requests-recent"] });
      setEditForm(null);
      setEditError(null);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const d = err.data as Record<string, unknown>;
        const msg =
          (Array.isArray(d?.detail) ? d.detail[0] : d?.detail) ??
          (typeof d?.detail === "string" ? d.detail : null) ??
          err.message;
        setEditError(msg as string);
      } else {
        setEditError("Something went wrong. Please try again.");
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<LeaveRequestCreatePayload>) =>
      apiPatch<LeaveRequest>(`leave-requests/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-request", id] });
      setEditForm(null);
      setEditError(null);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const d = err.data as Record<string, unknown>;
        const msg =
          (Array.isArray(d?.detail) ? d.detail[0] : d?.detail) ??
          (typeof d?.detail === "string" ? d.detail : null) ??
          err.message;
        setEditError(msg as string);
      } else {
        setEditError("Something went wrong. Please try again.");
      }
    },
  });

  const approveMutation = useMutation({
    mutationFn: (payload: { comment?: string }) =>
      apiPost<LeaveRequest>(`leave-requests/${id}/approve`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-request", id] });
      queryClient.invalidateQueries({ queryKey: ["leave-request-logs", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-leave-requests"] });
      setApprovalModal(null);
      setEditError(null);
    },
    onError: (err) => {
      setEditError(err instanceof ApiError ? err.message : "Failed to approve.");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (payload: { comment: string }) =>
      apiPost<LeaveRequest>(`leave-requests/${id}/reject`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-request", id] });
      queryClient.invalidateQueries({ queryKey: ["leave-request-logs", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-leave-requests"] });
      setApprovalModal(null);
      setEditError(null);
    },
    onError: (err) => {
      setEditError(err instanceof ApiError ? err.message : "Failed to reject.");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => apiPost<LeaveRequest>(`leave-requests/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-request", id] });
      queryClient.invalidateQueries({ queryKey: ["leave-request-logs", id] });
      queryClient.invalidateQueries({ queryKey: ["my-leave-requests"] });
      setEditError(null);
    },
    onError: (err) => {
      setEditError(err instanceof ApiError ? err.message : "Failed to cancel.");
    },
  });

  const { data: logsRaw } = useQuery({
    queryKey: ["leave-request-logs", id],
    queryFn: () =>
      apiGet<LeaveApprovalLog[] | { results: LeaveApprovalLog[] }>(
        `leave-requests/${id}/logs`
      ),
    enabled: !!request,
  });

  const logs: LeaveApprovalLog[] = Array.isArray(logsRaw)
    ? logsRaw
    : (logsRaw as { results: LeaveApprovalLog[] })?.results ?? [];

  if (requestLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (requestError || !request) {
    return (
      <div className="space-y-4 p-8">
        <Link
          href="/leave/history"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to History
        </Link>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
          <p className="mt-2 text-sm text-destructive">
            Failed to load leave request. It may not exist or you may not have
            permission to view it.
          </p>
        </div>
      </div>
    );
  }

  const employeeName = `${request.employee.first_name} ${request.employee.last_name}`;

  const baseForm = {
    leave_type: request.leave_type.id,
    start_date: request.start_date,
    end_date: request.end_date,
    reason: request.reason ?? "",
    cover_person: extractCoverPersonId(request.cover_person),
  };
  const formValues = editForm ?? baseForm;

  const canSubmit =
    canEdit &&
    formValues.leave_type &&
    formValues.start_date &&
    formValues.end_date &&
    (deptId ? formValues.cover_person : true);

  function handleStartEdit() {
    if (!request) return;
    setEditForm({
      leave_type: request.leave_type.id,
      start_date: request.start_date,
      end_date: request.end_date,
      reason: request.reason ?? "",
      cover_person: extractCoverPersonId(request.cover_person),
    });
    setEditError(null);
  }

  function handleSaveEdits() {
    if (!editForm || !request) return;
    setEditError(null);
    updateMutation.mutate({
      leave_type: editForm.leave_type,
      start_date: editForm.start_date,
      end_date: editForm.end_date,
      reason: editForm.reason,
      is_emergency: request.is_emergency,
      cover_person: editForm.cover_person,
    });
  }

  function handleSubmitDraft() {
    if (!request) return;
    setEditError(null);
    const payload: LeaveRequestCreatePayload = {
      leave_type: formValues.leave_type,
      start_date: formValues.start_date,
      end_date: formValues.end_date,
      reason: formValues.reason,
      is_emergency: request.is_emergency,
      cover_person: formValues.cover_person || "",
    };
    submitMutation.mutate(payload);
  }

  return (
    <div className="space-y-6 p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link href="/leave" className="text-primary hover:underline">
          Leave Management
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link href="/leave/history" className="text-primary hover:underline">
          History
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">Request Detail</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {request.leave_type.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Submitted by {employeeName} on{" "}
            {formatDate(request.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge
            status={request.status}
            className="text-sm px-3 py-1"
          />
          {showApproverActions && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setApprovalModal({ action: "approve" })}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => setApprovalModal({ action: "reject" })}
                className="rounded-lg bg-destructive px-3 py-1.5 text-sm font-semibold text-destructive-foreground transition hover:opacity-90"
              >
                Reject
              </button>
            </div>
          )}
          {canOwnerCancel && (
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="flex items-center gap-2 rounded-lg border border-destructive px-3 py-1.5 text-sm font-medium text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
            >
              {cancelMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Cancel request
            </button>
          )}
          {canEdit && !editForm && (
            <>
              <button
                onClick={handleStartEdit}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition hover:bg-muted"
              >
                Edit draft
              </button>
              <button
                onClick={handleSubmitDraft}
                disabled={!canSubmit || submitMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Submit for approval
              </button>
            </>
          )}
        </div>
      </div>

      {approvalModal && (
        <ApproverConfirmModal
          action={approvalModal.action}
          request={request}
          onClose={() => setApprovalModal(null)}
          onConfirm={(comment) => {
            if (approvalModal.action === "approve") {
              approveMutation.mutate({ comment: comment || undefined });
              return;
            }
            rejectMutation.mutate({ comment });
          }}
          isPending={approveMutation.isPending || rejectMutation.isPending}
        />
      )}

      {editError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {editError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Detail card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-semibold text-foreground mb-4">
              {editForm ? "Edit draft" : "Request Details"}
            </h2>

            {editForm ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Leave Type
                  </label>
                  <select
                    value={editForm.leave_type}
                    onChange={(e) =>
                      setEditForm((f) => f && { ...f, leave_type: e.target.value })
                    }
                    className={cn(fieldClass, "cursor-pointer")}
                  >
                    {leaveTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                {deptId && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Reliever
                    </label>
                    <select
                      value={editForm.cover_person}
                      onChange={(e) =>
                        setEditForm((f) =>
                          f ? { ...f, cover_person: e.target.value } : null
                        )
                      }
                      className={cn(fieldClass, "cursor-pointer")}
                    >
                      <option value="">Select reliever</option>
                      {coverOptions.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={editForm.start_date}
                      onChange={(e) =>
                        setEditForm((f) =>
                          f ? { ...f, start_date: e.target.value } : null
                        )
                      }
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={editForm.end_date}
                      min={editForm.start_date}
                      onChange={(e) =>
                        setEditForm((f) =>
                          f ? { ...f, end_date: e.target.value } : null
                        )
                      }
                      className={fieldClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Reason
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.reason}
                    onChange={(e) =>
                      setEditForm((f) =>
                        f ? { ...f, reason: e.target.value } : null
                      )
                    }
                    className={cn(fieldClass, "resize-none")}
                    placeholder="Reason for leave..."
                  />
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditForm(null)}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdits}
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-2 rounded-lg border border-primary bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10 disabled:opacity-50"
                  >
                    {updateMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Save changes
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitDraft}
                    disabled={!canSubmit || submitMutation.isPending}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Submit for approval
                  </button>
                </div>
              </div>
            ) : (
            <>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Employee</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {employeeName}
                  </dd>
                  <dd className="text-xs text-muted-foreground">
                    {request.employee.email}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Leave Type</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {request.leave_type.name}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Duration</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {formatDate(request.start_date)} &mdash;{" "}
                    {formatDate(request.end_date)}
                  </dd>
                  <dd className="text-xs text-muted-foreground">
                    {request.total_working_days} working day
                    {request.total_working_days !== 1 ? "s" : ""}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Submitted</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {formatTimestamp(request.created_at)}
                  </dd>
                </div>
              </div>
            </dl>

            {request.is_emergency && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                This is marked as an emergency leave request.
              </div>
            )}

            {request.reason && (
              <div className="mt-4">
                <h3 className="text-xs font-medium text-muted-foreground mb-1">
                  Reason
                </h3>
                <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground">
                  {request.reason}
                </p>
              </div>
            )}
            </>
            )}
          </div>
        </div>

        {/* Approval timeline */}
        <div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground mb-4">
              Approval Timeline
            </h2>

            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No approval actions recorded yet.
              </p>
            ) : (
              <ol className="space-y-0">
                {logs.map((log, i) => {
                  const isLast = i === logs.length - 1;
                  const actorName = log.actor
                    ? `${log.actor.first_name} ${log.actor.last_name}`
                    : "System";

                  return (
                    <li key={log.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                          {getActionIcon(log.action)}
                        </div>
                        {!isLast && (
                          <div
                            className="my-1 w-px flex-1 bg-border"
                            style={{ minHeight: "1.5rem" }}
                          />
                        )}
                      </div>

                      <div className={cn("pb-4", isLast && "pb-0")}>
                        <p className="text-sm font-medium text-foreground">
                          {approvalLogTitle(log)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          by {actorName} &middot;{" "}
                          {formatTimestamp(log.timestamp)}
                        </p>
                        {log.comment && (
                          <p className="mt-1 rounded-md bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                            &ldquo;{log.comment}&rdquo;
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
