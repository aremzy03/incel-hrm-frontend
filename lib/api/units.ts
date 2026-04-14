import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/api-client";
import type {
  BulkMembershipRequest,
  BulkMembershipRemoveRequest,
  BulkMembershipResponse,
  Unit,
  UnitCreatePayload,
  UnitDetail,
  UnitUpdatePayload,
  PaginatedResponse,
} from "@/lib/types/auth";

export function useUnits(departmentId: string) {
  return useQuery<Unit[]>({
    queryKey: ["units", departmentId],
    queryFn: async () => {
      const data = await apiGet<Unit[] | PaginatedResponse<Unit>>(
        `units/?department=${departmentId}`
      );
      return Array.isArray(data) ? data : data?.results ?? [];
    },
    enabled: !!departmentId,
  });
}

export function useUnitDetail(unitId: string) {
  return useQuery<UnitDetail>({
    queryKey: ["unit-detail", unitId],
    queryFn: () => apiGet<UnitDetail>(`units/${unitId}`),
    enabled: !!unitId,
  });
}

export function useCreateUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UnitCreatePayload) =>
      apiPost<Unit>("units/", payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["units", variables.department_id] });
      qc.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useUpdateUnit(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UnitUpdatePayload) =>
      apiPatch<Unit>(`units/${id}/`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["units"] });
      qc.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useDeleteUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`units/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["units"] });
      qc.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useBulkAddUnitMembers(unitId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkMembershipRequest) =>
      apiPost<BulkMembershipResponse>(`units/${unitId}/bulk-add-members/`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unit-detail", unitId] });
      qc.invalidateQueries({ queryKey: ["department-detail"] });
      qc.invalidateQueries({ queryKey: ["department-members"] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useBulkAddMembersToUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ unitId, payload }: { unitId: string; payload: BulkMembershipRequest }) =>
      apiPost<BulkMembershipResponse>(`units/${unitId}/bulk-add-members/`, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["unit-detail", variables.unitId] });
      qc.invalidateQueries({ queryKey: ["department-detail"] });
      qc.invalidateQueries({ queryKey: ["department-members"] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useBulkRemoveUnitMembers(unitId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkMembershipRemoveRequest) =>
      apiPost<BulkMembershipResponse>(`units/${unitId}/bulk-remove-members/`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unit-detail", unitId] });
      qc.invalidateQueries({ queryKey: ["department-detail"] });
      qc.invalidateQueries({ queryKey: ["department-members"] });
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["teams", unitId] });
    },
  });
}
