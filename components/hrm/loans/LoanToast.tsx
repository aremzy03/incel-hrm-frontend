"use client";

import { useCallback, useRef, useState } from "react";
import { CheckCircle } from "lucide-react";

export function useLoanToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(msg);
    timerRef.current = setTimeout(() => setMessage(null), 3500);
  }, []);

  const Toast =
    message !== null ? (
      <div
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-lg"
        role="status"
      >
        <CheckCircle className="h-4 w-4 text-green-600" />
        {message}
      </div>
    ) : null;

  return { showToast, Toast };
}
