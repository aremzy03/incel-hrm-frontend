"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifications(),
    enabled: open,
  });

  const notifications: NotificationItem[] = data ?? [];

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
    setMounted(true);
  }, []);

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

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
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
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col",
          "border-l border-outline-variant bg-surface-container-lowest shadow-xl",
          "focus:outline-none"
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-outline-variant px-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-on-surface-variant" />
            <h2 className="text-sm font-semibold text-on-surface">Notifications</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary-container px-2 py-0.5 text-[11px] font-bold text-white">
                {unreadCount} unread
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md p-2 text-on-surface-variant transition hover:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Close notifications"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-outline-variant px-4 py-3">
          <p className="text-xs text-on-surface-variant">
            {isFetching ? "Updating…" : "Latest updates from the HR portal."}
          </p>
          <button
            type="button"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending || notifications.length === 0}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-outline-variant px-3 py-2 text-xs font-medium text-on-surface transition hover:bg-surface-container-high disabled:opacity-50"
          >
            {markAllMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Mark all read
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-sm text-on-surface-variant">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm font-medium text-on-surface">No notifications</p>
              <p className="mt-1 text-xs text-on-surface-variant">
                You’re all caught up.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {notifications.map((n, idx) => {
                const href = getLeaveHref(n);
                const unread = n.is_read === false;
                const notificationId = n.notification_id;

                return (
                  <li key={`${notificationId}-${n.created_at ?? idx}`}>
                    {href ? (
                      <Link
                        href={href}
                        onClick={onClose}
                        className={cn(
                          "block rounded-xl border border-outline-variant p-4 transition",
                          "hover:bg-surface-container-low",
                          unread && "border-primary-container/30 bg-secondary-container/40"
                        )}
                      >
                        <NotificationRow
                          notification={n}
                          unread={unread}
                          markPending={markOneMutation.isPending}
                          onMarkRead={() => {
                            if (!unread || !notificationId) return;
                            markOneMutation.mutate(notificationId);
                          }}
                        />
                      </Link>
                    ) : (
                      <div
                        className={cn(
                          "rounded-xl border border-outline-variant p-4",
                          unread && "border-primary-container/30 bg-secondary-container/40"
                        )}
                      >
                        <NotificationRow
                          notification={n}
                          unread={unread}
                          markPending={markOneMutation.isPending}
                          onMarkRead={() => {
                            if (!unread || !notificationId) return;
                            markOneMutation.mutate(notificationId);
                          }}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function NotificationRow({
  notification: n,
  unread,
  markPending,
  onMarkRead,
}: {
  notification: NotificationItem;
  unread: boolean;
  markPending: boolean;
  onMarkRead: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-on-surface">{n.title}</p>
        <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant">{n.body}</p>
        <p className="mt-2 text-xs text-on-surface-variant">
          {formatWhen(n.created_at)}
        </p>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onMarkRead();
        }}
        disabled={markPending || !unread}
        className={cn(
          "shrink-0 cursor-pointer rounded-md border border-outline-variant px-2.5 py-2 text-xs font-medium transition",
          "hover:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-ring",
          !unread && "opacity-50"
        )}
        aria-label={unread ? "Mark as read" : "Already read"}
      >
        {markPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          "Read"
        )}
      </button>
    </div>
  );
}
