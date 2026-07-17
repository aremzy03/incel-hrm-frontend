import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type {
  EligibleRelieversResponse,
  LeaveBalance,
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
  page?: number;
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
  logs: (id: string) => ["leave-request-logs", id] as const,
  balances: (filters?: LeaveBalanceListParams) =>
    ["leave-balances", filters ?? {}] as const,
  eligibleRelievers: ["leave-eligible-relievers"] as const,
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
    queryFn: async () => {
      const qs = buildQueryString({
        employee: params?.employee,
        status: params?.status,
        leave_type: params?.leave_type,
        exclude: params?.exclude,
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

export function useEligibleRelievers(options?: { enabled?: boolean }) {
  return useQuery<EligibleRelieversResponse>({
    queryKey: leaveKeys.eligibleRelievers,
    queryFn: () =>
      apiGet<EligibleRelieversResponse>("leave-requests/eligible-relievers/"),
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
