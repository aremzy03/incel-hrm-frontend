import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost, ApiError } from "@/lib/api-client";
import type {
  BulkReconcilePayload,
  BulkReconcileResponse,
  EligibleRelieversResponse,
  LeaveBalance,
  LeaveBalanceTransaction,
  LeaveReconcileEditPayload,
  LeaveReconcilePayload,
  LeaveAttachment,
  LeaveRequest,
  PaginatedResponse,
} from "@/lib/types/leave";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export interface LeaveRequestListParams {
  employee?: string;
  status?: string;
  leave_type?: string;
  exclude?: string;
  search?: string;
  page?: number;
  is_reconciled?: boolean;
}

export interface LeaveBalanceListParams {
  employee?: string;
  year?: number;
}

export const leaveKeys = {
  all: ["leave"] as const,
  requests: (filters?: LeaveRequestListParams) =>
    ["leave-requests", filters ?? {}] as const,
  request: (id: string) => ["leave-request", id] as const,
  attachments: (id: string) => ["leave-attachments", id] as const,
  logs: (id: string) => ["leave-request-logs", id] as const,
  balances: (filters?: LeaveBalanceListParams) =>
    ["leave-balances", filters ?? {}] as const,
  eligibleRelievers: (leaveType?: string) =>
    ["leave-eligible-relievers", leaveType ?? ""] as const,
  transactions: (balanceId: string) =>
    ["leave-balance-transactions", balanceId] as const,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildQueryString(
  params: Record<string, string | number | undefined>
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function normalizeLeaveList(
  data: PaginatedResponse<LeaveRequest> | LeaveRequest[]
): LeaveRequest[] {
  return Array.isArray(data) ? data : data.results ?? [];
}

function normalizeBalanceList(
  data: PaginatedResponse<LeaveBalance> | LeaveBalance[]
): LeaveBalance[] {
  return Array.isArray(data) ? data : data.results ?? [];
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Flat list helper (first page or filtered slice). Prefer useLeaveRequestsPage for directories. */
export function useLeaveRequests(
  params?: LeaveRequestListParams,
  options?: { enabled?: boolean }
) {
  return useQuery<LeaveRequest[]>({
    queryKey: leaveKeys.requests(params),
    queryFn: async () => {
      const qs = buildQueryString({
        employee: params?.employee,
        status: params?.status,
        leave_type: params?.leave_type,
        exclude: params?.exclude,
        search: params?.search,
        is_reconciled:
          params?.is_reconciled === true
            ? "true"
            : params?.is_reconciled === false
              ? "false"
              : undefined,
        page: params?.page && params.page > 1 ? params.page : undefined,
      });
      const data = await apiGet<PaginatedResponse<LeaveRequest> | LeaveRequest[]>(
        `leave-requests${qs}`
      );
      return normalizeLeaveList(data);
    },
    enabled: options?.enabled ?? true,
  });
}

/** Server-paginated leave requests (DRF PageNumberPagination). */
export function useLeaveRequestsPage(
  params?: LeaveRequestListParams,
  options?: { enabled?: boolean }
) {
  const page = params?.page ?? 1;
  return useQuery<PaginatedResponse<LeaveRequest>>({
    queryKey: leaveKeys.requests({ ...params, page }),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const qs = buildQueryString({
        employee: params?.employee,
        status: params?.status,
        leave_type: params?.leave_type,
        exclude: params?.exclude,
        search: params?.search,
        is_reconciled:
          params?.is_reconciled === true
            ? "true"
            : params?.is_reconciled === false
              ? "false"
              : undefined,
        page: page > 1 ? page : undefined,
      });
      const data = await apiGet<PaginatedResponse<LeaveRequest> | LeaveRequest[]>(
        `leave-requests${qs}`
      );
      if (Array.isArray(data)) {
        return {
          count: data.length,
          next: null,
          previous: null,
          results: data,
        };
      }
      return data;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useEligibleRelievers(
  options?: { enabled?: boolean; leaveTypeId?: string }
) {
  const leaveTypeId = options?.leaveTypeId;
  return useQuery<EligibleRelieversResponse>({
    queryKey: leaveKeys.eligibleRelievers(leaveTypeId),
    queryFn: () =>
      apiGet<EligibleRelieversResponse>(
        `leave-requests/eligible-relievers/${leaveTypeId ? `?leave_type=${leaveTypeId}` : ""}`
      ),
    enabled: options?.enabled ?? true,
  });
}

export function useLeaveBalances(
  params?: LeaveBalanceListParams,
  options?: { enabled?: boolean }
) {
  return useQuery<LeaveBalance[]>({
    queryKey: leaveKeys.balances(params),
    queryFn: async () => {
      const qs = buildQueryString({
        employee: params?.employee,
        year: params?.year,
      });
      const data = await apiGet<PaginatedResponse<LeaveBalance> | LeaveBalance[]>(
        `leave-balances${qs}`
      );
      return normalizeBalanceList(data);
    },
    enabled: options?.enabled ?? true,
    retry: (failureCount, error) => {
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        (error as { status: number }).status === 403
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/** Paginated list of HR-reconciled leave requests. */
export function useReconciledLeaveRequestsPage(
  params?: Omit<LeaveRequestListParams, "is_reconciled">,
  options?: { enabled?: boolean }
) {
  return useLeaveRequestsPage({ ...params, is_reconciled: true }, options);
}

// ---------------------------------------------------------------------------
// Reconciliation mutations
// ---------------------------------------------------------------------------

export async function reconcileLeaveRequest(payload: LeaveReconcilePayload) {
  return apiPost<LeaveRequest>("leave-requests/reconcile/", payload);
}

export async function bulkReconcileLeave(payload: BulkReconcilePayload) {
  const res = await fetch("/api/proxy/leave-requests/bulk-reconcile/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = { detail: res.statusText || "Bulk reconcile failed." };
  }

  if (!res.ok && res.status !== 207) {
    throw new ApiError(res.status, data);
  }

  return data as BulkReconcileResponse;
}

export async function bulkReconcileLeaveCsv(formData: FormData) {
  const res = await fetch("/api/proxy/leave-requests/bulk-reconcile-csv/", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = { detail: res.statusText || "CSV upload failed." };
  }

  if (!res.ok && res.status !== 207) {
    throw new ApiError(res.status, data);
  }

  return data as BulkReconcileResponse;
}

export async function editReconciledLeave(
  id: string,
  payload: LeaveReconcileEditPayload
) {
  return apiPatch<LeaveRequest>(`leave-requests/${id}/`, payload);
}

export const LEAVE_ATTACHMENT_MAX_FILES = 5;
export const LEAVE_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;
export const LEAVE_ATTACHMENT_ACCEPT =
  ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";
export const RECONCILE_ATTACHMENT_OVERRIDE =
  "Supporting document uploaded with this reconciliation";

const LEAVE_ATTACHMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function filterLeaveAttachmentFiles(list: FileList | File[]): {
  files: File[];
  error: string | null;
} {
  const accepted: File[] = [];
  let error: string | null = null;
  for (const file of Array.from(list)) {
    const type = file.type === "image/jpg" ? "image/jpeg" : file.type;
    const nameOk = /\.(pdf|jpe?g|png|webp)$/i.test(file.name);
    if ((type && !LEAVE_ATTACHMENT_TYPES.has(type)) || (!type && !nameOk)) {
      error = "Only PDF, JPG, PNG, and WEBP files are allowed.";
      continue;
    }
    if (file.size > LEAVE_ATTACHMENT_MAX_BYTES) {
      error = "Each file must be 5 MB or smaller.";
      continue;
    }
    accepted.push(file);
  }
  if (accepted.length > LEAVE_ATTACHMENT_MAX_FILES) {
    error = "You can attach up to 5 files.";
  }
  return {
    files: accepted.slice(0, LEAVE_ATTACHMENT_MAX_FILES),
    error,
  };
}

export async function listLeaveAttachments(requestId: string) {
  const data = await apiGet<LeaveAttachment[] | { results: LeaveAttachment[] }>(
    `leave-requests/${requestId}/attachments/`
  );
  return Array.isArray(data) ? data : data.results ?? [];
}

export function useLeaveAttachments(requestId: string, enabled = true) {
  return useQuery<LeaveAttachment[]>({
    queryKey: leaveKeys.attachments(requestId),
    queryFn: () => listLeaveAttachments(requestId),
    enabled: !!requestId && enabled,
  });
}

export async function uploadLeaveAttachment(requestId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`/api/proxy/leave-requests/${requestId}/attachments/`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = { detail: res.statusText || "Upload failed." };
  }
  if (!res.ok) throw new ApiError(res.status, data);
  return data as LeaveAttachment;
}

export async function deleteLeaveAttachment(requestId: string, attachmentId: string) {
  return apiDelete<void>(
    `leave-requests/${requestId}/attachments/${attachmentId}/`
  );
}

function filenameFromDisposition(header: string | null, fallback: string) {
  if (!header) return fallback;
  const encoded = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (encoded?.[1]) {
    try {
      return decodeURIComponent(encoded[1]);
    } catch {
      return encoded[1];
    }
  }
  const plain = header.match(/filename="([^"]+)"/i);
  return plain?.[1] || fallback;
}

/**
 * View (inline) or download (attachment) a leave document.
 *
 * POST .../attachments/{id}/link/ returns one of:
 * - JSON `{ url, expires_in }` when the file is in S3. `expires_in` is 300.
 *   Open `url` in a new tab. The presigned URL does not need the app session.
 * - The file itself when storage is local. Auth is the `hrm_access` cookie:
 *   `/api/proxy` adds the bearer token. A new tab would GET this POST-only
 *   endpoint, so the client fetches the stream and opens a blob URL.
 */
export async function openLeaveAttachment(
  requestId: string,
  attachmentId: string,
  disposition: "inline" | "attachment",
  fallbackName = "attachment"
) {
  const res = await fetch(
    `/api/proxy/leave-requests/${requestId}/attachments/${attachmentId}/link/`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disposition }),
    }
  );
  if (!res.ok) {
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      data = { detail: res.statusText || "Could not open the document." };
    }
    throw new ApiError(res.status, data);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const data = (await res.json()) as { url?: string; expires_in?: number };
    if (!data.url) {
      throw new ApiError(res.status, { detail: "The document link was empty." });
    }
    window.open(data.url, "_blank", "noopener,noreferrer");
    return;
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const filename = filenameFromDisposition(
    res.headers.get("Content-Disposition"),
    fallbackName
  );
  if (disposition === "attachment") {
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
  } else {
    window.open(objectUrl, "_blank", "noopener,noreferrer");
  }
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export async function cancelLeaveRequest(id: string, comment?: string) {
  return apiPost<LeaveRequest>(
    `leave-requests/${id}/cancel/`,
    comment ? { comment } : undefined
  );
}

export function useReconcileLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reconcileLeaveRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leave-requests"] });
      qc.invalidateQueries({ queryKey: ["leave-balances"] });
    },
  });
}

export function useBulkReconcileLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bulkReconcileLeave,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leave-requests"] });
      qc.invalidateQueries({ queryKey: ["leave-balances"] });
    },
  });
}

