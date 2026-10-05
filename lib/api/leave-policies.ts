import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { asList } from "@/lib/api/leave-helpers";
import type {
  AccrualPreviewResponse,
  LeavePolicy,
  LeavePolicyWritePayload,
  LeaveSettingsAuditLog,
  PaginatedResponse,
  PolicyImpactPreview,
} from "@/lib/types/leave";

const POLICIES_KEY = ["leave-policies"];

export function useLeavePolicies() {
  return useQuery<LeavePolicy[]>({
    queryKey: POLICIES_KEY,
    queryFn: async () => {
      const data = await apiGet<LeavePolicy[] | PaginatedResponse<LeavePolicy>>(
        "leave-policies"
      );
      return asList(data);
    },
  });
}

export function useLeavePolicy(id: string) {
  return useQuery<LeavePolicy>({
    queryKey: [...POLICIES_KEY, id],
    queryFn: () => apiGet<LeavePolicy>(`leave-policies/${id}`),
    enabled: !!id,
  });
}

export function usePolicyAuditLog(id: string, enabled = true) {
  return useQuery<LeaveSettingsAuditLog[]>({
    queryKey: [...POLICIES_KEY, id, "audit"],
    queryFn: async () => {
      const data = await apiGet<
        LeaveSettingsAuditLog[] | PaginatedResponse<LeaveSettingsAuditLog>
      >(`leave-policies/${id}/audit-log/`);
      return asList(data);
    },
    enabled: !!id && enabled,
  });
}

export function usePolicyImpactPreview(id: string, date?: string, enabled = false) {
  return useQuery<PolicyImpactPreview>({
    queryKey: [...POLICIES_KEY, id, "impact", date ?? ""],
    queryFn: () =>
      apiGet<PolicyImpactPreview>(
        `leave-policies/${id}/impact-preview/${date ? `?date=${date}` : ""}`
      ),
    enabled: !!id && enabled,
  });
}

function invalidatePolicies(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: POLICIES_KEY });
}

export function useCreateLeavePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LeavePolicyWritePayload) =>
      apiPost<LeavePolicy>("leave-policies", payload),
    onSuccess: () => invalidatePolicies(qc),
  });
}

export function useUpdateLeavePolicy(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LeavePolicyWritePayload) =>
      apiPatch<LeavePolicy>(`leave-policies/${id}`, payload),
    onSuccess: () => invalidatePolicies(qc),
  });
}

export function useDeleteLeavePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`leave-policies/${id}`),
    onSuccess: () => invalidatePolicies(qc),
  });
}

export function usePublishLeavePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      reason,
      keep_existing_active,
    }: {
      id: string;
      reason: string;
      keep_existing_active?: boolean;
    }) =>
      apiPost<LeavePolicy>(`leave-policies/${id}/publish/`, {
        reason,
        keep_existing_active: keep_existing_active ?? false,
      }),
    onSuccess: () => invalidatePolicies(qc),
  });
}

export function useArchiveLeavePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiPost<LeavePolicy>(`leave-policies/${id}/archive/`, reason ? { reason } : undefined),
    onSuccess: () => invalidatePolicies(qc),
  });
}

export function useCloneLeavePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiPost<LeavePolicy>(`leave-policies/${id}/clone/`, reason ? { reason } : undefined),
    onSuccess: () => invalidatePolicies(qc),
  });
}

export function useAccrualPreview() {
  return useMutation({
    mutationFn: (payload: {
      year: number;
      as_of?: string;
      include_rollover?: boolean;
      include_monthly?: boolean;
      include_weekly?: boolean;
      include_anniversary?: boolean;
      include_carry_expiry?: boolean;
    }) => apiPost<AccrualPreviewResponse>("leave-accrual/preview/", payload),
  });
}
