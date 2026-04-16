export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    const detail =
      typeof (data as any)?.detail === "string"
        ? ((data as any).detail as string)
        : typeof data === "string"
          ? data
          : undefined;
    const message = detail || "An error occurred";
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
