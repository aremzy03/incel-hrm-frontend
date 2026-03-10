import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/api-client";
import type {
  LeaveType,
  LeaveTypeCreatePayload,
  LeaveTypeUpdatePayload,
  PaginatedResponse,
} from "@/lib/types/leave";

const LEAVE_TYPES_KEY = ["leave-types"];

export function useLeaveTypes() {
  return useQuery<LeaveType[]>({
    queryKey: LEAVE_TYPES_KEY,
    queryFn: async () => {
      const data = await apiGet<LeaveType[] | PaginatedResponse<LeaveType>>(
        "leave-types"
      );
      return Array.isArray(data) ? data : data?.results ?? [];
    },
  });
}

export function useCreateLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LeaveTypeCreatePayload) =>
      apiPost<LeaveType>("leave-types", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LEAVE_TYPES_KEY });
      qc.invalidateQueries({ queryKey: ["leave-balances"] });
    },
  });
}

export function useUpdateLeaveType(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LeaveTypeUpdatePayload) =>
      apiPatch<LeaveType>(`leave-types/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LEAVE_TYPES_KEY });
      qc.invalidateQueries({ queryKey: ["leave-balances"] });
    },
  });
}

export function useDeleteLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`leave-types/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LEAVE_TYPES_KEY });
      qc.invalidateQueries({ queryKey: ["leave-balances"] });
    },
  });
}
