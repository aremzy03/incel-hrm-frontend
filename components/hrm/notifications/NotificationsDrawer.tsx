"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications";
import type { NotificationItem } from "@/lib/types/notifications";

function formatWhen(ts: string) {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLeaveHref(n: NotificationItem): string | null {
  const id = n.data?.leave_request_id;
  return id ? `/leave/requests/${id}` : null;
}

export function NotificationsDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const panelRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifications(),
    enabled: open,
  });

  const notifications: NotificationItem[] = Array.isArray(data)
    ? data
    : ((data as { results?: NotificationItem[] } | undefined)?.results ?? []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.is_read === false).length,
    [notifications]
  );

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      await queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      await queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        className={cn(
          "absolute right-0 top-0 h-full w-full max-w-md",
          "border-l border-border bg-background shadow-xl",
          "focus:outline-none"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                {unreadCount} unread
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Close notifications"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {isFetching ? "Updating…" : "Latest updates from the HR portal."}
          </p>
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending || notifications.length === 0}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            {markAllMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Mark all read
          </button>
        </div>

        <div className="h-[calc(100%-7rem)] overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm font-medium text-foreground">No notifications</p>
              <p className="mt-1 text-xs text-muted-foreground">
                You’re all caught up.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {notifications.map((n, idx) => {
                const href = getLeaveHref(n);
                const unread = n.is_read === false;
                const Wrapper: React.ElementType = href ? Link : "div";
                const wrapperProps = href ? { href } : {};

                return (
                  <li key={`${n.notification_id}-${n.created_at ?? idx}`}>
                    <Wrapper
                      {...wrapperProps}
                      className={cn(
                        "block rounded-xl border border-border p-4 transition",
                        "hover:bg-muted/50",
                        unread && "border-primary/30 bg-primary/5"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {n.title}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {n.body}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {formatWhen(n.created_at)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!unread) return;
                            markOneMutation.mutate(n.notification_id);
                          }}
                          disabled={
                            markOneMutation.isPending ||
                            !unread
                          }
                          className={cn(
                            "shrink-0 rounded-md border border-border px-2.5 py-2 text-xs font-medium transition",
                            "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring",
                            !unread && "opacity-50"
                          )}
                          aria-label={unread ? "Mark as read" : "Already read"}
                        >
                          {markOneMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "Read"
                          )}
                        </button>
                      </div>
                    </Wrapper>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

