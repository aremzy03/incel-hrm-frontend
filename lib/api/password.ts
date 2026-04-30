import { useMutation } from "@tanstack/react-query";
import { apiPost } from "@/lib/api-client";
import type { PasswordChangePayload, PasswordResetPayload } from "@/lib/types/auth";

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: PasswordChangePayload) =>
      apiPost<void>("auth/password/change/", payload),
  });
}

export function useResetUserPassword(userId: string) {
  return useMutation({
    mutationFn: (payload: PasswordResetPayload) =>
      apiPost<void>(`users/${userId}/password/reset/`, payload),
  });
}

