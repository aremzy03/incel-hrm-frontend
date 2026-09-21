import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { buildQueryString } from "@/lib/api/leave-helpers";

export async function downloadLeaveReportCsv(
  kind: "utilization" | "who-is-out" | "liability",
  params: Record<string, string | number | undefined>
) {
  const qs = buildQueryString({ ...params, export: "csv" });
  const res = await fetch(`/api/proxy/leave-reports/${kind}/${qs}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Could not download ${kind} report`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leave-${kind}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function useLeaveReportJson<T>(
  kind: "utilization" | "who-is-out" | "liability",
  params: Record<string, string | number | undefined>,
  enabled = true
) {
  return useQuery<T>({
    queryKey: ["leave-reports", kind, params],
    queryFn: () =>
      apiGet<T>(`leave-reports/${kind}/${buildQueryString(params)}`),
    enabled,
  });
}
