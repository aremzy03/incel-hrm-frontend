import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "@/lib/api-client";
import type { UserPersonnel, UserPersonnelPatch } from "@/lib/types/personnel";

const USERS_KEY = ["users"];

export function personnelKey(userId: string) {
  return ["personnel", userId] as const;
}

export function usePersonnel(userId: string) {
  return useQuery<UserPersonnel>({
    queryKey: personnelKey(userId),
    queryFn: () => apiGet<UserPersonnel>(`users/${userId}/personnel/`),
    enabled: !!userId,
  });
}

export function useUpdatePersonnel(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserPersonnelPatch) =>
      apiPatch<UserPersonnel>(`users/${userId}/personnel/`, payload),
    onSuccess: (data) => {
      qc.setQueryData(personnelKey(userId), data);
      qc.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}
