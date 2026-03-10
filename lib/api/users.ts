import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/api-client";
import type {
  User,
  UserCreatePayload,
  UserUpdatePayload,
  RoleAssignPayload,
  DepartmentChangePayload,
  PaginatedResponse,
} from "@/lib/types/auth";

const USERS_KEY = ["users"];

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useUsers() {
  return useQuery<PaginatedResponse<User>>({
    queryKey: USERS_KEY,
    queryFn: () => apiGet<PaginatedResponse<User>>("users/"),
  });
}

export function useUser(id: string) {
  return useQuery<User>({
    queryKey: [...USERS_KEY, id],
    queryFn: () => apiGet<User>(`users/${id}/`),
    enabled: !!id,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserCreatePayload) =>
      apiPost<User>("users/", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserUpdatePayload) =>
      apiPatch<User>(`users/${id}/`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`users/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

export function useAssignRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: RoleAssignPayload }) =>
      apiPost<void>(`users/${userId}/roles/`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

export function useRemoveRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      apiDelete<void>(`users/${userId}/roles/${roleId}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

export function useChangeUserDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: DepartmentChangePayload;
    }) => apiPatch<User>(`users/${userId}/department/`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
}
