import { useEffect, useRef } from "react";

type OnNotification = (payload: unknown) => void;

export function useNotificationsStream({
  enabled,
  onNotification,
}: {
  enabled: boolean;
  onNotification: OnNotification;
}) {
  const onNotificationRef = useRef<OnNotification>(onNotification);
  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    if (!enabled) return;

    let es: EventSource | null = null;
    let closed = false;
    let retryMs = 1000;
    const maxRetryMs = 15000;

    const connect = () => {
      if (closed) return;
      es = new EventSource("/api/notifications/stream");

      es.addEventListener("notification", (ev) => {
        try {
          const msg = ev as MessageEvent<string>;
          const payload = msg.data ? JSON.parse(msg.data) : null;
          onNotificationRef.current(payload);
        } catch {
          onNotificationRef.current(null);
        }
      });

      es.addEventListener("ready", () => {
        retryMs = 1000;
      });

      es.onerror = () => {
        es?.close();
        es = null;
        if (closed) return;
        const t = window.setTimeout(() => connect(), retryMs);
        retryMs = Math.min(maxRetryMs, Math.floor(retryMs * 1.8));
        return () => window.clearTimeout(t);
      };
    };

    connect();

    return () => {
      closed = true;
      es?.close();
    };
  }, [enabled]);
}

