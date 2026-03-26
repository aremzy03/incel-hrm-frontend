import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "@/lib/api-client";
import type { User, ProfileUpdatePayload } from "@/lib/types/auth";

const PROFILE_KEY = ["auth", "profile"];

export function useProfile() {
  return useQuery<User>({
    queryKey: PROFILE_KEY,
    queryFn: () => apiGet<User>("auth/profile"),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProfileUpdatePayload) =>
      apiPatch<User>("auth/profile", payload),
    onSuccess: (data) => {
      qc.setQueryData(PROFILE_KEY, data);
    },
  });
}
