"use client";

import { useId, useMemo, useState } from "react";
import { UploadCloud, Loader2, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { DataTable } from "@/components/hrm/ui/DataTable";
import { FieldLabel } from "@/components/hrm/forms/FieldLabel";
import { Button } from "@/components/ui/button";
import { SettingsLiveRegion, SettingsQueryPanel } from "@/components/hrm/leave/SettingsDialog";
import { stitchCardClass, stitchSelectClass } from "@/lib/design/field-styles";
import { uploadPublicHolidaysCsv, usePublicHolidays } from "@/lib/api/public-holidays";
import { formatIsoDate, mutationErrorMessage } from "@/lib/leave/settings-labels";
import { cn } from "@/lib/utils";

const TABLE_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "date", label: "Date" },
  { key: "repeat", label: "Repeats" },
];

function summarizeUpload(result: Record<string, unknown>): string {
  const created = Number(result.created ?? result.created_count ?? result.inserted ?? 0);
  const updated = Number(result.updated ?? result.updated_count ?? 0);
  const skipped = Number(result.skipped ?? result.skipped_count ?? 0);
  const errors = Number(
    result.error_count ??
      (Array.isArray(result.errors) ? result.errors.length : 0)
  );
  const parts: string[] = [];
  if (created) parts.push(`${created} added`);
  if (updated) parts.push(`${updated} updated`);
  if (skipped) parts.push(`${skipped} skipped`);
  if (errors) parts.push(`${errors} could not be imported`);
  if (parts.length === 0) return "Upload complete.";
  return parts.join(" · ");
}

export default function LeavePublicHolidaysPage() {
  const formId = useId();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { data: holidays = [], isLoading, isError, refetch } = usePublicHolidays(year);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");

  const fileName = useMemo(() => file?.name ?? "", [file]);
  const years = [currentYear - 1, currentYear, currentYear + 1];

  async function onUpload() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const r = await uploadPublicHolidaysCsv(file);
      const payload = (r ?? {}) as Record<string, unknown>;
      setResult(payload);
      const summary = summarizeUpload(payload);
      setLiveMessage(summary);
      await refetch();
    } catch (e) {
      setError(mutationErrorMessage(e, "Could not upload this CSV. Check the format and try again."));
    } finally {
      setBusy(false);
    }
  }

  const emptyMessage = `No public holidays loaded for ${year} yet. Upload a CSV to add them.`;

  const table = (
    <DataTable
      columns={TABLE_COLUMNS}
      emptyMessage={emptyMessage}
      className={holidays.length > 0 ? "rounded-none border-0 [box-shadow:none]" : undefined}
      getRowLabel={(i) => holidays[i]?.name}
      rows={holidays.map((h) => ({
        name: <span className="font-medium text-on-surface">{h.name}</span>,
        date: formatIsoDate(h.date),
        repeat: h.is_recurring ? "Every year" : "This date only",
      }))}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        className="mb-0"
        title="Public holidays"
        subtitle="Upload a CSV to create or update public holidays used in date pickers and working-day counts."
      />

      <div className={`${stitchCardClass} p-6`} data-tour="leave-holidays-upload">
        <div className="space-y-2">
          <p className="text-title-sm font-semibold text-on-surface">Upload holidays CSV</p>
          <p className="text-body-md text-on-surface-variant">
            Format: <span className="font-data-table text-data-table">name,date</span> (YYYY-MM-DD)
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <FieldLabel htmlFor={`${formId}-file`}>CSV file</FieldLabel>
            <label
              htmlFor={`${formId}-file`}
              className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl bg-surface-container-low px-4 py-3 text-body-md text-on-surface transition hover:bg-surface-container-high"
            >
              <span className="truncate">{fileName || "Choose holidays.csv"}</span>
              <UploadCloud className="h-4 w-4 text-on-surface-variant" aria-hidden />
            </label>
            <input
              id={`${formId}-file`}
              type="file"
              accept=".csv"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <Button
            type="button"
            size="lg"
            className="min-h-11 rounded-xl px-6"
            onClick={() => void onUpload()}
            disabled={!file || busy}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Upload
          </Button>
        </div>

        {error ? (
          <div
            className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-body-md text-destructive"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {result ? (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-body-md text-green-800">
            <div className="flex items-start gap-2.5">
              <CheckCircle className="mt-0.5 h-4 w-4" aria-hidden />
              <div>
                <p className="font-medium text-on-surface">Upload complete</p>
                <p className="mt-1 text-on-surface-variant">{summarizeUpload(result)}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <section className="space-y-3" aria-labelledby="holidays-list-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="holidays-list-heading" className="text-title-sm font-semibold text-on-surface">
            Holidays in {year}
          </h2>
          <div className="sm:w-48">
            <FieldLabel htmlFor={`${formId}-year`}>Year</FieldLabel>
            <select
              id={`${formId}-year`}
              className={stitchSelectClass}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div data-tour="leave-holidays-list">
          <SettingsQueryPanel
            isLoading={isLoading}
            isError={isError}
            onRetry={() => void refetch()}
            errorTitle="Could not load public holidays."
            errorHint="Check your connection and try again. An upload still updates the server."
          >
            {holidays.length > 0 ? (
              <div className={cn(stitchCardClass, "overflow-hidden")}>
                <div className="hidden md:block">{table}</div>
                <ul className="divide-y divide-outline-variant md:hidden">
                  {holidays.map((h) => (
                    <li key={h.id} className="px-4 py-4">
                      <p className="font-medium text-on-surface">{h.name}</p>
                      <p className="mt-1 text-body-md text-on-surface-variant">
                        {formatIsoDate(h.date)}
                        {h.is_recurring ? " · Repeats every year" : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <>
                <div className="hidden md:block">{table}</div>
                <div
                  className={cn(
                    stitchCardClass,
                    "px-6 py-10 text-center text-body-md text-on-surface-variant md:hidden"
                  )}
                >
                  {emptyMessage}
                </div>
              </>
            )}
          </SettingsQueryPanel>
        </div>
      </section>

      <SettingsLiveRegion
        message={
          isError
            ? "Could not load public holidays."
            : `${liveMessage} ${holidays.length} holidays for ${year}.`
        }
      />
    </div>
  );
}
