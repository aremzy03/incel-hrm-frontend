"use client";

import { useEffect, useId, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stitchCardClass } from "@/lib/design/field-styles";
import { cn } from "@/lib/utils";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function SettingsLiveRegion({ message }: { message: string }) {
  return (
    <p className="sr-only" aria-live="polite" aria-atomic="true">
      {message}
    </p>
  );
}

export function SettingsQueryPanel({
  isLoading,
  isError,
  onRetry,
  errorTitle,
  errorHint,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  errorTitle: string;
  errorHint: string;
  children: React.ReactNode;
}) {
  if (isLoading) {
    return (
      <div
        className="h-48 animate-pulse rounded-xl bg-surface-container-high"
        aria-busy="true"
      />
    );
  }
  if (isError) {
    return (
      <div
        className={cn(stitchCardClass, "px-6 py-10 text-center")}
        role="alert"
      >
        <p className="text-body-md text-on-surface">{errorTitle}</p>
        <p className="mt-1 text-body-md text-on-surface-variant">{errorHint}</p>
        <Button
          type="button"
          size="lg"
          className="mt-4 min-h-11 rounded-xl px-6"
          onClick={onRetry}
        >
          Try again
        </Button>
      </div>
    );
  }
  return <>{children}</>;
}

export function SettingsDialog({
  title,
  onClose,
  children,
  closeOnBackdrop = true,
  className,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  closeOnBackdrop?: boolean;
  className?: string;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const nodes = () =>
      Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    nodes()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnBackdrop) {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const list = nodes();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [closeOnBackdrop, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="absolute inset-0 bg-black/30"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className={cn(
          "relative max-h-[min(88vh,720px)] w-full max-w-md overflow-y-auto rounded-xl border border-outline-variant bg-surface-container-lowest p-6 custom-shadow",
          className
        )}
      >
        <h2 id={titleId} className="text-title-sm font-semibold text-on-surface">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

export function SettingsConfirmDialog({
  title,
  body,
  confirmLabel,
  destructive,
  isPending,
  onClose,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <SettingsDialog title={title} onClose={onClose} closeOnBackdrop={!isPending}>
      <p className="mt-2 text-body-md text-on-surface-variant">{body}</p>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-11 rounded-xl"
          disabled={isPending}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant={destructive ? "destructive" : "default"}
          size="lg"
          className="min-h-11 rounded-xl"
          disabled={isPending}
          autoFocus
          onClick={onConfirm}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {confirmLabel}
        </Button>
      </div>
    </SettingsDialog>
  );
}
