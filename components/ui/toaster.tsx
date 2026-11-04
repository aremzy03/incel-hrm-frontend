"use client";

import { useEffect, useState } from "react";
import { subscribeToasts, toast, type ToastMessage } from "@/lib/toast";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return subscribeToasts(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-6 right-6 z-50 flex max-w-md flex-col gap-2.5 pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.type === "error" ? "alert" : "status"}
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 duration-200",
            t.type === "success" &&
              "border-emerald-500/20 bg-emerald-50/95 text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-950/90 dark:text-emerald-100",
            t.type === "error" &&
              "border-destructive/20 bg-destructive/10 text-destructive dark:border-destructive/30 dark:bg-destructive/20 dark:text-red-200",
            t.type === "info" &&
              "border-border bg-card text-foreground dark:border-border dark:bg-card"
          )}
        >
          {t.type === "success" && (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          )}
          {t.type === "error" && (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          )}
          {t.type === "info" && (
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          )}

          <div className="flex-1 text-sm font-medium leading-snug">
            {t.message}
          </div>

          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            className="rounded-md p-1 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
