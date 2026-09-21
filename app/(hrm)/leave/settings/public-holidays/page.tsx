"use client";

import { useMemo, useState } from "react";
import { UploadCloud, Loader2, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { stitchCardClass } from "@/lib/design/field-styles";
import { uploadPublicHolidaysCsv } from "@/lib/api/public-holidays";

export default function LeavePublicHolidaysPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fileName = useMemo(() => file?.name ?? "", [file]);

  async function onUpload() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const r = await uploadPublicHolidaysCsv(file);
      setResult((r ?? {}) as Record<string, unknown>);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Public holidays"
        subtitle="Upload a CSV to create or update public holidays for highlighting and working-day calculations."
      />

      <div className={`${stitchCardClass} p-6`} data-tour="leave-holidays-upload">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Upload holidays CSV</p>
          <p className="text-xs text-muted-foreground">
            Format: <span className="font-mono">name,date</span> (YYYY-MM-DD)
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground transition hover:bg-muted/40">
            <span className="truncate">{fileName ? fileName : "Choose holidays.csv"}</span>
            <UploadCloud className="h-4 w-4 text-muted-foreground" aria-hidden />
            <input
              type="file"
              accept=".csv"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <button
            type="button"
            onClick={onUpload}
            disabled={!file || busy}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Upload
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-200">
            <div className="flex items-start gap-2.5">
              <CheckCircle className="mt-0.5 h-4 w-4" aria-hidden />
              <div className="min-w-0">
                <p className="font-medium text-foreground">Upload complete</p>
                <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-black/5 p-3 text-[11px] leading-relaxed text-foreground dark:bg-white/5">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        data-tour="leave-holidays-list"
        className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground"
      >
        Uploaded holidays are used in leave date pickers and working-day calculations for the selected year.
      </div>
    </div>
  );
}
