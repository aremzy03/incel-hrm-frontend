import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type {
  EmployeeLoanLedgerResponse,
  LoanApplication,
  LoanApplicationCreatePayload,
  LoanApplicationPatchPayload,
  LoanApprovalLog,
  LoanType,
  LoanRepaymentPaymentStatusPayload,
  LoanWorkflowCommentPayload,
  OutstandingLoansReportResponse,
  PaginatedLoanList,
  ScheduleSummaryReportResponse,
} from "@/lib/types/loan";
import type { PaginatedResponse } from "@/lib/types/leave";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export interface LoanApplicationListParams {
  employee?: string;
  status?: string;
  loan_type?: string;
}

export interface OutstandingLoansReportParams {
  loan_type?: string;
  employee?: string;
}

export const loanKeys = {
  all: ["loans"] as const,
  types: () => [...loanKeys.all, "types"] as const,
  list: (filters?: LoanApplicationListParams) =>
    [...loanKeys.all, "list", filters ?? {}] as const,
  detail: (id: string) => [...loanKeys.all, "detail", id] as const,
  logs: (id: string) => [...loanKeys.all, "logs", id] as const,
  reports: {
    all: () => [...loanKeys.all, "reports"] as const,
    outstanding: (filters?: OutstandingLoansReportParams) =>
      [...loanKeys.all, "reports", "outstanding", filters ?? {}] as const,
    scheduleSummary: () =>
      [...loanKeys.all, "reports", "schedule-summary"] as const,
    employeeLedger: (employeeId: string) =>
      [...loanKeys.all, "reports", "employee-ledger", employeeId] as const,
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildQueryString(
  params: Record<string, string | undefined>
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, value);
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function normalizeLoanList(
  data: PaginatedLoanList | LoanApplication[]
): LoanApplication[] {
  return Array.isArray(data) ? data : data.results ?? [];
}

function normalizeLoanTypes(
  data: LoanType[] | PaginatedResponse<LoanType>
): LoanType[] {
  return Array.isArray(data) ? data : data.results ?? [];
}

function invalidateLoanListsAndDetail(
  qc: ReturnType<typeof useQueryClient>,
  id: string
) {
  qc.invalidateQueries({ queryKey: loanKeys.detail(id) });
  qc.invalidateQueries({ queryKey: loanKeys.logs(id) });
  qc.invalidateQueries({ queryKey: loanKeys.all });
}

/**
 * Download a loan report CSV via the BFF proxy (`?format=csv`).
 * @param pathWithQuery — e.g. `loans/reports/outstanding/?format=csv&loan_type=...`
 */
export async function downloadLoanReportCsv(
  pathWithQuery: string
): Promise<void> {
  const path = pathWithQuery.replace(/^\//, "");
  const url = `/api/proxy/${path}`;
  const res = await fetch(url, { credentials: "include" });

  if (!res.ok) {
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      data = { detail: res.statusText || `Download failed (${res.status})` };
    }
    throw new ApiError(res.status, data);
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition");
  let filename = "loan-report.csv";
  const match = disposition?.match(/filename="([^"]+)"/);
  if (match?.[1]) filename = match[1];

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useLoanTypes() {
  return useQuery<LoanType[]>({
    queryKey: loanKeys.types(),
    queryFn: async () => {
      const data = await apiGet<LoanType[] | PaginatedResponse<LoanType>>(
        "loan-types/"
      );
      return normalizeLoanTypes(data);
    },
  });
}

export function useLoanApplications(params?: LoanApplicationListParams) {
  return useQuery<LoanApplication[]>({
    queryKey: loanKeys.list(params),
    queryFn: async () => {
      const qs = buildQueryString({
        employee: params?.employee,
        status: params?.status,
        loan_type: params?.loan_type,
      });
      const data = await apiGet<PaginatedLoanList | LoanApplication[]>(
        `loan-applications/${qs}`
      );
      return normalizeLoanList(data);
    },
  });
}

export function useLoanApplication(id: string) {
  return useQuery<LoanApplication>({
    queryKey: loanKeys.detail(id),
    queryFn: () => apiGet<LoanApplication>(`loan-applications/${id}/`),
    enabled: !!id,
  });
}

export function useLoanLogs(
  id: string,
  options?: { enabled?: boolean }
) {
  return useQuery<LoanApprovalLog[]>({
    queryKey: loanKeys.logs(id),
    queryFn: () =>
      apiGet<LoanApprovalLog[]>(`loan-applications/${id}/logs/`),
    enabled: !!id && (options?.enabled ?? true),
  });
}

export function useOutstandingLoansReport(
  params?: OutstandingLoansReportParams,
  options?: { enabled?: boolean }
) {
  return useQuery<OutstandingLoansReportResponse>({
    queryKey: loanKeys.reports.outstanding(params),
    queryFn: async () => {
      const qs = buildQueryString({
        loan_type: params?.loan_type,
        employee: params?.employee,
      });
      return apiGet<OutstandingLoansReportResponse>(
        `loans/reports/outstanding/${qs}`
      );
    },
    enabled: options?.enabled ?? true,
  });
}

export function useScheduleSummaryReport(options?: { enabled?: boolean }) {
  return useQuery<ScheduleSummaryReportResponse>({
    queryKey: loanKeys.reports.scheduleSummary(),
    queryFn: () =>
      apiGet<ScheduleSummaryReportResponse>(
        "loans/reports/schedule-summary/"
      ),
    enabled: options?.enabled ?? true,
  });
}

export function useEmployeeLedgerReport(
  employeeId: string,
  options?: { enabled?: boolean }
) {
  return useQuery<EmployeeLoanLedgerResponse>({
    queryKey: loanKeys.reports.employeeLedger(employeeId),
    queryFn: () =>
      apiGet<EmployeeLoanLedgerResponse>(
        `loans/reports/employee-ledger/${employeeId}/`
      ),
    enabled: !!employeeId && (options?.enabled ?? true),
  });
}

// ---------------------------------------------------------------------------
// Mutations (no DELETE — backend returns 405)
// ---------------------------------------------------------------------------

export function useCreateLoanApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LoanApplicationCreatePayload) =>
      apiPost<LoanApplication>("loan-applications/", payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: loanKeys.all });
      qc.setQueryData(loanKeys.detail(data.id), data);
    },
  });
}

