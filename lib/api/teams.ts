import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type {
  BulkMembershipRequest,
  BulkMembershipRemoveRequest,
  BulkMembershipResponse,
  LineManagerPayload,
  PaginatedResponse,
  Team,
  TeamCreatePayload,
  TeamUpdatePayload,
  TeamUserActionPayload,
} from "@/lib/types/auth";

function asArray<T>(data: T[] | PaginatedResponse<T> | null | undefined): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data?.results ?? [];
}

export function useTeams(unitId: string) {
  return useQuery<Team[]>({
    queryKey: ["teams", unitId],
    queryFn: async () => {
      const data = await apiGet<Team[] | PaginatedResponse<Team>>(`teams/?unit=${unitId}`);
      return asArray(data);
    },
    enabled: !!unitId,
  });
}

export function useTeam(id: string) {
  return useQuery<Team>({
    queryKey: ["team", id],
    queryFn: () => apiGet<Team>(`teams/${id}/`),
    enabled: !!id,
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TeamCreatePayload) => apiPost<Team>("teams/", payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["teams", variables.unit_id] });
      qc.invalidateQueries({ queryKey: ["unit-detail", variables.unit_id] });
    },
  });
}

export function useUpdateTeam(unitId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, payload }: { teamId: string; payload: TeamUpdatePayload }) =>
      apiPatch<Team>(`teams/${teamId}/`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams", unitId] });
      qc.invalidateQueries({ queryKey: ["team"] });
      qc.invalidateQueries({ queryKey: ["unit-detail", unitId] });
    },
  });
}

export function useDeleteTeam(unitId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (teamId: string) => apiDelete<void>(`teams/${teamId}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams", unitId] });
      qc.invalidateQueries({ queryKey: ["unit-detail", unitId] });
    },
  });
}

export function useAddTeamMember(unitId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, payload }: { teamId: string; payload: TeamUserActionPayload }) =>
      apiPost<Team>(`teams/${teamId}/add-member/`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams", unitId] });
      qc.invalidateQueries({ queryKey: ["team"] });
      qc.invalidateQueries({ queryKey: ["unit-detail", unitId] });
    },
  });
}

export function useRemoveTeamMember(unitId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, payload }: { teamId: string; payload: TeamUserActionPayload }) =>
      apiPost<Team>(`teams/${teamId}/remove-member/`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams", unitId] });
      qc.invalidateQueries({ queryKey: ["team"] });
      qc.invalidateQueries({ queryKey: ["unit-detail", unitId] });
    },
  });
}

export function useSetTeamLead(unitId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, payload }: { teamId: string; payload: LineManagerPayload }) =>
      apiPost<void>(`teams/${teamId}/team-lead/`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams", unitId] });
      qc.invalidateQueries({ queryKey: ["team"] });
      qc.invalidateQueries({ queryKey: ["unit-detail", unitId] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useClearTeamLead(unitId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId }: { teamId: string }) =>
      apiDelete<void>(`teams/${teamId}/team-lead/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams", unitId] });
      qc.invalidateQueries({ queryKey: ["team"] });
      qc.invalidateQueries({ queryKey: ["unit-detail", unitId] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useBulkAddTeamMembers(unitId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, payload }: { teamId: string; payload: BulkMembershipRequest }) =>
      apiPost<BulkMembershipResponse>(`teams/${teamId}/bulk-add-members/`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams", unitId] });
      qc.invalidateQueries({ queryKey: ["team"] });
      qc.invalidateQueries({ queryKey: ["unit-detail", unitId] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useBulkRemoveTeamMembers(unitId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, payload }: { teamId: string; payload: BulkMembershipRemoveRequest }) =>
      apiPost<BulkMembershipResponse>(`teams/${teamId}/bulk-remove-members/`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams", unitId] });
      qc.invalidateQueries({ queryKey: ["team"] });
      qc.invalidateQueries({ queryKey: ["unit-detail", unitId] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

