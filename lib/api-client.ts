function toErrorMessage(data: unknown): string | undefined {
  if (!data) return undefined;
  if (typeof data === "string") return data;
  if (typeof data === "number" || typeof data === "boolean") return String(data);

  if (Array.isArray(data)) {
    const parts = data
      .map((v) => toErrorMessage(v))
      .filter((v): v is string => !!v);
    return parts.length ? parts.join("\n") : undefined;
  }

  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;

    // Common API patterns
    const directKeys = ["detail", "message", "error", "errors"] as const;
    for (const k of directKeys) {
      if (k in obj) {
        const msg = toErrorMessage(obj[k]);
        if (msg) return msg;
      }
    }

    // DRF / validation error objects: { field: ["msg"], other_field: ["msg"] }
    const entries = Object.entries(obj);
    if (!entries.length) return undefined;

    const lines: string[] = [];
    for (const [key, value] of entries) {
      const msg = toErrorMessage(value);
      if (!msg) continue;
      const compact = msg.replace(/\n+/g, "; ");
      lines.push(`${key}: ${compact}`);
    }
    if (lines.length) return lines.join("\n");

    // Last resort: render the raw payload
    try {
      return JSON.stringify(obj);
    } catch {
      return undefined;
    }
  }

  return undefined;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    const message = toErrorMessage(data) || "An error occurred";
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    // Backend might return HTML/plain-text for errors; keep it visible.
    const text = await res.text().catch(() => "");
    data = {
      detail: text || res.statusText || `Request failed (${res.status})`,
    };
  }

  if (!res.ok) {
    throw new ApiError(res.status, data);
  }

  return data as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`/api/proxy/${path}`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<T>(res);
}

export async function apiPost<T>(
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`/api/proxy/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function apiPatch<T>(
  path: string,
  body: unknown
): Promise<T> {
  const res = await fetch(`/api/proxy/${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`/api/proxy/${path}`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse<T>(res);
}
