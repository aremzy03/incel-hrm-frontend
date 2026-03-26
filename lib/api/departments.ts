import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/api-client";
import type {
  Department,
  DepartmentDetailResponse,
  DepartmentPayload,
  LineManagerPayload,
  PaginatedResponse,
  User,
} from "@/lib/types/auth";

const DEPTS_KEY = ["departments"];

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useDepartments() {
  return useQuery<PaginatedResponse<Department>>({
    queryKey: DEPTS_KEY,
    queryFn: () => apiGet<PaginatedResponse<Department>>("departments/"),
  });
}

export function useDepartmentMembers(deptId: string) {
  return useQuery<User[]>({
    queryKey: ["department-members", deptId],
    queryFn: async () => {
      const data = await apiGet<User[] | PaginatedResponse<User>>(
        `departments/${deptId}/members/`
      );
      return Array.isArray(data) ? data : data?.results ?? [];
    },
    enabled: !!deptId,
  });
}

export function useDepartmentDetail(deptId: string) {
  return useQuery<DepartmentDetailResponse>({
    queryKey: ["department-detail", deptId],
    queryFn: () =>
      apiGet<DepartmentDetailResponse>(`departments/${deptId}/detail`),
    enabled: !!deptId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DepartmentPayload) =>
      apiPost<Department>("departments/", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: DEPTS_KEY }),
  });
}

export function useUpdateDepartment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DepartmentPayload) =>
      apiPatch<Department>(`departments/${id}/`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: DEPTS_KEY }),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`departments/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: DEPTS_KEY }),
  });
}

export function useAssignLineManager(deptId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LineManagerPayload) =>
      apiPost<void>(`departments/${deptId}/line-manager/`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: DEPTS_KEY }),
  });
}

export function useRemoveLineManager(deptId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiDelete<void>(`departments/${deptId}/line-manager/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: DEPTS_KEY }),
  });
}