export function usePatchLoanApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: LoanApplicationPatchPayload;
    }) => apiPatch<LoanApplication>(`loan-applications/${id}/`, payload),
    onSuccess: (data, { id }) => {
      qc.setQueryData(loanKeys.detail(id), data);
      invalidateLoanListsAndDetail(qc, id);
    },
  });
}

export function useSubmitLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPost<LoanApplication>(`loan-applications/${id}/submit/`, {}),
    onSuccess: (data, id) => {
      qc.setQueryData(loanKeys.detail(id), data);
      invalidateLoanListsAndDetail(qc, id);
    },
  });
}

export function useApproveLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: { id: string } & LoanWorkflowCommentPayload) =>
      apiPost<LoanApplication>(
        `loan-applications/${id}/approve/`,
        body.comment ? { comment: body.comment } : {}
      ),
    onSuccess: (data, { id }) => {
      qc.setQueryData(loanKeys.detail(id), data);
      invalidateLoanListsAndDetail(qc, id);
    },
  });
}

export function useRejectLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      comment,
    }: {
      id: string;
      comment: string;
    }) => {
      const trimmed = comment.trim();
      if (!trimmed) {
        throw new Error("A comment is required when rejecting a loan.");
      }
      return apiPost<LoanApplication>(`loan-applications/${id}/reject/`, {
        comment: trimmed,
      });
    },
    onSuccess: (data, { id }) => {
      qc.setQueryData(loanKeys.detail(id), data);
      invalidateLoanListsAndDetail(qc, id);
    },
  });
}

export function useDisburseLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: { id: string } & LoanWorkflowCommentPayload) =>
      apiPost<LoanApplication>(
        `loan-applications/${id}/disburse/`,
        body.comment ? { comment: body.comment } : {}
      ),
    onSuccess: (data, { id }) => {
      qc.setQueryData(loanKeys.detail(id), data);
      invalidateLoanListsAndDetail(qc, id);
    },
  });
}

export function useLiquidateLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: { id: string } & LoanWorkflowCommentPayload) =>
      apiPost<LoanApplication>(
        `loan-applications/${id}/liquidate/`,
        body.comment ? { comment: body.comment } : {}
      ),
    onSuccess: (data, { id }) => {
      qc.setQueryData(loanKeys.detail(id), data);
      invalidateLoanListsAndDetail(qc, id);
    },
  });
}

export function useHandleResignationLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: { id: string } & LoanWorkflowCommentPayload) =>
      apiPost<LoanApplication>(
        `loan-applications/${id}/handle-resignation/`,
        body.comment ? { comment: body.comment } : {}
      ),
    onSuccess: (data, { id }) => {
      qc.setQueryData(loanKeys.detail(id), data);
      invalidateLoanListsAndDetail(qc, id);
    },
  });
}

export function useUpdateRepaymentPaymentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanId,
      scheduleId,
      ...body
    }: { loanId: string; scheduleId: string } & LoanRepaymentPaymentStatusPayload) =>
      apiPatch<LoanApplication>(
        `loan-applications/${loanId}/repayment-schedule/${scheduleId}/`,
        body
      ),
    onSuccess: (data, { loanId }) => {
      qc.setQueryData(loanKeys.detail(loanId), data);
      invalidateLoanListsAndDetail(qc, loanId);
    },
  });
}
