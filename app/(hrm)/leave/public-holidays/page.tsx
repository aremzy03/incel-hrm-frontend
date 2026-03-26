"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { UploadCloud, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/hrm/ui/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { hasRole } from "@/lib/rbac";
import { uploadPublicHolidaysCsv } from "@/lib/api/public-holidays";

export default function LeavePublicHolidaysPage() {
  const { user } = useAuth();
  const canAccess = hasRole(user, "HR", "EXECUTIVE_DIRECTOR", "MANAGING_DIRECTOR");

  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<unknown>(null);
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
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!canAccess) {
    return (
      <div className="space-y-6 p-8">
        <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
          <Link href="/leave" className="text-primary hover:underline">
            Leave Management
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium text-foreground">Public Holidays</span>
        </nav>

        <PageHeader
          title="Public Holidays"
          subtitle="You don’t have permission to manage public holidays."
        />
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm font-medium text-foreground">Access denied</p>
              <p className="mt-1 text-sm text-muted-foreground">
                If you need access, contact HR.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link href="/leave" className="text-primary hover:underline">
          Leave Management
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">Public Holidays</span>
      </nav>

      <PageHeader
        title="Public Holidays"
        subtitle="Upload a CSV to create or update public holidays for highlighting and working-day calculations."
      />

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Upload holidays CSV</p>
          <p className="text-xs text-muted-foreground">
            Format: <span className="font-mono">name,date</span> (YYYY-MM-DD)
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground transition hover:bg-muted/40">
            <span className="truncate">
              {fileName ? fileName : "Choose holidays.csv"}
            </span>
            <UploadCloud className="h-4 w-4 text-muted-foreground" />
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
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
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
              <CheckCircle className="mt-0.5 h-4 w-4" />
              <div className="min-w-0">
                <p className="font-medium text-foreground">Upload complete</p>
                <p className="mt-1 text-xs text-muted-foreground">Result:</p>
                <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-black/5 p-3 text-[11px] leading-relaxed text-foreground dark:bg-white/5">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

