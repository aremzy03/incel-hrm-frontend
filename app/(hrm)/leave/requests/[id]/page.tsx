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
import {
  ApprovalChain,
  type ApprovalStep,
} from "@/components/hrm/leave/ApprovalChain";
import { EmployeeLeaveContext } from "@/components/hrm/leave/EmployeeLeaveContext";
import {
  stitchCardClass,
  stitchFieldClass,
  stitchSelectClass,
  stitchTextareaClass,
} from "@/lib/design/field-styles";
import { apiGet, apiPost, apiPatch, ApiError } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { useEligibleRelievers } from "@/lib/api/leave";
import { useLeaveTypes } from "@/lib/api/leave-types";
import { canUserActOnLeaveRequest } from "@/lib/leave/approval";
import {
  extractCoverPersonId,
  extractFieldError,
  formatRelieverName,
  isRelieverRequired,
  isRelieverRequiredByPolicy,
  shouldShowRelieverField,
} from "@/lib/leave/reliever";
import { FieldLabel } from "@/components/hrm/forms/FieldLabel";
import { RelieverField } from "@/components/hrm/leave/RelieverField";
import type {
  LeaveRequest,
  LeaveApprovalLog,
  LeaveRequestCreatePayload,
  LeaveStatus,
} from "@/lib/types/leave";

const APPROVAL_STEP_LABELS = [
  "Team Lead (if applicable)",
  "Unit Supervisor (if applicable)",
  "Line Manager",
  "HR Department",
  "Executive Director",
];

const PENDING_STEP_INDEX: Partial<Record<LeaveStatus, number>> = {
  PENDING_TEAM_LEAD: 0,
  PENDING_SUPERVISOR: 1,
  PENDING_MANAGER: 2,
  PENDING_HR: 3,
  PENDING_ED: 4,
};

