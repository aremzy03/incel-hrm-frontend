import { ApiError } from "@/lib/api-client";

export function getLoanApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback;
  if (err instanceof Error) return err.message;
  return fallback;
}