export function useBulkReconcileLeaveCsv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bulkReconcileLeaveCsv,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leave-requests"] });
      qc.invalidateQueries({ queryKey: ["leave-balances"] });
    },
  });
}

export function useEditReconciledLeave(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LeaveReconcileEditPayload) =>
      editReconciledLeave(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leave-request", id] });
      qc.invalidateQueries({ queryKey: ["leave-request-logs", id] });
      qc.invalidateQueries({ queryKey: ["leave-requests"] });
      qc.invalidateQueries({ queryKey: ["leave-balances"] });
    },
  });
}

export function useBalanceTransactions(balanceId: string, enabled = true) {
  return useQuery<LeaveBalanceTransaction[]>({
    queryKey: leaveKeys.transactions(balanceId),
    queryFn: async () => {
      const data = await apiGet<
        PaginatedResponse<LeaveBalanceTransaction> | LeaveBalanceTransaction[]
      >(`leave-balances/${balanceId}/transactions/`);
      return Array.isArray(data) ? data : data.results ?? [];
    },
    enabled: !!balanceId && enabled,
  });
}

export function useAdjustLeaveBalance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { delta: string; reason: string; effective_date?: string };
    }) =>
      apiPost<{ balance: LeaveBalance; transaction: LeaveBalanceTransaction }>(
        `leave-balances/${id}/adjust/`,
        payload
      ),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["leave-balances"] });
      qc.invalidateQueries({ queryKey: leaveKeys.transactions(vars.id) });
    },
  });
}
