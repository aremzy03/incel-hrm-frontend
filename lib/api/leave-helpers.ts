import type { PaginatedResponse } from "@/lib/types/leave";

export function asList<T>(data: T[] | PaginatedResponse<T> | null | undefined): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.results ?? [];
}

export function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
