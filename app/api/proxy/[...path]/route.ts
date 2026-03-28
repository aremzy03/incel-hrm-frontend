import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { isMutatingBffOriginAllowed } from "@/lib/allowedOrigins";
import {
  applyRefreshedTokensToJar,
  fetchRefreshedTokens,
} from "@/lib/hrmSession";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

async function proxyRequest(
  req: NextRequest,
  params: { path: string[] }
): Promise<NextResponse> {
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

  const headers: Record<string, string> = {};
  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;
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
