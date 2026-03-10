import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/api-client";
import type { Role, RolePayload, PaginatedResponse } from "@/lib/types/auth";

const ROLES_KEY = ["roles"];

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useRoles() {
  return useQuery<PaginatedResponse<Role>>({
    queryKey: ROLES_KEY,
    queryFn: () => apiGet<PaginatedResponse<Role>>("roles/"),
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RolePayload) => apiPost<Role>("roles/", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROLES_KEY }),
  });
}

export function useUpdateRole(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RolePayload) =>
      apiPatch<Role>(`roles/${id}/`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROLES_KEY }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`roles/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROLES_KEY }),
  });
}
