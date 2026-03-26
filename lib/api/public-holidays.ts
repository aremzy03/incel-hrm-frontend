import { apiGet } from "@/lib/api-client";
import type {
  PublicHoliday,
  PublicHolidayUploadResponse,
} from "@/lib/types/public-holidays";

type Paginated<T> = { results: T[] } & Record<string, unknown>;

export async function listPublicHolidays(year?: number) {
  const q = typeof year === "number" ? `?year=${year}` : "";
  return apiGet<PublicHoliday[] | Paginated<PublicHoliday>>(`public-holidays/${q}`);
}

export async function uploadPublicHolidaysCsv(file: File) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/proxy/public-holidays/upload/", {
    method: "POST",
    credentials: "include",
    body: form,
  });

  const data = (await res.json().catch(() => ({}))) as PublicHolidayUploadResponse;
  if (!res.ok) {
    const msg =
      typeof (data as { detail?: unknown })?.detail === "string"
        ? ((data as { detail: string }).detail as string)
        : "Failed to upload holidays CSV.";
    throw new Error(msg);
  }
  return data;
}

