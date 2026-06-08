import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { isMutatingBffOriginAllowed } from "@/lib/allowedOrigins";
import {
  applyRefreshedTokensToJar,
  fetchRefreshedTokens,
} from "@/lib/hrmSession";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

function isEventStreamRequest(req: NextRequest, targetPath: string): boolean {
  const accept = req.headers.get("accept") ?? "";
  if (accept.includes("text/event-stream")) return true;
  const normalized = targetPath.replace(/\/+$/, "");
  return normalized === "notifications/stream";
}

function eventStreamResponse(upstream: Response): Response {
  const headers = new Headers();
  headers.set("Content-Type", "text/event-stream");
  headers.set("Cache-Control", "no-cache, no-transform");
  headers.set("Connection", "keep-alive");

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}

async function proxyRequest(
  req: NextRequest,
  params: { path: string[] }
): Promise<NextResponse | Response> {
  const method = req.method;
  if (
    (method === "POST" || method === "PATCH" || method === "DELETE") &&
    !isMutatingBffOriginAllowed(req)
  ) {
    return NextResponse.json({ detail: "Invalid origin." }, { status: 403 });
  }

  const jar = await cookies();
  const accessToken = jar.get("hrm_access")?.value;
  const refreshToken = jar.get("hrm_refresh")?.value;

  const targetPath = params.path.join("/");
  const url = new URL(req.url);
  const queryString = url.search;
  const targetUrl = queryString
    ? `${API_URL.replace(/\/+$/, "")}/${targetPath.replace(/^\//, "")}${queryString}`
    : `${API_URL.replace(/\/+$/, "")}/${targetPath.replace(/^\//, "")}/`;

  const wantsEventStream = isEventStreamRequest(req, targetPath);

  const headers: Record<string, string> = {};
  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;
  if (wantsEventStream) {
    headers["Accept"] = "text/event-stream";
    headers["Cache-Control"] = "no-cache";
    headers["Connection"] = "keep-alive";
  }
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const body =
    method !== "GET" && method !== "HEAD" ? await req.text() : undefined;

  let res = await fetch(targetUrl, {
    method,
    headers,
    body,
  });

  if (res.status === 401 && refreshToken) {
    const tokens = await fetchRefreshedTokens(refreshToken);
    if (tokens) {
      applyRefreshedTokensToJar(jar, tokens);
      headers["Authorization"] = `Bearer ${tokens.access}`;
      res = await fetch(targetUrl, {
        method,
        headers,
        body,
      });
    } else {
      jar.delete("hrm_access");
      jar.delete("hrm_refresh");
      return NextResponse.json(
        { detail: "Session expired. Please log in again." },
        { status: 401 }
      );
    }
  }

  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const ct = res.headers.get("content-type") ?? "";
  if (
    (wantsEventStream || ct.includes("text/event-stream")) &&
    res.body
  ) {
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return new Response(text || "Failed to connect to event stream.", {
        status: res.status,
        headers: { "Content-Type": "text/plain" },
      });
    }
    return eventStreamResponse(res);
  }
  if (ct.includes("application/json")) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  }

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": ct || "text/plain" },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, await params);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, await params);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, await params);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, await params);
}
