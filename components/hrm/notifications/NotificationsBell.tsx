"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getUnreadCount } from "@/lib/api/notifications";
import { useNotificationsStream } from "@/lib/notifications/useNotificationsStream";
import type { UnreadCountResponse } from "@/lib/types/notifications";
import { NotificationsDrawer } from "@/components/hrm/notifications/NotificationsDrawer";

export function NotificationsBell() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: () => getUnreadCount(),
    enabled: isAuthenticated,
    refetchOnWindowFocus: true,
  });

  const count = (data as UnreadCountResponse | undefined)?.count ?? 0;

  useNotificationsStream({
    enabled: isAuthenticated,
    onNotification: () => {
      queryClient.setQueryData(["notifications-unread-count"], (prev: unknown) => {
        const p = prev as UnreadCountResponse | undefined;
        const next = (p?.count ?? count) + 1;
        return { count: next } satisfies UnreadCountResponse;
      });
      if (open) {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }
    },
  });

  const badge = useMemo(() => {
    if (!count) return null;
    const label = count > 99 ? "99+" : String(count);
    return (
      <span
        className={cn(
          "absolute -right-0.5 -top-0.5",
          "min-w-[18px] rounded-full bg-destructive px-1.5 py-0.5",
          "text-[10px] font-bold leading-none text-destructive-foreground",
          "ring-2 ring-sidebar"
        )}
        aria-label={`${count} unread notifications`}
      >
        {label}
      </span>
    );
  }, [count]);

  return (
    <>
      <button
        aria-label="Notifications"
        onClick={() => setOpen(true)}
        className="relative rounded-md p-2 text-sidebar-foreground transition hover:bg-sidebar-accent focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <Bell className="h-4 w-4" />
        {badge}
      </button>

      <NotificationsDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}

