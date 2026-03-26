import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const res = await fetch(`${API_URL}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => ({}));
  return (data as { access?: string }).access ?? null;
}

async function fetchStream(accessToken?: string | null) {
  const headers: Record<string, string> = {
    Accept: "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  const base = API_URL.replace(/\/+$/, "");
  const hasApiV1 = /\/api\/v1$/i.test(base);
  const streamUrl = hasApiV1
    ? `${base}/notifications/stream/`
    : `${base}/api/v1/notifications/stream/`;
  return fetch(streamUrl, {
    method: "GET",
    headers,
  });
}

export async function GET() {
  const jar = await cookies();
  let accessToken = jar.get("hrm_access")?.value ?? null;
  const refreshToken = jar.get("hrm_refresh")?.value ?? null;

  let upstream = await fetchStream(accessToken);

  if (upstream.status === 401 && refreshToken) {
    const newAccess = await refreshAccessToken(refreshToken);
    if (newAccess) {
      jar.set("hrm_access", newAccess, {
        ...COOKIE_OPTIONS,
        maxAge: 60 * 60 * 24,
      });
      accessToken = newAccess;
      upstream = await fetchStream(accessToken);
    } else {
      jar.delete("hrm_access");
      jar.delete("hrm_refresh");
      return new Response(
        JSON.stringify({ detail: "Session expired. Please log in again." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return new Response(text || "Failed to connect to notifications stream.", {
      status: upstream.status,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const headers = new Headers();
  headers.set("Content-Type", "text/event-stream");
  headers.set("Cache-Control", "no-cache, no-transform");
  headers.set("Connection", "keep-alive");

  return new Response(upstream.body, {
    status: 200,
    headers,
  });
}