function buildApprovalSteps(status: LeaveStatus): ApprovalStep[] {
  if (status === "APPROVED") {
    return APPROVAL_STEP_LABELS.map((label) => ({
      label,
      state: "completed" as const,
    }));
  }
  if (status === "REJECTED" || status === "CANCELLED") {
    return APPROVAL_STEP_LABELS.map((label) => ({
      label,
      state: "upcoming" as const,
    }));
  }
  const activeIdx = PENDING_STEP_INDEX[status];
  if (activeIdx === undefined) {
    return APPROVAL_STEP_LABELS.map((label) => ({
      label,
      state: "upcoming" as const,
    }));
  }
  return APPROVAL_STEP_LABELS.map((label, i) => ({
    label,
    state:
      i < activeIdx
        ? ("completed" as const)
        : i === activeIdx
          ? ("active" as const)
          : ("upcoming" as const),
  }));
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
  const confirmTitle = isApprove ? "Confirm Approval" : "Confirm Rejection";

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
          {confirmTitle}
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
            className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition hover:bg-destructive/90"
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
            {confirmTitle}
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
  const [coverPersonError, setCoverPersonError] = useState<string | null>(null);
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
  const isOwnDraft =
    request?.status === "DRAFT" && request?.employee?.id === user?.id;
  const canEdit = !!request && isOwnDraft;

  const { data: eligibleRelievers, isLoading: relieversLoading } =
    useEligibleRelievers({ enabled: canEdit });
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

  const saveAndSubmitMutation = useMutation({
    mutationFn: async ({
      patch,
      submit,
    }: {
      patch?: Partial<LeaveRequestCreatePayload>;
      submit: LeaveRequestCreatePayload;
    }) => {
      if (patch) {
        await apiPatch<LeaveRequest>(`leave-requests/${id}`, patch);
      }
      return apiPost<LeaveRequest>(`leave-requests/${id}/submit/`, submit);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-request", id] });
      queryClient.invalidateQueries({ queryKey: ["leave-request-logs", id] });
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
      setEditForm(null);
      setEditError(null);
      setCoverPersonError(null);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const d = err.data as Record<string, unknown>;
        const coverErr = extractFieldError(d, "cover_person");
        setCoverPersonError(coverErr);
        const msg =
          coverErr ??
          (Array.isArray(d?.detail) ? d.detail[0] : d?.detail) ??
          (typeof d?.detail === "string" ? d.detail : null) ??
          err.message;
        setEditError(coverErr ? null : (msg as string));
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
      setCoverPersonError(null);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const d = err.data as Record<string, unknown>;
        const coverErr = extractFieldError(d, "cover_person");
        setCoverPersonError(coverErr);
        const msg =
          coverErr ??
          (Array.isArray(d?.detail) ? d.detail[0] : d?.detail) ??
          (typeof d?.detail === "string" ? d.detail : null) ??
          err.message;
        setEditError(coverErr ? null : (msg as string));
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
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
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
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
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
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
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
      <div className="mx-auto max-w-7xl space-y-4">
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

  const selectedLeaveType =
    leaveTypes.find((t) => t.id === formValues.leave_type) ?? request.leave_type;
  const relieverRequired = isRelieverRequired({
    leaveTypeName: selectedLeaveType.name,
    isEmergency: request.is_emergency,
    user,
  });
  const showRelieverField = shouldShowRelieverField({
    relieverRequired,
    coverPersonId: formValues.cover_person,
  });

  const canSubmit =
    canEdit &&
    formValues.leave_type &&
    formValues.start_date &&
    formValues.end_date &&
    (!relieverRequired || !!formValues.cover_person);

  const coverPersonDisplay =
    request.cover_person && typeof request.cover_person === "object"
      ? formatRelieverName(request.cover_person)
      : null;
  const relieverRequiredForDisplay = isRelieverRequiredByPolicy({
    leaveTypeName: request.leave_type.name,
    isEmergency: request.is_emergency,
  });

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
    setCoverPersonError(null);
  }

  function handleSaveEdits() {
    if (!editForm || !request) return;
    setEditError(null);
    setCoverPersonError(null);
    updateMutation.mutate({
      leave_type: editForm.leave_type,
      start_date: editForm.start_date,
      end_date: editForm.end_date,
      reason: editForm.reason,
      is_emergency: request.is_emergency,
      ...(editForm.cover_person
        ? { cover_person: editForm.cover_person }
        : {}),
    });
  }

  function buildDraftPayload(
    values: typeof baseForm,
    isEmergency: boolean
  ): LeaveRequestCreatePayload {
    return {
      leave_type: values.leave_type,
      start_date: values.start_date,
      end_date: values.end_date,
      reason: values.reason,
      is_emergency: isEmergency,
      ...(values.cover_person ? { cover_person: values.cover_person } : {}),
    };
  }

  function handleSubmitDraft() {
    if (!request) return;
    setEditError(null);
    setCoverPersonError(null);
    const payload = buildDraftPayload(formValues, request.is_emergency);
    saveAndSubmitMutation.mutate({
      submit: payload,
      patch: editForm ? payload : undefined,
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
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
                disabled={!canSubmit || saveAndSubmitMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saveAndSubmitMutation.isPending && (
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
                  <FieldLabel htmlFor={`leave-edit-type-${id}`}>
                    Leave Type
                  </FieldLabel>
                  <select
                    id={`leave-edit-type-${id}`}
                    value={editForm.leave_type}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      const nextType = leaveTypes.find((t) => t.id === nextId);
                      setEditForm((f) => {
                        if (!f) return null;
                        const nextRelieverRequired = isRelieverRequired({
                          leaveTypeName: nextType?.name ?? request.leave_type.name,
                          isEmergency: request.is_emergency,
                          user,
                        });
                        return {
                          ...f,
                          leave_type: nextId,
                          cover_person: nextRelieverRequired ? f.cover_person : "",
                        };
                      });
                      setCoverPersonError(null);
                    }}
                    className={stitchSelectClass}
                  >
                    {leaveTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {deptId ? (
                  <RelieverField
                    id={`leave-edit-cover-${id}`}
                    value={editForm.cover_person}
                    onChange={(next) => {
                      setEditForm((f) =>
                        f ? { ...f, cover_person: next } : null
                      );
                      setCoverPersonError(null);
                    }}
                    relieverRequired={relieverRequired}
                    showField={showRelieverField}
                    relievers={eligibleRelievers?.relievers ?? []}
                    eligibleData={eligibleRelievers}
                    isLoading={relieversLoading}
                    error={coverPersonError}
                  />
                ) : (
                  <p className="text-body-md text-on-surface-variant">
                    Reliever selection requires an org assignment. Contact HR if
                    this looks wrong.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor={`leave-edit-start-${id}`}>
                      Start Date
                    </FieldLabel>
                    <input
                      id={`leave-edit-start-${id}`}
                      type="date"
                      value={editForm.start_date}
                      onChange={(e) =>
                        setEditForm((f) =>
                          f ? { ...f, start_date: e.target.value } : null
                        )
                      }
                      className={stitchFieldClass}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor={`leave-edit-end-${id}`}>
                      End Date
                    </FieldLabel>
                    <input
                      id={`leave-edit-end-${id}`}
                      type="date"
                      value={editForm.end_date}
                      min={editForm.start_date}
                      onChange={(e) =>
                        setEditForm((f) =>
                          f ? { ...f, end_date: e.target.value } : null
                        )
                      }
                      className={stitchFieldClass}
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel htmlFor={`leave-edit-reason-${id}`} optional>
                    Reason
                  </FieldLabel>
                  <textarea
                    id={`leave-edit-reason-${id}`}
                    rows={3}
                    value={editForm.reason}
                    onChange={(e) =>
                      setEditForm((f) =>
                        f ? { ...f, reason: e.target.value } : null
                      )
                    }
                    className={stitchTextareaClass}
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
                    disabled={
                      updateMutation.isPending || saveAndSubmitMutation.isPending
                    }
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
                    disabled={!canSubmit || saveAndSubmitMutation.isPending}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saveAndSubmitMutation.isPending && (
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
                <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Reliever</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {coverPersonDisplay ??
                      (!relieverRequiredForDisplay ? "Not required" : "—")}
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

          <EmployeeLeaveContext
            employeeId={request.employee.id}
            employeeName={employeeName}
            currentRequestId={id}
            viewer={user}
            isOwner={isOwner}
          />
        </div>

        <div className="space-y-4">
          <ApprovalChain
            title="Approval Timeline"
            steps={buildApprovalSteps(request.status)}
          />
          {logs.length > 0 && (
            <div className={cn(stitchCardClass, "p-5")}>
              <h3 className="mb-4 text-title-sm font-semibold text-on-surface">
                Activity Log
              </h3>
              <ol className="space-y-3">
                {logs.map((log) => {
                  const actorName = log.actor
                    ? `${log.actor.first_name} ${log.actor.last_name}`
                    : "System";
                  return (
                    <li
                      key={log.id}
                      className="flex gap-3 border-b border-outline-variant/50 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-container-low">
                        {getActionIcon(log.action)}
                      </div>
                      <div>
                        <p className="text-body-md font-medium text-on-surface">
                          {approvalLogTitle(log)}
                        </p>
                        <p className="text-label-md text-on-surface-variant">
                          by {actorName} &middot; {formatTimestamp(log.timestamp)}
                        </p>
                        {log.comment && (
                          <p className="mt-1 rounded-lg bg-surface-container-low px-2 py-1 text-label-md text-on-surface-variant">
                            &ldquo;{log.comment}&rdquo;
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
