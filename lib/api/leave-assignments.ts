import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { asList, buildQueryString } from "@/lib/api/leave-helpers";
import type {
  LeavePolicyAssignment,
  PaginatedResponse,
  PolicyResolution,
} from "@/lib/types/leave";

const ASSIGN_KEY = ["leave-policy-assignments"];

export function useLeavePolicyAssignments(filters?: {
  leave_type?: string;
  policy?: string;
  scope_type?: string;
  is_active?: boolean;
}) {
  return useQuery<LeavePolicyAssignment[]>({
    queryKey: [...ASSIGN_KEY, filters ?? {}],
    queryFn: async () => {
      const qs = buildQueryString({
        leave_type: filters?.leave_type,
        policy: filters?.policy,
        scope_type: filters?.scope_type,
        is_active:
          filters?.is_active === undefined ? undefined : String(filters.is_active),
      });
      const data = await apiGet<
        LeavePolicyAssignment[] | PaginatedResponse<LeavePolicyAssignment>
      >(`leave-policy-assignments${qs}`);
      return asList(data);
    },
  });
}

export function useLeavePolicyResolution(
  params: { employee?: string; leave_type: string; date?: string },
  options?: { enabled?: boolean }
) {
  return useQuery<PolicyResolution>({
    queryKey: ["leave-policy-resolution", params],
    queryFn: () =>
      apiGet<PolicyResolution>(
        `leave-policy-resolution/${buildQueryString({
          employee: params.employee,
          leave_type: params.leave_type,
          date: params.date,
        })}`
      ),
    enabled: (options?.enabled ?? true) && !!params.leave_type,
  });
}

export function useCreatePolicyAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<LeavePolicyAssignment> & { reason?: string }) =>
      apiPost<LeavePolicyAssignment>("leave-policy-assignments", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ASSIGN_KEY }),
  });
}

export function useUpdatePolicyAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<LeavePolicyAssignment> & { reason?: string };
    }) => apiPatch<LeavePolicyAssignment>(`leave-policy-assignments/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ASSIGN_KEY }),
  });
}

export function useDeletePolicyAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`leave-policy-assignments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ASSIGN_KEY }),
  });
}
